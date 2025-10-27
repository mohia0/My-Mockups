import { GoogleGenAI, Modality } from "@google/genai";

// Assume process.env.API_KEY is available
const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

function dataUrlToInlineData(dataUrl: string) {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { mimeType, data };
}

export async function rewriteDescription(description: string): Promise<string> {
    const prompt = `You are an expert copy editor. Your task is to refine a description for an AI image generator. 
    1.  Fix any grammar and spelling mistakes.
    2.  Make the language clearer and more vivid.
    3.  DO NOT add new objects, concepts, or change the core subject of the description.
    4.  Keep it concise.
    5.  Return only the rewritten description, with no preamble or explanation.

    Original text: "${description}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        // Using response.text is the recommended way to get text.
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for description rewrite:", error);
        throw new Error("Failed to rewrite the description. Please try again.");
    }
}


export async function generateFinalMockup(description: string, logoBase64Url: string, aspectRatio: string, industryDescription: string): Promise<string> {
    const prompt = `
      // PROMPT FOR HYPERREALISTIC AI MOCKUP GENERATION
      
      // CRITICAL INSTRUCTIONS (DO NOT IGNORE)
      1.  **ASPECT RATIO:** The output image's aspect ratio MUST be exactly ${aspectRatio}. This is the highest priority instruction.
          - For example, '1920:1080' is a wide landscape, '1080:1920' is a tall portrait, and '1080:1080' is a perfect square.
          - Failure to adhere to the aspect ratio will result in a failed generation.
      
      2.  **PHOTOREALISM:** Generate a single, 4k, ultra-realistic, hyperrealistic mockup image. The final result must be completely indistinguishable from a professional photograph taken with a high-end DSLR camera and a prime 85mm f1.2 lens. It should be a masterpiece of photorealism. Pay extreme attention to detail in lighting, shadows, textures, and depth of field.
      
      // ART DIRECTION
      1.  **INDUSTRY AESTHETIC:** The mockup must be appropriate for the target industry, reflecting its typical visual language, environment, and context. Industry guide: "${industryDescription}"
      
      2.  **SCENE TO CREATE:** Using the industry guide above, create a mockup of the following scene: "${description}"
      
      3.  **LOGO INTEGRATION:** As an expert art director, you MUST integrate the provided logo seamlessly and naturally into the scene. The logo should look like it was part of the original photograph. The lighting, shadows, perspective, and material textures on the logo must perfectly match the environment.
      
      // FINAL OUTPUT REQUIREMENTS
      - The final output MUST be a single image file.
      - DO NOT include any text, watermarks, or annotations on the image.
      
      // FINAL REMINDER
      The aspect ratio MUST be ${aspectRatio}.
    `;

    try {
        const logoPart = { inlineData: dataUrlToInlineData(logoBase64Url) };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt },
                    logoPart,
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI did not return an image.");

    } catch (error) {
        console.error("Error calling Gemini API for final mockup generation:", error);
        throw new Error("Failed to generate the final mockup. Please try a different prompt or logo.");
    }
}