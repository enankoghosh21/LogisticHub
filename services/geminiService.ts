import { GoogleGenAI } from "@google/genai";
import { LogisticsCase } from "../types";

// Helper to format date
const formatDate = (date: Date | null) => date ? date.toISOString().split('T')[0] : 'N/A';

export const analyzeLogisticsData = async (cases: LogisticsCase[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Filter for open cases to reduce token usage and focus on actionable items
  const openCases = cases.filter(c => c.isOpen);
  const emergencyCases = openCases.filter(c => c.isEmergency);
  const longPending = openCases.filter(c => c.calculatedPendency > 5);

  // Summarize data for the prompt
  const summaryData = {
    totalOpen: openCases.length,
    emergencyCount: emergencyCases.length,
    longPendingCount: longPending.length,
    topPendingCases: longPending.slice(0, 10).map(c => ({
      order: c.orderNumber,
      daysOpen: c.calculatedPendency,
      issue: c.abnormalType,
      desc: c.description,
      customer: c.customerName
    })),
    emergencySamples: emergencyCases.slice(0, 5).map(c => ({
      order: c.orderNumber,
      issue: c.abnormalType,
      warehouse: c.warehouse
    }))
  };

  const prompt = `
    You are a Senior Logistics Analyst for 'Logistic Hub'. 
    Analyze the following current operational data summary:
    ${JSON.stringify(summaryData, null, 2)}

    Please provide a concise strategic report in Markdown format covering:
    1. **Urgent Attention**: Highlight the emergency cases and longest pending orders.
    2. **Pattern Recognition**: Identify common issues (Abnormal Types) causing delays based on the samples.
    3. **Action Plan**: Suggest 3 specific actions the logistics team should take today to reduce pendency.
    
    Keep the tone professional and action-oriented.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};
