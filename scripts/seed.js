import mongoose from "mongoose";
import { User } from "@/lib/models/User";
import { BloodRequest } from "@/lib/models/BloodRequest";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in the environment.");
  process.exit(1);
}

const defaultPasswordHash = "$2a$10$5m2kNRet.9H1bx7XOhKDUe0sJzYQh8s/P/pPNjBXXeVA0nXtlmJKa"; // "secret123"

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
  },
  {
    name: "System Admin",
    email: "admin@bloodmatch.com",
    password: defaultPasswordHash,
    phone: "03000000000",
    bloodType: "O+",
    city: "Karachi",
    role: "admin",
    isAvailable: true,
  },
];

async function seed() {
  try {
    console.log("🩸 BloodMatch Seed Script Starting...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    console.log("⚠️ Clearing existing collections...");
    await User.deleteMany({});
    await BloodRequest.deleteMany({});
    console.log("✅ Collections cleared.");

    console.log("👥 Seeding users...");
    const createdUsers = await User.create(users);
    console.log(`✅ Inserted ${createdUsers.length} users.`);

    const recipient = createdUsers.find(u => u.email === "recipient@example.com");
    if (!recipient) {
      throw new Error("Recipient account not found in seeded users.");
    }
    const recipientId = recipient._id;

    console.log("🩸 Seeding blood requests...");
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
      },
    ];

    const createdRequests = await BloodRequest.create(bloodRequests);
    console.log(`✅ Inserted ${createdRequests.length} blood requests.`);

    console.log("\n📊 Seed Summary:");
    const userCount = await User.countDocuments();
    const requestCount = await BloodRequest.countDocuments();
    const donorCount = await User.countDocuments({ role: "donor" });
    const recipientCount = await User.countDocuments({ role: "recipient" });
    const adminCount = await User.countDocuments({ role: "admin" });

    console.log(`   Users:          ${userCount}`);
    console.log(`   Blood Requests: ${requestCount}`);
    console.log(`   Donors:         ${donorCount}`);
    console.log(`   Recipients:     ${recipientCount}`);
    console.log(`   Admins:         ${adminCount}`);

    console.log("\n🎉 BloodMatch database seeded successfully!");
    console.log("\n💡 Login credentials (all users share password: secret123):");
    console.log("   Donor:     aun@example.com / secret123");
    console.log("   Recipient: recipient@example.com / secret123");
    console.log("   Admin:     admin@bloodmatch.com / secret123");

  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
