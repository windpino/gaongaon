import { GoogleGenAI } from "@google/genai";
import { PoopLogEntry, WaterLogEntry } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeHealthReport = async (
  poopLogs: PoopLogEntry[],
  waterLogs: WaterLogEntry[],
  childName: string
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Cannot generate AI report.";
  }

  try {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter last 7 days
    const recentPoop = poopLogs.filter(p => new Date(p.timestamp) >= oneWeekAgo);
    const recentWater = waterLogs; // Assuming waterLogs is keyed by YYYY-MM-DD, logic simplification for prompt

    const prompt = `
      You are a friendly and wise senior pediatrician assistant AI.
      Analyze the following health data for a child named "${childName}" for the past week.
      
      Data:
      - Poop Logs (Type: HARD=Constipated, NORMAL=Good, SOFT=Loose, DIARRHEA=Bad): ${JSON.stringify(recentPoop)}
      - Water Logs (Daily Goal is 6 cups): ${JSON.stringify(recentWater)}

      Please provide a summary report for a doctor's visit and advice for parents.
      The output should be in Markdown format.
      
      Structure:
      1. **Overall Health Status**: (Emoji + Brief summary)
      2. **Bowel Movement Analysis**: Frequency and consistency trends.
      3. **Hydration Analysis**: Did they meet the goals?
      4. **Doctor's Note**: Key points to mention to a doctor if visiting.
      5. **Encouragement**: A warm message for the parents.

      Language: Korean (Natural and professional but warm).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "분석 결과를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

export const getKnightMission = async (level: number, streak: number): Promise<string> => {
    if (!apiKey) return "기사님! 오늘도 건강한 하루 되세요!";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a short, exciting daily mission message (1 sentence) for a child pretending to be a Knight (Level ${level}) fighting Constipation Monsters. They have a streak of ${streak} days. Korean language.`
        });
        return response.text || "오늘도 몬스터를 물리치러 가자!";
    } catch (e) {
        return "오늘도 몬스터를 물리치러 가자!";
    }
}
