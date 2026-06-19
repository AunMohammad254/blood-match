import mongoose from "mongoose";
import { User } from "@/lib/models/User";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in the environment.");
  process.exit(1);
}

const correctHash = "$2a$10$5m2kNRet.9H1bx7XOhKDUe0sJzYQh8s/P/pPNjBXXeVA0nXtlmJKa"; // "secret123"

async function fixPasswords() {
  try {
    console.log("🔒 Fixing passwords for all seeded users...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    const result = await User.updateMany(
      {}, // all users
      { $set: { password: correctHash } }
    );

    console.log(`✅ Updated ${result.modifiedCount} user passwords to match 'secret123'`);

    // Verify both test accounts exist
    const donor = await User.findOne({ email: "aun@example.com" });
    const recipient = await User.findOne({ email: "recipient@example.com" });

    console.log("🟢 Donor account:    " + (donor ? donor.name + " (" + donor.email + ")" : "NOT FOUND"));
    console.log("🟢 Recipient account: " + (recipient ? recipient.name + " (" + recipient.email + ")" : "NOT FOUND"));
    console.log("\n💡 Login with: aun@example.com / secret123");
    console.log("💡 Login with: recipient@example.com / secret123");

  } catch (err) {
    console.error("❌ Fix failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

fixPasswords();
