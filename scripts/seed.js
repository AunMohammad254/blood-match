/**
 * BloodMatch MongoDB Seed Script
 * ================================
 * Run with mongosh:
 *   mongosh "mongodb+srv://aunmohammad254_db_user:wPCrDIEjKwQ9PmTv@cluster0.dyb2dkx.mongodb.net/bloodmatch" --file scripts/seed.js
 *
 * This will:
 *   1. Drop existing users and blood requests (clean seed)
 *   2. Insert sample donors and recipients
 *   3. Insert sample blood requests
 *   4. Create compound indexes for performance
 */

const DB_NAME = "bloodmatch";
const db = db.getSiblingDB(DB_NAME);

print("🩸 BloodMatch Seed Script Starting...");
print("📂 Using database: " + DB_NAME);

// ─── Drop existing data ────────────────────────────────────────────────────
print("\n⚠️  Clearing existing collections...");
db.users.drop();
db.bloodrequests.drop();
print("✅ Collections dropped.");

// ─── Password hash for "secret123" (bcrypt, 10 rounds) ────────────────────
// bcrypt hash of "secret123" (10 rounds) — verified correct
const defaultPasswordHash = "$2a$10$5m2kNRet.9H1bx7XOhKDUe0sJzYQh8s/P/pPNjBXXeVA0nXtlmJKa";

// ─── Seed Users ───────────────────────────────────────────────────────────
print("\n👥 Seeding users...");

const now = new Date();

const users = [
  {
    name: "Aun Abbas",
    email: "aun@example.com",
    password: defaultPasswordHash,
    phone: "03001234567",
    bloodType: "B+",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Dr. Salman",
    email: "recipient@example.com",
    password: defaultPasswordHash,
    phone: "03111112222",
    bloodType: "A+",
    city: "Karachi",
    role: "recipient",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Hassan Ali",
    email: "hassan@example.com",
    password: defaultPasswordHash,
    phone: "03001234567",
    bloodType: "O-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Omar Farooq",
    email: "omar@example.com",
    password: defaultPasswordHash,
    phone: "03001112222",
    bloodType: "O-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Bilal Ahmed",
    email: "bilal@example.com",
    password: defaultPasswordHash,
    phone: "03211234567",
    bloodType: "B+",
    city: "Lahore",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Ayesha Malik",
    email: "ayesha@example.com",
    password: defaultPasswordHash,
    phone: "03331234567",
    bloodType: "AB+",
    city: "Islamabad",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Fahad Mustafa",
    email: "fahad@example.com",
    password: defaultPasswordHash,
    phone: "03009998888",
    bloodType: "A-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Sara Khan",
    email: "sara@example.com",
    password: defaultPasswordHash,
    phone: "03007776666",
    bloodType: "O+",
    city: "Lahore",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Zainab Hussain",
    email: "zainab@example.com",
    password: defaultPasswordHash,
    phone: "03459876543",
    bloodType: "AB-",
    city: "Rawalpindi",
    role: "donor",
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: "Tariq Mehmood",
    email: "tariq@example.com",
    password: defaultPasswordHash,
    phone: "03218765432",
    bloodType: "A+",
    city: "Faisalabad",
    role: "donor",
    isAvailable: false,
    createdAt: now,
    updatedAt: now,
  },
];

const insertedUsers = db.users.insertMany(users);
print("✅ Inserted " + insertedUsers.insertedIds.length + " users.");

// Get recipient ID for blood requests
const recipient = db.users.findOne({ email: "recipient@example.com" });
const recipientId = recipient._id;

// ─── Seed Blood Requests ──────────────────────────────────────────────────
print("\n🩸 Seeding blood requests...");

const thirtyMinsAgo = new Date(Date.now() - 1000 * 60 * 30);
const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 120);
const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 48);

const bloodRequests = [
  {
    patientName: "Zara Khan",
    bloodType: "AB-",
    units: 2,
    hospital: "Aga Khan Hospital",
    city: "Karachi",
    urgency: "critical",
    contactPhone: "03111234567",
    requestedBy: recipientId,
    status: "open",
    createdAt: thirtyMinsAgo,
    updatedAt: now,
  },
  {
    patientName: "Ahmed Raza",
    bloodType: "B+",
    units: 3,
    hospital: "Shaukat Khanum Hospital",
    city: "Lahore",
    urgency: "urgent",
    contactPhone: "03221234567",
    requestedBy: recipientId,
    status: "open",
    createdAt: twoHoursAgo,
    updatedAt: now,
  },
  {
    patientName: "Tariq Jamil",
    bloodType: "O-",
    units: 1,
    hospital: "PIMS Hospital",
    city: "Islamabad",
    urgency: "normal",
    contactPhone: "03331234567",
    requestedBy: recipientId,
    status: "open",
    createdAt: oneDayAgo,
    updatedAt: now,
  },
  {
    patientName: "Fatima Bhutto",
    bloodType: "A+",
    units: 2,
    hospital: "South City Hospital",
    city: "Karachi",
    urgency: "urgent",
    contactPhone: "03005554444",
    requestedBy: recipientId,
    status: "open",
    createdAt: twoDaysAgo,
    updatedAt: now,
  },
  {
    patientName: "Rafiq Siddiqui",
    bloodType: "O+",
    units: 4,
    hospital: "Services Hospital",
    city: "Lahore",
    urgency: "critical",
    contactPhone: "03009871234",
    requestedBy: recipientId,
    status: "open",
    createdAt: thirtyMinsAgo,
    updatedAt: now,
  },
];

const insertedRequests = db.bloodrequests.insertMany(bloodRequests);
print("✅ Inserted " + insertedRequests.insertedIds.length + " blood requests.");

// ─── Create Indexes ────────────────────────────────────────────────────────
print("\n📑 Creating indexes...");

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ bloodType: 1, city: 1 });
db.users.createIndex({ role: 1, isAvailable: 1 });

// BloodRequest indexes
db.bloodrequests.createIndex({ status: 1, createdAt: -1 });
db.bloodrequests.createIndex({ bloodType: 1, city: 1, status: 1 });
db.bloodrequests.createIndex({ requestedBy: 1, status: 1 });

print("✅ Indexes created.");

// ─── Summary ──────────────────────────────────────────────────────────────
print("\n📊 Seed Summary:");
print("   Users:          " + db.users.countDocuments());
print("   Blood Requests: " + db.bloodrequests.countDocuments());
print("   Donors:         " + db.users.countDocuments({ role: "donor" }));
print("   Recipients:     " + db.users.countDocuments({ role: "recipient" }));
print("\n🎉 BloodMatch database seeded successfully!");
print("\n💡 Login credentials (all users share password: secret123):");
print("   Donor:     aun@example.com / secret123");
print("   Recipient: recipient@example.com / secret123");
