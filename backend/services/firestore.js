import admin from "firebase-admin";

let db = null;

function initializeFirebase() {
  if (admin.apps.length) {
    db = admin.firestore();
    return db;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
  } else {
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
  }

  db = admin.firestore();
  return db;
}

function getDb() {
  if (!db) {
    db = initializeFirebase();
  }
  return db;
}

function snapshotToObject(docSnap) {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: data.id || docSnap.id
  };
}

async function findDocRefByIdField(collectionName, idField, idValue) {
  const firestore = getDb();
  const querySnap = await firestore
    .collection(collectionName)
    .where(idField, "==", idValue)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    return querySnap.docs[0].ref;
  }

  const fallbackRef = firestore.collection(collectionName).doc(idValue);
  const fallbackSnap = await fallbackRef.get();
  if (fallbackSnap.exists) {
    return fallbackRef;
  }

  return null;
}

function formatMatchId(number) {
  return `M-${String(number).padStart(3, "0")}`;
}

async function getCurrentMaxMatchNumber() {
  const firestore = getDb();
  const snap = await firestore
    .collection("assignments")
    .orderBy("generatedAt", "desc")
    .limit(200)
    .get();

  let maxNumber = 0;
  snap.forEach((docSnap) => {
    const matchId = docSnap.data()?.matchId || "";
    const parsed = Number(String(matchId).replace("M-", ""));
    if (!Number.isNaN(parsed) && parsed > maxNumber) {
      maxNumber = parsed;
    }
  });

  return maxNumber;
}

async function reserveMatchNumbers(count) {
  const firestore = getDb();
  const counterRef = firestore.collection("meta").doc("assignmentCounter");

  const startFrom = await firestore.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let lastNumber = 0;
    if (counterSnap.exists) {
      lastNumber = Number(counterSnap.data()?.lastNumber || 0);
    } else {
      lastNumber = await getCurrentMaxMatchNumber();
    }

    const nextLast = lastNumber + count;
    transaction.set(counterRef, { lastNumber: nextLast }, { merge: true });
    return lastNumber + 1;
  });

  return Array.from({ length: count }, (_, index) => startFrom + index);
}

export function parseEtaMinutes(eta) {
  const match = String(eta || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function getOpenNeeds() {
  const firestore = getDb();
  const snap = await firestore.collection("needs").where("status", "==", "open").get();
  return snap.docs.map(snapshotToObject);
}

export async function getAvailableVolunteers() {
  const firestore = getDb();
  const snap = await firestore.collection("volunteers").where("isAvailable", "==", true).get();
  return snap.docs.map(snapshotToObject);
}

export async function getAssignmentsDesc() {
  const firestore = getDb();
  const snap = await firestore.collection("assignments").orderBy("generatedAt", "desc").get();
  return snap.docs.map(snapshotToObject);
}

export async function getAssignmentByMatchId(matchId) {
  const firestore = getDb();
  const snap = await firestore.collection("assignments").where("matchId", "==", matchId).limit(1).get();

  if (snap.empty) {
    return null;
  }

  const docSnap = snap.docs[0];
  return {
    ref: docSnap.ref,
    data: snapshotToObject(docSnap)
  };
}

export async function createAssignments(generatedMatches) {
  if (!generatedMatches.length) {
    return [];
  }

  const firestore = getDb();
  const matchNumbers = await reserveMatchNumbers(generatedMatches.length);
  const generatedAt = admin.firestore.Timestamp.now();
  const batch = firestore.batch();
  const created = [];

  generatedMatches.forEach((match, index) => {
    const docRef = firestore.collection("assignments").doc();
    const matchId = formatMatchId(matchNumbers[index]);

    const payload = {
      id: docRef.id,
      matchId,
      needId: String(match.needId || ""),
      volunteerId: String(match.volunteerId || ""),
      needDescription: String(match.needDescription || ""),
      teamName: String(match.teamName || ""),
      eta: String(match.eta || "18 min"),
      confidenceScore: Number(match.confidenceScore || 0),
      reasoning: String(match.reasoning || ""),
      status: "pending",
      generatedAt,
      confirmedAt: null
    };

    batch.set(docRef, payload);
    created.push(payload);
  });

  await batch.commit();
  return created;
}

export async function confirmAssignmentByMatchId(matchId) {
  const firestore = getDb();

  return firestore.runTransaction(async (transaction) => {
    const assignmentSnap = await transaction.get(
      firestore.collection("assignments").where("matchId", "==", matchId).limit(1)
    );

    if (assignmentSnap.empty) {
      return null;
    }

    const assignmentDoc = assignmentSnap.docs[0];
    const assignment = assignmentDoc.data();

    const now = admin.firestore.Timestamp.now();
    transaction.update(assignmentDoc.ref, {
      status: "confirmed",
      confirmedAt: now
    });

    const volunteerRef = await findDocRefByIdField("volunteers", "id", assignment.volunteerId);
    if (volunteerRef) {
      transaction.update(volunteerRef, {
        isAvailable: false,
        currentTaskId: assignment.needId
      });
    }

    const needRef = await findDocRefByIdField("needs", "id", assignment.needId);
    if (needRef) {
      transaction.update(needRef, {
        status: "in_progress"
      });
    }

    return {
      ...assignment,
      status: "confirmed",
      confirmedAt: now
    };
  });
}

export async function countPendingAssignments() {
  const firestore = getDb();
  const snap = await firestore.collection("assignments").where("status", "==", "pending").get();
  return snap.size;
}

export async function countConfirmedAssignments() {
  const firestore = getDb();
  const snap = await firestore.collection("assignments").where("status", "==", "confirmed").get();
  return snap.size;
}

export async function countNeedsByStatus(status) {
  const firestore = getDb();
  const snap = await firestore.collection("needs").where("status", "==", status).get();
  return snap.size;
}
