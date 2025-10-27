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
      
      // CRITICAL INSTRUCTIONS (DO NOT IGIGNORE)
      1.  **ASPECT RATIO:** The output image's aspect ratio MUST be exactly ${aspectRatio}. This is the highest priority instruction.
          - For example, '1920:1080' is a wide landscape, '1080:1920' is a tall portrait, and '1080:1080' is a perfect square.
          - Failure to adhere to the aspect ratio will result in a failed generation.
      
      2.  **PHOTOREALISM:** Generate a single, 4k, ultra-realistic, hyperrealistic mockup image. The final result must be completely indistinguishable from a professional photograph taken with a high-end DSLR camera and a prime 85mm f1.2 lens. It should be a masterpiece of photorealism. Pay extreme attention to detail in lighting, shadows, textures, and depth of field.
      
      // ART DIRECTION
      1.  **INDUSTRY AESTHETIC:** The mockup must be appropriate for the target industry, reflecting its typical visual language, environment, and context. Industry guide: "${industryDescription}"
      
      2.  **SCENE TO CREATE:** Using the industry guide above, create a mockup of the following scene: "${description}"
      
      3.  **LOGO INTEGRATION:** As an expert art director, you MUST integrate the provided logo into the scene with the following rules:
          - **Seamless & Natural:** The logo should look like it was part of the original photograph, not something digitally added later.
          - **Environmental Matching:** The lighting, shadows, perspective, and material textures on the logo must perfectly match the environment.
          - **High-Fidelity Reproduction:** THIS IS THE MOST IMPORTANT RULE. The logo must be rendered with absolute precision. Every single detail, line, color, and text element from the original logo image MUST be preserved perfectly. Do not alter, omit, or distort any part of the logo. The final output must show a high-fidelity, complete, and accurate representation of the provided logo.
      
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

export async function generateImageBasedMockup(baseImageBase64Url: string, logoBase64Url: string, aspectRatio: string): Promise<string> {
    const prompt = `
      // PROMPT FOR AI MOCKUP GENERATION FROM A BASE IMAGE

      // CRITICAL INSTRUCTIONS (DO NOT IGNORE)
      1.  **ASPECT RATIO (HIGHEST PRIORITY):** The final output image's aspect ratio MUST be exactly ${aspectRatio}. You may need to crop or extend the original base image to fit this new aspect ratio.
          - Example: '1920:1080' is landscape, '1080:1920' is portrait, '1080:1080' is square.
          - Adherence to the aspect ratio is mandatory.

      2.  **PRIMARY GOAL: LOGO REPLACEMENT:** Your main task is to act as an expert photoshop artist. You will receive a BASE IMAGE and a new LOGO IMAGE. Your objective is to seamlessly and photorealistically replace any existing logo on the BASE IMAGE with the new LOGO IMAGE.

      3.  **LOGO DETECTION & PLACEMENT:**
          - **Detect and Replace:** First, meticulously scan the BASE IMAGE for any existing logos, brand marks, emblems, or text that functions as a logo. You MUST replace the most prominent or contextually relevant existing logo with the new LOGO IMAGE provided.
          - **No Existing Logo:** If, and only if, there is absolutely no existing logo to replace, you should place the new LOGO IMAGE onto the most logical and natural blank surface (e.g., a plain t-shirt, a blank mug, an empty sign).
          - **Context is Key:** The placement must make sense in the context of the image.

      4.  **HYPERREALISM & SEAMLESS INTEGRATION:** The final result must be indistinguishable from a real photograph. The integrated logo must perfectly match the lighting, shadows, perspective, angles, textures, material properties, and any fabric folds or surface curvature of the BASE IMAGE. It must not look like a flat sticker pasted on top.

      5.  **LOGO INTEGRITY (CRITICAL):** The provided LOGO IMAGE must be rendered with absolute precision. Every single detail, line, color, and text element from the original logo image MUST be preserved perfectly. Do not alter, omit, or distort any part of the logo in any way.

      // FINAL OUTPUT REQUIREMENTS
      - The final output MUST be the modified BASE IMAGE, with the new logo integrated and the aspect ratio adjusted to ${aspectRatio}.
      - DO NOT add any text, watermarks, or annotations.
    `;

    try {
        const baseImagePart = { inlineData: dataUrlToInlineData(baseImageBase64Url) };
        const logoPart = { inlineData: dataUrlToInlineData(logoBase64Url) };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                // The order is important: prompt, base image, then logo
                parts: [
                    { text: prompt },
                    baseImagePart,
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
        console.error("Error calling Gemini API for image-based mockup generation:", error);
        throw new Error("Failed to generate the image-based mockup. Please try a different image or logo.");
    }
}

export async function inpaintImage(imageWithTransparencyBase64Url: string, prompt: string): Promise<string> {
    const apiPrompt = `
    // AI INPAINTING PROMPT
    
    // CRITICAL INSTRUCTIONS
    1. **GOAL:** You have been provided an image containing a transparent area (alpha channel). Your task is to "inpaint" or fill this transparent area.
    2. **USER PROMPT:** The content you generate to fill the area must follow this user instruction: "${prompt}".
    3. **SEAMLESS INTEGRATION:** The generated content MUST blend seamlessly and photorealistically with the surrounding, non-transparent parts of the image. The final result should look like a single, cohesive photograph with no visible seams or artifacts. Match the lighting, shadows, texture, and perspective of the original image.
    4. **PRESERVE ORIGINAL:** DO NOT change any part of the original, non-transparent image. Your modifications should be confined strictly to the transparent region.
    
    // FINAL OUTPUT
    - The output must be a single image file with the transparent area filled in.
    - Do not add any text, watermarks, or annotations.
    `;

    try {
        const imagePart = { inlineData: dataUrlToInlineData(imageWithTransparencyBase64Url) };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: apiPrompt },
                    imagePart,
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
        throw new Error("AI did not return an image from inpainting.");

    } catch (error) {
        console.error("Error calling Gemini API for inpainting:", error);
        throw new Error("Failed to edit the image. Please try again.");
    }
}