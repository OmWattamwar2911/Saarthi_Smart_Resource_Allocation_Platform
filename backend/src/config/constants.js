export const NEED_CATEGORIES = [
  "Medical",
  "Food",
  "Shelter",
  "Water",
  "Education",
  "Rescue"
];

export const NEED_STATUSES = ["Open", "Assigned", "Queued", "Resolved", "Closed"];

export const VOLUNTEER_ROLES = [
  "Paramedic",
  "Logistics",
  "Rescue Lead",
  "Nursing",
  "Civil Engineering",
  "Doctor",
  "Driver",
  "Coordinator"
];

export const VOLUNTEER_AVAILABILITY = ["Available", "On Route", "Assigned", "Off Duty"];

export const ALERT_SEVERITIES = ["Critical", "High", "Moderate", "Low"];
export const ALERT_STATUSES = ["Active", "Escalated", "Resolved"];

export const MATCH_STATUSES = ["Pending", "Confirmed", "Rejected"];

export const REPORT_TYPES = ["Deployment", "Utilization", "Supply", "Impact", "Donor"];

export const ZONES = [
  "Barmer Central",
  "Barmer East",
  "Siwana",
  "Balotra",
  "Gudamalani",
  "Dhrimanna",
  "Pachpadra"
];

export const ADJACENT_ZONE_MAP = {
  "Barmer Central": ["Barmer East", "Balotra", "Gudamalani"],
  "Barmer East": ["Barmer Central", "Pachpadra", "Siwana"],
  Siwana: ["Barmer East", "Balotra", "Pachpadra"],
  Balotra: ["Barmer Central", "Siwana", "Dhrimanna"],
  Gudamalani: ["Barmer Central", "Dhrimanna"],
  Dhrimanna: ["Gudamalani", "Balotra"],
  Pachpadra: ["Barmer East", "Siwana"]
};

export const DEFAULT_SETTINGS = {
  zones: ZONES.map((zone) => ({ zone, active: true })),
  notifications: {
    email: true,
    sms: false,
    inApp: true
  },
  platformMode: "Glass Command-Center",
  theme: "light"
};
