const nowIso = new Date().toISOString();

export const needsStore = [
  {
    id: 1,
    urgency: 5,
    desc: "23 flood survivors need insulin - no medical access",
    location: "Barmer Central",
    category: "Medical",
    status: "open",
    time: "4 min ago",
    people: 23,
    createdAt: nowIso,
    updatedAt: nowIso
  },
  {
    id: 2,
    urgency: 5,
    desc: "140 families without food for 48 hrs post-flood",
    location: "Barmer East",
    category: "Food",
    status: "matched",
    time: "11 min ago",
    people: 560,
    createdAt: nowIso,
    updatedAt: nowIso
  },
  {
    id: 3,
    urgency: 4,
    desc: "80 displaced families need emergency shelter",
    location: "Siwana",
    category: "Shelter",
    status: "open",
    time: "28 min ago",
    people: 240,
    createdAt: nowIso,
    updatedAt: nowIso
  }
];

export const volunteersStore = [
  {
    id: 1,
    name: "Sunita Kumari",
    initials: "SK",
    skills: "Logistics, Transport",
    area: "Barmer East",
    tasks: 34,
    xp: 2840,
    status: "available"
  },
  {
    id: 2,
    name: "Dr. Ravi Meena",
    initials: "DR",
    skills: "MBBS, Emergency Care",
    area: "Barmer Central",
    tasks: 28,
    xp: 2610,
    status: "available"
  },
  {
    id: 3,
    name: "Arjun Joshi",
    initials: "AJ",
    skills: "Civil Engineering, Construction",
    area: "Siwana",
    tasks: 21,
    xp: 1920,
    status: "available"
  }
];

export function nextId(items) {
  return items.length ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1 : 1;
}
