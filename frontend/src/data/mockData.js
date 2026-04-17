export const initialNeeds = [
  {
    id: 1,
    urgency: 5,
    title: "23 flood survivors need insulin",
    location: "Barmer Central",
    category: "Medical",
    time: "4 min ago",
    status: "Open"
  },
  {
    id: 2,
    urgency: 5,
    title: "140 families without food",
    location: "Barmer East",
    category: "Food",
    time: "11 min ago",
    status: "Assigned"
  },
  {
    id: 3,
    urgency: 4,
    title: "80 families need shelter",
    location: "Siwana",
    category: "Shelter",
    time: "28 min ago",
    status: "Open"
  },
  {
    id: 4,
    urgency: 3,
    title: "Water filters required at relief camp",
    location: "Balotra",
    category: "Water",
    time: "43 min ago",
    status: "Queued"
  },
  {
    id: 5,
    urgency: 2,
    title: "Child-safe blankets required",
    location: "Gudamalani",
    category: "Shelter",
    time: "58 min ago",
    status: "Open"
  }
];

export const volunteerPool = [
  {
    id: 1,
    name: "Nisha Rathore",
    role: "Paramedic",
    zone: "Barmer Central",
    availability: "On Route",
    rating: 4.9
  },
  {
    id: 2,
    name: "Faizan Khan",
    role: "Logistics",
    zone: "Siwana",
    availability: "Available",
    rating: 4.7
  },
  {
    id: 3,
    name: "Arjun Meena",
    role: "Rescue Lead",
    zone: "Balotra",
    availability: "Assigned",
    rating: 4.8
  },
  {
    id: 4,
    name: "Pooja Solanki",
    role: "Nursing",
    zone: "Barmer East",
    availability: "Available",
    rating: 4.6
  }
];

export const aiRecommendations = [
  {
    id: "M-119",
    need: "23 flood survivors need insulin",
    suggestedTeam: "Rapid Medical Team - Unit 3",
    eta: "18 mins",
    confidence: 96,
    volunteer: "Dr. Ravi Meena",
    volunteerCode: "DR",
    skill: "MBBS",
    distance: "2.1km",
    reason: "Only MBBS-qualified volunteer within 5km. Skills align with insulin administration."
  },
  {
    id: "F-071",
    need: "140 families without food",
    suggestedTeam: "Supply Convoy - West Lane",
    eta: "25 mins",
    confidence: 93,
    volunteer: "Sunita Kumari",
    volunteerCode: "SK",
    skill: "Logistics",
    distance: "0.8km",
    reason: "Logistics background with vehicle access and fastest proximity to site."
  },
  {
    id: "S-044",
    need: "80 families need shelter",
    suggestedTeam: "Camp Setup Team - North",
    eta: "31 mins",
    confidence: 89,
    volunteer: "Arjun Joshi",
    volunteerCode: "AJ",
    skill: "Civil Engineering",
    distance: "4.3km",
    reason: "Civil engineering skills are suitable for emergency shelter structural checks."
  }
];

export const priorityZones = [
  { name: "Barmer Central", score: 82, trend: "+6%" },
  { name: "Barmer East", score: 74, trend: "+9%" },
  { name: "Siwana", score: 63, trend: "+2%" },
  { name: "Balotra", score: 58, trend: "-3%" },
  { name: "Gudamalani", score: 49, trend: "-1%" }
];

export const mapLabels = [
  { name: "Balotra", top: "16%", left: "18%" },
  { name: "Barmer", top: "26%", left: "46%" },
  { name: "Siwana", top: "35%", left: "68%" },
  { name: "Dhorimanna", top: "58%", left: "24%" },
  { name: "Pachpadra", top: "66%", left: "58%" }
];

export const mapPins = [
  {
    id: "pin-1",
    level: "critical",
    title: "Medical emergency - 23 people",
    top: "31%",
    left: "42%"
  },
  {
    id: "pin-2",
    level: "high",
    title: "Food shortage - 140 families",
    top: "42%",
    left: "61%"
  },
  {
    id: "pin-3",
    level: "high",
    title: "Shelter needed - 80 people",
    top: "56%",
    left: "34%"
  },
  {
    id: "pin-4",
    level: "medium",
    title: "Water filters required",
    top: "63%",
    left: "52%"
  },
  {
    id: "pin-5",
    level: "low",
    title: "Child-safe blankets required",
    top: "74%",
    left: "70%"
  }
];

export const alertFeed = [
  {
    id: "AL-901",
    level: "Critical",
    message: "Mobile tower outage affecting volunteer routing in Barmer East.",
    time: "7 min ago"
  },
  {
    id: "AL-882",
    level: "High",
    message: "Relief shelter occupancy crossed 90% in Siwana camp.",
    time: "21 min ago"
  },
  {
    id: "AL-870",
    level: "Moderate",
    message: "Road clearance delay reported near NH-68 bridge segment.",
    time: "34 min ago"
  }
];

export const reportEntries = [
  {
    id: "REP-41",
    report: "Morning deployment summary",
    owner: "District Command",
    updated: "Today, 10:40"
  },
  {
    id: "REP-37",
    report: "Volunteer utilization chart",
    owner: "Operations Cell",
    updated: "Today, 09:15"
  },
  {
    id: "REP-32",
    report: "Critical supplies burn-rate",
    owner: "Logistics",
    updated: "Today, 08:05"
  }
];

export const categorySnapshot = [
  { label: "Medical", value: 18, color: "var(--critical)" },
  { label: "Food", value: 14, color: "var(--high)" },
  { label: "Shelter", value: 8, color: "var(--brand)" },
  { label: "Water", value: 4, color: "#4f46e5" },
  { label: "Education", value: 3, color: "#db2777" }
];

export const weeklyForecast = [
  { day: "Mon", value: 22 },
  { day: "Tue", value: 31 },
  { day: "Wed", value: 47 },
  { day: "Thu", value: 38 },
  { day: "Fri", value: 52 },
  { day: "Sat", value: 44 },
  { day: "Sun", value: 29 }
];

export const leaderboard = [
  { rank: 1, name: "Sunita Kumari", code: "SK", xp: 2840, tasks: 34, badge: "Gold" },
  { rank: 2, name: "Dr. Ravi Meena", code: "DR", xp: 2610, tasks: 28, badge: "Silver" },
  { rank: 3, name: "Arjun Joshi", code: "AJ", xp: 1920, tasks: 21, badge: "Bronze" }
];

export const aiStreamLines = [
  "> Analyzing 3 open needs across Barmer district...",
  "> Loading 18 available volunteer profiles...",
  "> Running skill-location-urgency optimization...",
  "> Prioritization complete: 3 high-confidence matches generated."
];

export const impactMetrics = [
  { label: "Total needs resolved", value: "184" },
  { label: "People directly helped", value: "1,240" },
  { label: "Avg. response time", value: "38 min" },
  { label: "Volunteer hours logged", value: "842 hrs" },
  { label: "AI match accuracy", value: "94.2%" },
  { label: "Districts covered", value: "8 / 28" }
];