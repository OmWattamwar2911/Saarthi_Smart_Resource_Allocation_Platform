import { generateNeedVolunteerAssignments } from "./vertexAIService.js";

export async function generateAssignmentsWithGemini(needs, volunteers) {
  return generateNeedVolunteerAssignments(needs, volunteers);
}
