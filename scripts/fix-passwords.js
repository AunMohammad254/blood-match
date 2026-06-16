// Fix passwords for all seeded users — set to bcrypt hash of "secret123"
const correctHash = "$2a$10$5m2kNRet.9H1bx7XOhKDUe0sJzYQh8s/P/pPNjBXXeVA0nXtlmJKa";

const db = db.getSiblingDB("bloodmatch");

const result = db.users.updateMany(
  {}, // all users
  { $set: { password: correctHash } }
);

print("✅ Updated " + result.modifiedCount + " user passwords to match 'secret123'");

// Verify both test accounts exist
const donor = db.users.findOne({ email: "aun@example.com" });
const recipient = db.users.findOne({ email: "recipient@example.com" });

print("🟢 Donor account:    " + (donor ? donor.name + " (" + donor.email + ")" : "NOT FOUND"));
print("🟢 Recipient account: " + (recipient ? recipient.name + " (" + recipient.email + ")" : "NOT FOUND"));
print("\n💡 Login with: aun@example.com / secret123");
print("💡 Login with: recipient@example.com / secret123");
