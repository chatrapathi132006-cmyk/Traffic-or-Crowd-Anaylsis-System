
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DensityLevel, TrafficFlow } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    peopleCount: { type: Type.INTEGER, description: "Estimated number of people visible" },
    vehicleCount: { type: Type.INTEGER, description: "Estimated number of vehicles visible" },
    density: { type: Type.STRING, enum: Object.values(DensityLevel), description: "General density level" },
    flow: { type: Type.STRING, enum: Object.values(TrafficFlow), description: "Traffic flow status" },
    riskScore: { type: Type.INTEGER, description: "Safety risk score from 0-100" },
    summary: { type: Type.STRING, description: "Brief visual summary (anonymized)" },
    prediction: { type: Type.STRING, description: "Short-term trend prediction (e.g., 'Likely to increase in 10 mins')" }
  },
  required: ["peopleCount", "vehicleCount", "density", "flow", "riskScore", "summary", "prediction"]
};

export const analyzeFrame = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze this traffic/surveillance camera frame for smart city management. Detect counts for people and vehicles. Assess density and flow. Provide a risk score. IMPORTANT: Maintain privacy - DO NOT identify individuals or specific faces. Focus on aggregate flow and safety metrics." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      timestamp: Date.now()
    } as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};
