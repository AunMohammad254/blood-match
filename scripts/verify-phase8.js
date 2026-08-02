import mongoose from "mongoose";
import { ErrorLog } from "../src/lib/models/ErrorLog.ts";
import { logger } from "../src/lib/logger.ts";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined.");
  process.exit(1);
}

async function runPhase8Verification() {
  console.log("==================================================");
  console.log("🩸 BloodMatch — Phase 8 Error Tracking Verification");
  console.log("==================================================\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ [1/4] Connected to MongoDB.");

    // Clean prior test logs
    await ErrorLog.deleteMany({ route: "/api/test-error-route" });

    // Step 1: Trigger deliberate error logging
    console.log("\n🚨 [2/4] Triggering deliberate error log via logger.error()...");
    logger.error("Deliberate test error for Phase 8 verification", {
      route: "/api/test-error-route",
      userRole: "admin",
      stack: "Error: Simulated failure\n at /api/test-error-route:12",
    });

    // Small delay to allow async persistence
    await new Promise(res => setTimeout(res, 500));

    // Step 2: Query ErrorLog collection directly in MongoDB
    console.log("\n🔍 [3/4] Querying ErrorLog collection in MongoDB...");
    const loggedError = await ErrorLog.findOne({ route: "/api/test-error-route" }).lean();

    if (!loggedError) {
      throw new Error("Deliberate error log entry was not persisted to ErrorLog collection.");
    }

    console.log(`   ✓ Found ErrorLog entry ID: ${loggedError._id}`);
    console.log(`   ✓ Severity: '${loggedError.severity}'`);
    console.log(`   ✓ Route: '${loggedError.route}'`);
    console.log(`   ✓ Message: '${loggedError.message}'`);
    console.log(`   ✓ Stack Summary: '${loggedError.stackSummary}'`);

    // Step 3: Cleanup Test Error Log
    console.log("\n🧹 [4/4] Cleaning up test ErrorLog entries...");
    await ErrorLog.deleteMany({ route: "/api/test-error-route" });
    console.log("   ✓ Test error logs cleaned.");

    console.log("\n==================================================");
    console.log("🎉 PHASE 8 VERIFICATION PASSED COMPLETELY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Phase 8 Verification failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runPhase8Verification();
