import { GoogleGenAI, Type } from "@google/genai";
import { Player, AIAnalysisResponse, AIScoutingResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRealPlayerData = async (playerName: string): Promise<Partial<Player>> => {
  const prompt = `
    Find the most famous professional football player matching the name "${playerName}".
    Return their current real-world profile details as of today.
    
    Data required:
    - Full Name
    - Country of Citizenship
    - Date of Birth (YYYY-MM-DD)
    - Current Team (Club)
    - Primary Position (Must be one of: Goalkeeper, Center Back, Left Back, Right Back, Defensive Midfielder, Center Midfielder, Attacking Midfielder, Left Winger, Right Winger, Striker)
    - Approximate Market Value in Millions of Euros (Number only, e.g. 180 for 180M)

    If the player is not found or ambiguous, return null for fields.
  `;

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            country: { type: Type.STRING },
            dob: { type: Type.STRING },
            team: { type: Type.STRING },
            position: { type: Type.STRING },
            marketValue: { type: Type.NUMBER }
          },
          required: ["name", "country", "dob", "team", "position", "marketValue"]
        }
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No data found");
  } catch (e) {
      console.error(e);
      throw e;
  }
}

export const analyzePlayerFit = async (player: Player, systemDescription: string, additionalInfo: string = ''): Promise<AIAnalysisResponse> => {
  const age = new Date().getFullYear() - new Date(player.dob).getFullYear();

  const prompt = `
    You are a world-class football (soccer) scout and tactical analyst.
    
    Analyze the following player for the specified tactical system.
    
    **Target Player Profile:**
    - Name: ${player.name}
    - Age: ${age}
    - Position: ${player.position}
    - Team: ${player.team}
    - Market Value: €${player.marketValue}M
    - Country: ${player.country}

    **Target System/Tactical Requirement:**
    ${systemDescription}

    **Additional Context / Specific Matchup Info:**
    ${additionalInfo || "No additional context provided."}

    **Analysis Instructions:**
    1. **REAL WORLD KNOWLEDGE**: If "${player.name}" is a known professional footballer, use your internal knowledge of their *actual* playing style, recent form, injury history, and specific traits (e.g. Haaland's physical dominance, Messi's vision) to inform the analysis. Do not rely solely on the generic stats above.
    2. **Synthesize**: Combine the provided profile with your real-world knowledge.
    3. **Evaluate**: strictly assess how they fit the "Target System" and "Additional Context".
    4. **Verdict**: Be critical. If a player is expensive but doesn't fit the system, say so.

    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fitScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating suitability." },
            summary: { type: Type.STRING, description: "A brief 2-sentence summary of the player's fit." },
            strengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Top 3 attributes relevant to the system."
            },
            weaknesses: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Top 3 potential risks or mismatches."
            },
            tacticalVerdict: { type: Type.STRING, description: "A professional conclusion (e.g., 'Ideal Starter', 'Squad Rotation', 'Not Recommended')." }
          },
          required: ["fitScore", "summary", "strengths", "weaknesses", "tacticalVerdict"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResponse;
    }
    throw new Error("No analysis generated.");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateScoutingShortlist = async (
  players: Player[], 
  formation: string, 
  tacticalSystem: string, 
  requirements: string
): Promise<AIScoutingResponse> => {
  // Minimize token usage by sending only relevant data
  const playerListString = players.map(p => 
    `ID: ${p.id}, Name: ${p.name}, Pos: ${p.position}, Team: ${p.team}, Age: ${new Date().getFullYear() - new Date(p.dob).getFullYear()}`
  ).join('\n');

  const prompt = `
    You are a Chief Scout. I have a database of players.
    
    **My Tactical Setup:**
    - Formation: ${formation}
    - System Style: ${tacticalSystem}
    - Specific Requirements: ${requirements}

    **Available Players Database:**
    ${playerListString}

    **Task:**
    Analyze the database and select the top 3-5 players that BEST fit my requirements. 
    If no players fit well, pick the closest matches.
    Do NOT invent players. Only use IDs from the list provided.
    
    Return a JSON object containing an array of recommendations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerId: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER, description: "0-100 suitability score" },
                  reasoning: { type: Type.STRING, description: "One sentence why they fit the system." },
                  keyAttribute: { type: Type.STRING, description: "The single most important attribute they bring (e.g. 'Pace', 'Vision')." }
                },
                required: ["playerId", "matchScore", "reasoning", "keyAttribute"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIScoutingResponse;
    }
    throw new Error("No recommendations generated.");
  } catch (error) {
    console.error("Scouting Error:", error);
    throw error;
  }
};