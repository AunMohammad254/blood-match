import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ChatRequestLog } from "@/lib/models/ChatRequestLog";
import { verifyAuth } from "@/lib/middleware/auth";
import { ChatHistory } from "@/lib/models/ChatHistory";

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

    const oneMinuteAgo = new Date(Date.now() - 60000);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert messages to Gemini format.
    // Gemini requires: history must start with role "user" and alternate user/model.
    // We exclude the last message (sent via sendMessage) and drop any leading assistant messages.
    const allButLast = messages.slice(0, -1);

    // Find the first user message index — drop everything before it
    const firstUserIdx = allButLast.findIndex(
      (m: { role: string }) => m.role === "user"
    );

    const validHistory = (firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx))
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const lastMessage = messages[messages.length - 1];

    // Priority models
    const models = [
      { id: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash", limit: 4 },
      { id: "gemini-3-flash-preview", displayName: "Gemini 3 Flash", limit: 4 },
      { id: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash Lite", limit: 14 }
    ];

    let responseSent = false;
    let finalReply = null;
    let finalModel = null;
    let finalAction = null;
    let lastError = null;

    for (const modelCfg of models) {
      // Check current rate limit count
      const count = await ChatRequestLog.countDocuments({
        ip,
        modelName: modelCfg.id,
        timestamp: { $gte: oneMinuteAgo }
      });

      if (count >= modelCfg.limit) {
        console.warn(`[POST /api/chat] Rate limit hit for model ${modelCfg.id} by IP ${ip} (${count}/${modelCfg.limit} reqs in last min)`);
        continue; // Fallback to next model
      }

      // Log the attempt
      await ChatRequestLog.create({
        ip,
        modelName: modelCfg.id,
        timestamp: new Date()
      });

      try {
        const model = genAI.getGenerativeModel({
          model: modelCfg.id,
          systemInstruction: SYSTEM_PROMPT,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "searchDonors",
                  description: "Search for active compatible blood donors by blood type and city on BloodMatch.",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      bloodType: {
                        type: SchemaType.STRING,
                        description: "The blood type to search for (e.g., A+, O-, B+)."
                      },
                      city: {
                        type: SchemaType.STRING,
                        description: "The city to filter donors by (e.g., Karachi, Lahore, Islamabad)."
                      }
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
                      patientName: { type: SchemaType.STRING, description: "Name of the patient." },
                      bloodType: { type: SchemaType.STRING, description: "Blood type needed." },
                      units: { type: SchemaType.NUMBER, description: "Number of blood units needed (1-20)." },
                      hospital: { type: SchemaType.STRING, description: "Hospital name." },
                      city: { type: SchemaType.STRING, description: "City name." },
                      urgency: { type: SchemaType.STRING, description: "Urgency level: normal, urgent, or critical." },
                      contactPhone: { type: SchemaType.STRING, description: "Contact phone number." }
                    },
                    required: ["bloodType"]
                  }
                },
                {
                  name: "toggleAvailability",
                  description: "Toggle the current logged-in donor's availability status (available or unavailable).",
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      isAvailable: { type: SchemaType.BOOLEAN, description: "The target availability status (true to be active/available, false to be inactive)." }
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
        } catch (e) {
          // No text response generated (common during pure function calling)
        }

        const functionCalls = result.response.functionCalls();
        let action = null;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          const args = call.args as any;
          action = {
            type: call.name,
            parameters: args
          };
          
          if (!text) {
            if (call.name === "searchDonors") {
              text = `I've prepared a search for compatible ${args.bloodType} blood donors${args.city ? ` in ${args.city}` : ""}. Click the button below to view matches.`;
            } else if (call.name === "createRequest") {
              text = `I've prepared a draft request for ${args.units || 1} unit(s) of ${args.bloodType} blood${args.patientName ? ` for ${args.patientName}` : ""}${args.hospital ? ` at ${args.hospital}` : ""}. Click the button below to open and review the request form.`;
            } else if (call.name === "toggleAvailability") {
              text = `I understand you want to set your availability status to ${args.isAvailable ? "Available" : "Unavailable"}. Click the button below to confirm.`;
            }
          }
        }

        finalReply = text || "I've processed that action for you. Check the button below!";
        finalModel = modelCfg.displayName;
        finalAction = action;
        responseSent = true;
        break; // Successfully got reply, exit loop
      } catch (err: any) {
        console.warn(`[POST /api/chat] Model ${modelCfg.id} fallback trigger: ${err.message || err}`);
        lastError = err;
        // Continue to fallback
      }
    }

    if (responseSent) {
      let savedSessionId = chatSessionId;

      // Handle chat history saving if user is logged in
      const decodedUser = verifyAuth(req);
      if (decodedUser) {
        try {
          const userMessage = lastMessage;
          const assistantReply = { role: "assistant", content: finalReply, model: finalModel };

          if (savedSessionId) {
            // Update existing session
            const updatedSession = await ChatHistory.findOneAndUpdate(
              { _id: savedSessionId, userId: decodedUser.userId },
              {
                $push: {
                  messages: {
                    $each: [
                      { role: "user", content: userMessage.content },
                      { role: "assistant", content: assistantReply.content, model: assistantReply.model }
                    ]
                  }
                }
              },
              { new: true }
            );
            if (!updatedSession) {
              // If session was deleted or not found, clear it to force new session creation
              savedSessionId = null;
            }
          }

          if (!savedSessionId) {
            // Check session limit (max 5)
            const count = await ChatHistory.countDocuments({ userId: decodedUser.userId });
            if (count >= 5) {
              // Delete the oldest session
              const oldest = await ChatHistory.findOne({ userId: decodedUser.userId }).sort({ updatedAt: 1 });
              if (oldest) {
                await ChatHistory.deleteOne({ _id: oldest._id });
              }
            }

            // Create title from user query
            let title = userMessage.content.trim();
            if (title.length > 30) {
              title = title.substring(0, 27) + "...";
            }

            // Create new session
            const newSession = await ChatHistory.create({
              userId: decodedUser.userId,
              title,
              messages: [
                ...validHistory.map((m: any) => ({
                  role: m.role === "model" ? "assistant" : "user",
                  content: m.parts[0].text
                })),
                { role: "user", content: userMessage.content },
                { role: "assistant", content: assistantReply.content, model: assistantReply.model }
              ]
            });
            savedSessionId = newSession._id.toString();
          }
        } catch (dbErr) {
          console.error("[POST /api/chat] Error saving chat history:", dbErr);
        }
      }

      return NextResponse.json({
        reply: finalReply,
        action: finalAction,
        model: finalModel,
        chatSessionId: savedSessionId
      });
    }

    // Check if we hit the rate limits for all models
    const counts = await Promise.all(
      models.map(m =>
        ChatRequestLog.countDocuments({
          ip,
          modelName: m.id,
          timestamp: { $gte: oneMinuteAgo }
        })
      )
    );

    const isAllRateLimited = models.every((m, idx) => counts[idx] >= m.limit);

    if (isAllRateLimited) {
      return NextResponse.json(
        {
          error: "You have exceeded the rate limit on all available AI models (Gemini 3.5 Flash: 4/min, Gemini 3 Flash: 4/min, Gemini 3.1 Flash Lite: 14/min). Please wait a minute before sending another message.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      );
    }

    // If it was another error
    console.error("[POST /api/chat] Chat failed completely:", lastError?.message || lastError);
    return NextResponse.json(
      { error: "AI service error. Please try again later." },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[POST /api/chat] Critical error:", err.message || err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
