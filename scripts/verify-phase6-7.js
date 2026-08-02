import mongoose from "mongoose";
import { User } from "../src/lib/models/User.ts";
import { BloodRequest } from "../src/lib/models/BloodRequest.ts";
import { detectDuplicateRequest } from "../src/lib/duplicate-detector.ts";
import { classifyRequestUrgency } from "../src/lib/ai/gemini.ts";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined.");
  process.exit(1);
}

async function runPhase6And7Verification() {
  console.log("==================================================");
  console.log("🩸 BloodMatch — Phase 6 & 7 Verification Suite");
  console.log("==================================================\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ [1/4] Connected to MongoDB.");

    const attendant = await User.findOne({ role: "patient_attendant" });
    if (!attendant) {
      console.error("❌ Patient attendant account not found in DB.");
      process.exit(1);
    }

    // Step 1: Duplicate Detection Heuristic Test
    console.log("\n🔎 [2/4] Testing Heuristic Duplicate Request Detection...");
    await BloodRequest.deleteMany({ patientName: "Duplicate Test Patient" });

    const primaryRequest = await BloodRequest.create({
      patientName: "Duplicate Test Patient",
      bloodType: "B+",
      units: 2,
      hospital: "Civil Hospital",
      city: "Karachi",
      urgency: "urgent",
      contactPhone: "03001234567",
      requestedBy: attendant._id,
      status: "pending",
      isVerified: false,
    });

    console.log(`   ✓ Primary request created ID: ${primaryRequest._id}`);

    const dupResult = await detectDuplicateRequest({
      patientName: "Duplicate Test Patient",
      hospital: "Civil Hospital",
      city: "Karachi",
      bloodType: "B+",
      windowHours: 24,
      excludeRequestId: "some-new-request-id",
    });

    console.log(`   ✓ Duplicate Check Result: isDuplicate = ${dupResult.isDuplicate}`);
    console.log(`   ✓ Duplicate Count: ${dupResult.duplicateCount}`);
    console.log(`   ✓ Reason: ${dupResult.reason}`);

    if (!dupResult.isDuplicate || dupResult.duplicateCount === 0) {
      throw new Error("Duplicate request heuristic failed to flag matching request.");
    }

    // Step 2: Gemini AI Urgency Classification Test
    console.log("\n🤖 [3/4] Testing Gemini AI Urgency Classification Module...");
    const aiClassification = await classifyRequestUrgency({
      patientName: "Emergency Trauma Patient",
      hospital: "Jinnah Hospital",
      city: "Karachi",
      bloodType: "O-",
      units: 5,
      notes: "Severe hemorrhage following motor vehicle accident. Requires immediate massive transfusion.",
    });

    console.log(`   ✓ AI Urgency Label: '${aiClassification.urgency}'`);
    console.log(`   ✓ AI Confidence: ${aiClassification.confidence}`);
    console.log(`   ✓ AI Reasoning: '${aiClassification.reasoning}'`);
    console.log(`   ✓ AI Assisted Flag: ${aiClassification.isAiAssisted}`);

    // Step 3: Cleanup Test Records
    console.log("\n🧹 [4/4] Cleaning up test database records...");
    await BloodRequest.deleteMany({ patientName: "Duplicate Test Patient" });
    console.log("   ✓ Test records cleaned.");

    console.log("\n==================================================");
    console.log("🎉 PHASES 6 & 7 VERIFICATION PASSED COMPLETELY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Phase 6/7 Verification failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runPhase6And7Verification();
