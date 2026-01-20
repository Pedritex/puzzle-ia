
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generatePuzzleImage = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure it is configured.");
  }

  // Se crea una nueva instancia cada vez para asegurar que usa la clave más reciente
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `A high-quality, intricate, and vibrant artistic scene for a jigsaw puzzle. Subject: ${prompt}. The composition must be dense, detailed, and completely fill the frame from edge to edge without large empty, white, or monochromatic backgrounds. Cinematic lighting, rich colors, 8k resolution.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    let imageUrl = '';
    const candidates = response.candidates;
    
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${base64Data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No se pudo generar la imagen. Intente con una descripción diferente.");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error en la generación de imagen:", error);
    throw error;
  }
};
