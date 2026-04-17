import bcrypt from "bcryptjs";
import Need from "../models/Need.js";
import Volunteer from "../models/Volunteer.js";
import Alert from "../models/Alert.js";
import Match from "../models/Match.js";
import Report from "../models/Report.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Setting from "../models/Setting.js";
import { DEFAULT_SETTINGS, ZONES } from "../config/constants.js";
import { generateNextId } from "./generateId.js";
import { generateMatches } from "../services/aiMatchingService.js";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function seedData() {
  const [needsCount, volunteersCount, alertsCount, usersCount] = await Promise.all([
    Need.countDocuments(),
    Volunteer.countDocuments(),
    Alert.countDocuments(),
    User.countDocuments()
  ]);

  if (needsCount > 0 || volunteersCount > 0 || alertsCount > 0) {
    return { seeded: false };
  }

  const needSeed = [
    {
      title: "23 flood survivors need insulin",
      description: "Emergency insulin support required for flood survivors.",
      category: "Medical",
      urgency: 5,
      location: "District Hospital Camp",
      zone: "Barmer Central",
      status: "Open",
      peopleAffected: 23,
      contactName: "Anita Sharma",
      contactPhone: "9876543210"
    },
    {
      title: "140 families without food",
      description: "Food packets needed in west cluster.",
      category: "Food",
      urgency: 5,
      location: "West Relief Cluster",
      zone: "Barmer East",
      status: "Queued",
      peopleAffected: 140,
      contactName: "Rafiq Khan",
      contactPhone: "9876543211"
    },
    {
      title: "80 families need shelter",
      description: "Temporary tarpaulin and tent support required.",
      category: "Shelter",
      urgency: 4,
      location: "High School Ground",
      zone: "Siwana",
      status: "Open",
      peopleAffected: 80,
      contactName: "Sita Ben",
      contactPhone: "9876543212"
    },
    {
      title: "Water purification kits required",
      description: "Contaminated water source in local village.",
      category: "Water",
      urgency: 3,
      location: "Canal Road Settlement",
      zone: "Pachpadra",
      status: "Open",
      peopleAffected: 56,
      contactName: "Mohanlal",
      contactPhone: "9876543213"
    },
    {
      title: "Children learning material support",
      description: "Books and stationeries for temporary camp school.",
      category: "Education",
      urgency: 2,
      location: "Relief School Zone",
      zone: "Balotra",
      status: "Open",
      peopleAffected: 120,
      contactName: "Kavita Devi",
      contactPhone: "9876543214"
    }
  ];

  for (const item of needSeed) {
    await Need.create({ ...item, needId: await generateNextId(Need, "needId", "N") });
  }

  const volunteerSeed = [
    ["Nisha Rathore", "Paramedic", "Barmer Central", "On Route", 4.9, 2500, 32],
    ["Faizan Khan", "Logistics", "Siwana", "Available", 4.7, 2100, 26],
    ["Arjun Meena", "Rescue Lead", "Balotra", "Assigned", 4.8, 2280, 29],
    ["Pooja Solanki", "Nursing", "Barmer East", "Available", 4.6, 1980, 23],
    ["Ravi Meena", "Doctor", "Barmer Central", "Available", 4.9, 2610, 28],
    ["Sunita Kumari", "Logistics", "Barmer East", "Available", 4.8, 2840, 34],
    ["Vikram Joshi", "Driver", "Gudamalani", "Available", 4.4, 1200, 13],
    ["Neha Chouhan", "Coordinator", "Pachpadra", "Available", 4.5, 1480, 16],
    ["Tarun Singh", "Rescue Lead", "Dhrimanna", "Off Duty", 4.2, 980, 9],
    ["Prakash Mali", "Civil Engineering", "Siwana", "Available", 4.1, 1360, 15],
    ["Hemlata", "Nursing", "Barmer Central", "Available", 4.3, 1110, 11],
    ["Aslam Khan", "Driver", "Barmer East", "On Route", 4.0, 840, 8],
    ["Mahesh", "Coordinator", "Gudamalani", "Available", 4.2, 910, 10],
    ["Dipti Sharma", "Paramedic", "Pachpadra", "Available", 4.7, 1740, 20],
    ["Rajveer", "Rescue Lead", "Balotra", "Available", 4.5, 1540, 17],
    ["Nandini", "Nursing", "Siwana", "Off Duty", 4.4, 1320, 14],
    ["Bhavesh", "Doctor", "Barmer Central", "Available", 4.8, 2360, 26],
    ["Sajid", "Logistics", "Dhrimanna", "Available", 4.1, 940, 9]
  ];

  for (const [name, role, zone, availability, rating, xp, tasksCompleted] of volunteerSeed) {
    await Volunteer.create({
      volunteerId: await generateNextId(Volunteer, "volunteerId", "V"),
      name,
      role,
      skills: [role, role === "Doctor" || role === "Paramedic" || role === "Nursing" ? "Medical" : "Support"],
      zone,
      availability,
      rating,
      xp,
      tasksCompleted,
      phone: "9876500000",
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@saarthi.org`,
      avatar: initials(name)
    });
  }

  const alertSeed = [
    {
      message: "Mobile tower outage affecting volunteer routing in Barmer East",
      severity: "Critical",
      zone: "Barmer East",
      status: "Active"
    },
    {
      message: "Relief shelter occupancy crossed 90% in Siwana camp",
      severity: "High",
      zone: "Siwana",
      status: "Active"
    },
    {
      message: "Road clearance delay reported near NH-68 bridge segment",
      severity: "Moderate",
      zone: "Balotra",
      status: "Active"
    }
  ];

  for (const item of alertSeed) {
    await Alert.create({ ...item, alertId: await generateNextId(Alert, "alertId", "AL") });
  }

  await generateMatches();

  const reportSeed = [
    ["Morning deployment summary", "District Command", "Deployment"],
    ["Volunteer utilization chart", "Operations Cell", "Utilization"],
    ["Critical supplies burn-rate", "Logistics", "Supply"]
  ];

  for (const [title, owner, type] of reportSeed) {
    await Report.create({
      reportId: await generateNextId(Report, "reportId", "REP"),
      title,
      owner,
      type,
      content: {
        icon: "📄",
        summary: `${title} generated for ${owner}`
      },
      generatedAt: new Date(),
      lastUpdated: new Date()
    });
  }

  for (let i = 0; i < 10; i += 1) {
    await ActivityLog.create({
      action: "Seed Activity",
      details: `Generated sample audit entry ${i + 1}`,
      entityType: "System",
      entityId: `seed-${i + 1}`,
      performedBy: "District Command"
    });
  }

  if (usersCount === 0) {
    await User.create({
      name: "Saarthi Admin",
      email: "admin@saarthi.gov",
      password: await bcrypt.hash("saarthi2024", 10),
      role: "admin"
    });
  }

  const settingsCount = await Setting.countDocuments({ key: "global" });
  if (settingsCount === 0) {
    await Setting.create({ key: "global", ...DEFAULT_SETTINGS, zones: ZONES.map((zone) => ({ zone, active: true })) });
  }

  return { seeded: true };
}
