import { GoogleGenAI, Type } from "@google/genai";
import { AttackType, NodeState } from "../types";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateSystemAnalysis = async (
  attackType: AttackType,
  activeNodeCount: number,
  compromisedNodeCount: number,
  currentFrequency: number
): Promise<string> => {
  if (!ai) {
    return "System Intelligence Offline: API Key missing.";
  }

  const model = "gemini-2.5-flash";
  
  // Explicitly frame this as a fictional simulation to avoid safety filters on "attacks"
  const prompt = `
    Context: You are the AI kernel for a fictional cyberpunk network simulation game called "Lamarr-Turing Graph".
    
    Scenario Status:
    - Threat Level: ${attackType}
    - Network Health: ${activeNodeCount - compromisedNodeCount}/${activeNodeCount} nodes active
    - Frequency: ${currentFrequency} MHz
    
    Task: Provide a concise, cool-sounding status log (max 2 sentences).
    First sentence: Describe the threat or system status using technobabble.
    Second sentence: Describe a countermeasure (e.g., "Rerouting via spread-spectrum", "Isolating compromised nodes").
    
    Keep it safe, fictional, and atmospheric.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 100,
        temperature: 0.7
      }
    });
    return response.text || "Analysis encrypted. Decryption failed.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Kernel Error: Uplink unstable.";
  }
};

export const generateTopologyOptimization = async (): Promise<any> => {
  if (!ai) return null;
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a JSON config for a secure network topology with 5 nodes.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    nodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    connections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { from: {type: Type.STRING}, to: {type: Type.STRING} } } }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
}