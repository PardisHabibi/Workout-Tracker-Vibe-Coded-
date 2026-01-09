import { GoogleGenAI, Type } from "@google/genai";
import { Workout, AIAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize loosely; actual calls will check for key.
const ai = new GoogleGenAI({ apiKey });

export const analyzeWorkout = async (workout: Workout): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  // Sanitize data for the prompt
  const workoutSummary = workout.exercises.map(ex => {
    const validSets = ex.sets.filter(s => typeof s.weight === 'number' && typeof s.reps === 'number');
    const setDetails = validSets.map(s => `${s.weight}kg x ${s.reps}`).join(', ');
    return `${ex.name}: [${setDetails}]`;
  }).join('\n');

  const prompt = `
    Analyze the following workout session data and provide a brief summary, 3 actionable tips for improvement or recovery, and identify the primary muscle group focus.
    
    Workout Data:
    ${workoutSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A motivating 1-2 sentence summary of the session." },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 actionable tips for post-workout recovery or next session improvement."
            },
            muscleGroupFocus: { type: Type.STRING, description: "The primary muscle groups worked (e.g., Chest & Triceps)." }
          },
          required: ["summary", "tips", "muscleGroupFocus"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Great job completing your workout!",
      tips: ["Stay hydrated.", "Ensure you get enough protein.", "Rest well for your next session."],
      muscleGroupFocus: "Full Body"
    };
  }
};