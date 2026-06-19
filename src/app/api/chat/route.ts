import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ChatRequestLog } from "@/lib/models/ChatRequestLog";
import { verifyAuth } from "@/lib/middleware/auth";
import { ChatHistory } from "@/lib/models/ChatHistory";
import fs from "fs";
import path from "path";

// Helper to extract keywords from user query and match nodes in graph.json
function getGraphContext(queryText: string): string {
  try {
    const graphPath = path.join(process.cwd(), "graphify-out", "graph.json");
    if (!fs.existsSync(graphPath)) return "";

    const graphData = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
    const nodes = graphData.nodes || [];
    const links = graphData.links || [];

    // Extract potential search terms from query (lowercase, alphanumeric keywords longer than 3 chars)
    const terms = queryText
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3);

    if (terms.length === 0) return "";

    // Find nodes matching any of the terms
    const matchedNodes = nodes.filter((node: any) => {
      const label = (node.label || "").toLowerCase();
      const norm = (node.norm_label || "").toLowerCase();
      return terms.some((term) => label.includes(term) || norm.includes(term));
    });

    if (matchedNodes.length === 0) return "";

    // Take top 5 matched nodes
    const topNodes = matchedNodes.slice(0, 5);
    const nodeIds = new Set(topNodes.map((n: any) => n.id));

    // Find links connecting these nodes
    const relevantLinks = links.filter((link: any) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      return nodeIds.has(src) || nodeIds.has(tgt);
    });

    // Build a compact text representation of the subgraph context
    let contextStr = "RELEVANT SYSTEM ARCHITECTURE CONTEXT:\n";
    topNodes.forEach((node: any) => {
      contextStr += `- Node: ${node.label} (${node.file_type || "unknown"}), File: ${node.source_file || "N/A"}\n`;
    });

    if (relevantLinks.length > 0) {
      contextStr += "RELATIONSHIPS:\n";
      relevantLinks.slice(0, 5).forEach((link: any) => {
        const src = typeof link.source === "object" ? link.source.id : link.source;
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        const srcNode = nodes.find((n: any) => n.id === src);
        const tgtNode = nodes.find((n: any) => n.id === tgt);
        if (srcNode && tgtNode) {
          contextStr += `- ${srcNode.label} --[${link.relation || "related_to"}]--> ${tgtNode.label}\n`;
        }
      });
    }

    return contextStr;
  } catch (err) {
    console.error("[getGraphContext] Error:", err);
    return "";
  }
}

const SYSTEM_PROMPT = `You are BloodBot, an AI assistant for BloodMatch — a blood donation emergency matching platform in Pakistan.

Your role is to help users with:
1. Blood type compatibility (e.g., which types can donate to which)
2. How to use the BloodMatch platform (register as donor, post blood requests, find donors)
3. General blood donation facts and medical guidance
4. Emergency blood request guidance
5. FAQs about the platform

PLATFORM INFO:
- BloodMatch connects blood donors to patients in emergencies across 10 major Pakistani cities
- Users can register as a Donor (to offer blood) or as a Recipient (to post blood requests)
- The platform supports all 8 blood types: A+, A-, B+, B-, AB+, AB-, O+, O-
- The system shows blood compatibility — e.g., O- is the universal donor
- Donors can toggle their availability on/off from the dashboard
- Blood requests have 3 urgency levels: normal, urgent, critical

BLOOD COMPATIBILITY REFERENCE:
- O-: Can donate to everyone (universal donor)
- O+: Can donate to O+, A+, B+, AB+
- A-: Can donate to A-, A+, AB-, AB+
- A+: Can donate to A+, AB+
- B-: Can donate to B-, B+, AB-, AB+
- B+: Can donate to B+, AB+
- AB-: Can donate to AB-, AB+
- AB+: Can only donate to AB+ (but can receive from everyone — universal recipient)

TONE: Be concise, warm, and empathetic. This is a life-saving platform — users may be in distress.
Always encourage users to call emergency services (1122 or 115 in Pakistan) for life-threatening emergencies.
Keep responses short unless the user asks for detailed information.`;

let genAIInstance: GoogleGenerativeAI | null = null;

export async function POST(req: Request) {
  try {
    const { messages, chatSessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
    }

    await connectDB();

    // Client IP tracking
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || 
               req.headers.get("x-real-ip") || 
               "127.0.0.1";

    if (!genAIInstance) {
      genAIInstance = new GoogleGenerativeAI(apiKey);
    }
    const genAI = genAIInstance;

    // Token optimization: Keep only the last 6 messages of history (3 turns of conversation)
    const MAX_HISTORY_MESSAGES = 6;
    const historySlice = messages.slice(-1 - MAX_HISTORY_MESSAGES, -1);
    const firstUserIdx = historySlice.findIndex((m: { role: string }) => m.role === "user");
    const validHistory = (firstUserIdx === -1 ? [] : historySlice.slice(firstUserIdx))
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const lastMessage = messages[messages.length - 1];

    // Priority models with adjusted RPM and RPD limits (-1 from standard)
    const models = [
      { id: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash", rpm: 4, rpd: 19 },
      { id: "gemini-3-flash-preview", displayName: "Gemini 3", rpm: 4, rpd: 19 },
      { id: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash Lite", rpm: 14, rpd: 499 }
    ];

    let responseSent = false;
    let finalReply = null;
    let finalModel = null;
    let finalAction = null;
    let lastError = null;
    let allModelsExceeded = true;
    let rateLimitMessage = "";

    for (const modelCfg of models) {
      // Check current RPM count (last 60 seconds) and RPD count (last 24 hours) in parallel
      const [rpmCount, rpdCount] = await Promise.all([
        ChatRequestLog.countDocuments({
          ip,
          modelName: modelCfg.id,
          timestamp: { $gte: new Date(Date.now() - 60000) }
        }),
        ChatRequestLog.countDocuments({
          ip,
          modelName: modelCfg.id,
          timestamp: { $gte: new Date(Date.now() - 86400000) }
        })
      ]);

      if (rpmCount >= modelCfg.rpm) {
        console.warn(`[POST /api/chat] RPM limit hit for ${modelCfg.id} by IP ${ip}`);
        rateLimitMessage = `You've reached the ${modelCfg.rpm} requests per minute limit for our AI models. Please wait a moment.`;
        continue;
      }

      if (rpdCount >= modelCfg.rpd) {
        console.warn(`[POST /api/chat] RPD limit hit for ${modelCfg.id} by IP ${ip}`);
        rateLimitMessage = `You've reached the daily limit of ${modelCfg.rpd} requests for this AI model.`;
        continue;
      }

      allModelsExceeded = false;

      // Log the attempt
      await ChatRequestLog.create({
        ip,
        modelName: modelCfg.id,
        timestamp: new Date()
      });

      try {
        const graphContext = getGraphContext(lastMessage.content);
        const combinedPrompt = graphContext 
          ? `${SYSTEM_PROMPT}\n\n${graphContext}`
          : SYSTEM_PROMPT;

        const model = genAI.getGenerativeModel({
          model: modelCfg.id,
          systemInstruction: combinedPrompt,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "searchDonors",
                  description: "Search for active compatible blood donors by blood type and city on BloodMatch.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      bloodType: { type: SchemaType.STRING, description: "The blood type to search for." },
                      city: { type: SchemaType.STRING, description: "The city to filter donors by." }
                    },
                    required: ["bloodType"]
                  }
                },
                {
                  name: "createRequest",
                  description: "Guide the user to create an emergency blood request by pre-filling request parameters.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      patientName: { type: SchemaType.STRING },
                      bloodType: { type: SchemaType.STRING },
                      units: { type: SchemaType.NUMBER },
                      hospital: { type: SchemaType.STRING },
                      city: { type: SchemaType.STRING },
                      urgency: { type: SchemaType.STRING },
                      contactPhone: { type: SchemaType.STRING }
                    },
                    required: ["bloodType"]
                  }
                },
                {
                  name: "toggleAvailability",
                  description: "Toggle the current logged-in donor's availability status.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      isAvailable: { type: SchemaType.BOOLEAN }
                    },
                    required: ["isAvailable"]
                  }
                }
              ]
            }
          ]
        });

        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(lastMessage.content);
        
        let text = "";
        try {
          text = result.response.text();
        } catch (e) {}

        const functionCalls = result.response.functionCalls();
        let action = null;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          action = { type: call.name, parameters: call.args as any };
          if (!text) {
            if (call.name === "searchDonors") text = `I've prepared a search for compatible ${(call.args as any).bloodType} blood donors. Click below to view.`;
            else if (call.name === "createRequest") text = `I've prepared a draft request for ${(call.args as any).bloodType} blood. Click below to review.`;
            else if (call.name === "toggleAvailability") text = `Confirm changing your status to ${(call.args as any).isAvailable ? "Available" : "Unavailable"}.`;
          }
        }

        finalReply = text || "I've processed that action for you. Check the button below!";
        finalModel = modelCfg.displayName;
        finalAction = action;
        responseSent = true;
        break;
      } catch (err: any) {
        console.warn(`[POST /api/chat] Model ${modelCfg.id} fallback: ${err.message || err}`);
        lastError = err;
      }
    }

    if (responseSent) {
      let savedSessionId = chatSessionId;
      const decodedUser = verifyAuth(req);
      if (decodedUser) {
        try {
          if (savedSessionId) {
            const updatedSession = await ChatHistory.findOneAndUpdate(
              { _id: savedSessionId, userId: decodedUser.userId },
              { $push: { messages: { $each: [{ role: "user", content: lastMessage.content }, { role: "assistant", content: finalReply, model: finalModel }] } } },
              { new: true }
            );
            if (!updatedSession) savedSessionId = null;
          }
          if (!savedSessionId) {
            const count = await ChatHistory.countDocuments({ userId: decodedUser.userId });
            if (count >= 5) {
              const oldest = await ChatHistory.findOne({ userId: decodedUser.userId }).sort({ updatedAt: 1 });
              if (oldest) await ChatHistory.deleteOne({ _id: oldest._id });
            }
            const newSession = await ChatHistory.create({
              userId: decodedUser.userId,
              title: lastMessage.content.trim().substring(0, 30),
              messages: [...validHistory.map((m: any) => ({ role: m.role === "model" ? "assistant" : "user", content: m.parts[0].text })), { role: "user", content: lastMessage.content }, { role: "assistant", content: finalReply, model: finalModel }]
            });
            savedSessionId = newSession._id.toString();
          }
        } catch (dbErr) {
          console.error("[POST /api/chat] History error:", dbErr);
        }
      }
      return NextResponse.json({ reply: finalReply, action: finalAction, model: finalModel, chatSessionId: savedSessionId });
    }

    if (!responseSent && allModelsExceeded) {
      return NextResponse.json({ error: rateLimitMessage || "You have exceeded the rate limit. Please try again later.", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 });
    }

    return NextResponse.json({ error: "AI service error. Please try again later." }, { status: 500 });
  } catch (err: any) {
    console.error("[POST /api/chat] Critical error:", err.message || err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
