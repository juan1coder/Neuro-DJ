
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { MusicConfig, GeneratedContent } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AI Interaction Logic ---

const callGeminiForJson = async (prompt: string): Promise<GeneratedContent | null> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8,
            },
        });
        
        const jsonStr = response.text.trim();
        const parsedData = JSON.parse(jsonStr);

        if (parsedData && typeof parsedData.musicDescription === 'string' && typeof parsedData.imagePrompt === 'string') {
             return parsedData as GeneratedContent;
        } else {
            console.error("Parsed JSON does not match expected structure:", parsedData);
            throw new Error("Received an invalid data structure from the AI.");
        }
       
    } catch (e) {
        console.error("Error calling Gemini API:", e);
        throw e;
    }
};

// --- Guided Mode Prompt Engineering ---

function getEnergyDescription(energy: number): string {
    if (energy < 25) return "Very low energy, sleepy, for deep rest.";
    if (energy < 50) return "Low energy, calm and lucid, for gentle unwinding.";
    if (energy < 75) return "Medium energy, focused and alert, for productivity.";
    return "High energy, driving and motivational, for active engagement.";
}

function getColorMapping(color: string): string {
    switch(color) {
        case 'Green': return "Maps to sounds of growth, healing, and balance: low pads, organic mid-tones.";
        case 'Yellow': return "Maps to sounds of clarity and alertness: mid-to-high frequency melodies, crisp textures.";
        case 'Gold': return "Maps to sounds of inspiration and spiritual spark: bright chimes, sparkly textures, ethereal layers.";
        default: return "No specific color mapping requested.";
    }
}

function getModeInstructions(config: MusicConfig): string {
    switch(config.appMode) {
        case 'Recovery': return "Prioritize deep, warm sub-bass and slow, healing pads. Avoid complex melodies and sharp percussive elements. The goal is deep neurochemical restoration.";
        case 'Productivity': return "Prioritize clear, lucid arpeggios, a steady but unobtrusive rhythm, and mid-range tones that boost clarity. The goal is to create a trance-like state for deep work.";
        default: return "Create a balanced soundscape suitable for general listening or light focus.";
    }
}

const buildGuidedPrompt = (config: MusicConfig): string => {
    return `
You are an expert neuro-acoustic music composer AI. Your task is to generate a detailed description for a 30-60 second seamless audio loop and a corresponding image prompt based on the user's specifications. The output must be a single, valid JSON object with the keys "musicDescription" and "imagePrompt". Do not include any other text or markdown formatting around the JSON object.

User Specifications:
- Genre: ${config.genre}
- Energy Level: ${config.energy}/100 (${getEnergyDescription(config.energy)})
- Neurochemical Intent: Target ${config.neuroIntent} for ${config.neuroIntent === 'Dopamine' ? 'uplift & motivation' : config.neuroIntent === 'Serotonin' ? 'calm & contentment' : 'focus & clarity'}.
- Color Theme: ${config.colorTheme} (${getColorMapping(config.colorTheme)})
- Special Mode: ${config.appMode}. Instructions: ${getModeInstructions(config)}
- Voice Layer: ${config.voiceLayer ? 'Enabled. Include subtle, whispered, ASMR-like words such as "restore," "reconnect," or "focus."' : 'Disabled.'}

Based on these settings, generate the JSON output.

For "musicDescription", be vivid and technical. Describe the BPM range, key sonic elements (e.g., warm sub-bass, metallic tones, lucid arpeggios, soft pads), rhythmic patterns, and any ASMR or bioacoustic pulses. Describe the overall mood and intended psychological effect, ensuring it's a seamless loop.

For "imagePrompt", create a concise, abstract, and evocative prompt for an AI image generator. It should capture the feeling, color, and texture of the soundscape. For example: "luminous golden threads woven through a deep indigo nebula, abstract, digital art, serene but focused".
`;
};

// --- Freestyle Mode Prompt Engineering ---

const buildFreestylePrompt = (userPrompt: string): string => {
    return `
You are an expert AI sound designer. A user has provided a basic idea for a soundscape. Your task is to expand their idea into a highly detailed, professional prompt suitable for a generative audio AI model. You must also create a corresponding image prompt. The output must be a single, valid JSON object with the keys "musicDescription" and "imagePrompt". Do not include any other text or markdown formatting.

User's Idea: "${userPrompt}"

Based on the user's idea, generate the JSON output.

For "musicDescription" (the detailed audio prompt), be vivid and technical. Infer and specify details like BPM range, key, sonic textures (e.g., "warm analog synth pads," "crisp, granular rain samples"), rhythmic structure ("a gentle 4/4 kick with soft, off-beat hi-hats"), melodic elements ("a sparse, melancholic piano melody with heavy reverb"), and the overall mood and progression. Make it a complete, actionable prompt for an audio generator.

For "imagePrompt", create a concise, abstract, and evocative prompt for an AI image generator that captures the feeling, color, and texture of the soundscape you've just described. For example: "bioluminescent particles drifting in a tranquil, midnight blue cavern, digital art, ethereal glow".
`;
}


// --- Public Service Functions ---

export const generateMusicDescriptionAndImagePrompt = async (config: MusicConfig): Promise<GeneratedContent | null> => {
    const prompt = buildGuidedPrompt(config);
    return callGeminiForJson(prompt);
};

export const generateFreestyleDescriptionAndImagePrompt = async (userPrompt: string): Promise<GeneratedContent | null> => {
    const prompt = buildFreestylePrompt(userPrompt);
    return callGeminiForJson(prompt);
};


export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${prompt}, abstract digital art, high resolution, atmospheric, cinematic lighting`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (e) {
        console.error("Error generating image:", e);
        throw e;
    }
};