import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, closeDB } from "../src/config/db.js";
import { ZONES, DEFAULT_SETTINGS } from "../src/config/constants.js";
import { generateNextId } from "../src/utils/generateId.js";
import User from "../src/models/User.js";
import Need from "../src/models/Need.js";
import Volunteer from "../src/models/Volunteer.js";
import Setting from "../src/models/Setting.js";

dotenv.config();

function nowIso() {
  return new Date().toISOString();
}

async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@saarthi.gov";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe@123456";

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    console.log(`[${nowIso()}] Admin already exists: ${adminEmail}`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await User.create({
    name: "Saarthi Super Admin",
    email: adminEmail,
    password: passwordHash,
    role: "admin"
  });

  console.log(`[${nowIso()}] Admin created: ${admin.email}`);
  return admin;
}

async function seedVolunteers() {
  if (await Volunteer.countDocuments()) {
    console.log(`[${nowIso()}] Volunteers already seeded.`);
    return;
  }

  const seed = [
    ["Ravi Meena", "Doctor", "Barmer Central", "Available", ["Medical", "Triage"]],
    ["Sunita Kumari", "Logistics", "Barmer East", "Available", ["Supply", "Transport"]],
    ["Arjun Singh", "Rescue Lead", "Siwana", "On Route", ["Rescue", "Coordination"]],
    ["Neha Chouhan", "Coordinator", "Pachpadra", "Available", ["Coordination", "Relief Camp"]]
  ];

  for (const [name, role, zone, availability, skills] of seed) {
    await Volunteer.create({
      volunteerId: await generateNextId(Volunteer, "volunteerId", "V"),
      name,
      role,
      zone,
      availability,
      skills,
      phone: "9000000000",
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@saarthi.org`,
      rating: 4.7,
      xp: 1200,
      tasksCompleted: 14,
      isActive: true
    });
  }

  console.log(`[${nowIso()}] Sample volunteers seeded.`);
}

async function seedNeeds() {
  if (await Need.countDocuments()) {
    console.log(`[${nowIso()}] Needs already seeded.`);
    return;
  }

  const sampleNeeds = [
    {
      title: "Flood-affected families need dry ration",
      description: "Immediate food packets for 60 families in temporary shelter.",
      category: "Food",
      urgency: 5,
      location: "Ward 5 Relief Camp",
      zone: "Barmer Central",
      peopleAffected: 60,
      contactName: "Kanta Devi",
      contactPhone: "9888888801"
    },
    {
      title: "Medical team required for fever outbreak",
      description: "Rapid response team needed for camp-level screening.",
      category: "Medical",
      urgency: 4,
      location: "Govt School Shelter",
      zone: "Siwana",
      peopleAffected: 42,
      contactName: "Rahul Joshi",
      contactPhone: "9888888802"
    },
    {
      title: "Temporary shelter material requested",
      description: "Tarpaulin and bedding needed before rainfall.",
      category: "Shelter",
      urgency: 4,
      location: "Canal Road Cluster",
      zone: "Pachpadra",
      peopleAffected: 35,
      contactName: "Amina Bano",
      contactPhone: "9888888803"
    }
  ];

  for (const need of sampleNeeds) {
    await Need.create({
      needId: await generateNextId(Need, "needId", "N"),
      ...need,
      status: "Open"
    });
  }

  console.log(`[${nowIso()}] Sample needs seeded.`);
}

async function seedSettings() {
  const existing = await Setting.findOne({ key: "global" });
  if (existing) {
    console.log(`[${nowIso()}] Global settings already seeded.`);
    return;
  }

  await Setting.create({
    key: "global",
    ...DEFAULT_SETTINGS,
    zones: ZONES.map((zone) => ({ zone, active: true }))
  });

  console.log(`[${nowIso()}] Global settings seeded with zones.`);
}

async function main() {
  try {
    await connectDB();
    await seedAdminUser();
    await seedVolunteers();
    await seedNeeds();
    await seedSettings();
    console.log(`[${nowIso()}] Seed completed successfully.`);
  } catch (error) {
    console.error(`[${nowIso()}] Seed failed:`, error);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

main();
