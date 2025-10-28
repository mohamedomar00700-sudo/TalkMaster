import { GoogleGenAI, Chat, Modality, Type, GenerateContentResponse, LiveSessionCallbacks, LiveSession } from "@google/genai";
import { UserLevel, Scenario, Voice, Message, VocabularyItem } from "../types";

let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const connectLiveSession = (
    systemInstruction: string,
    userLevel: UserLevel,
    voice: Voice,
    callbacks: LiveSessionCallbacks
): Promise<LiveSession> => {
    const fullSystemInstruction = `${systemInstruction} The user's English level is ${userLevel}. Adjust your vocabulary and speech speed accordingly.`;
    const aiInstance = getAi();
    return aiInstance.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            systemInstruction: fullSystemInstruction,
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.id } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
    });
};


export const createChatSession = (
    systemInstruction: string,
    userLevel: UserLevel,
): Chat => {
    const fullSystemInstruction = `${systemInstruction} The user's English level is ${userLevel}. Adjust your vocabulary and speech speed accordingly. Your responses should be text-based for a chat interface. Keep your responses concise.`;
    const aiInstance = getAi();
    return aiInstance.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: fullSystemInstruction,
        },
    });
};

export const getFeedbackOnText = async (text: string): Promise<string | null> => {
    const aiInstance = getAi();
    const systemInstruction = `You are an expert English language teacher. Analyze the following text from a student. 
    Provide concise, helpful feedback to help them improve. 
    If there are errors, provide the correction and a very brief explanation. Your entire response should be one line.
    If there are no errors, simply say "Great job!".
    Example of a correction: "Correction: 'I go to the store yesterday.' -> 'I went to the store yesterday.' (Past tense)"
    Keep your feedback under 25 words.`;

    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction,
                maxOutputTokens: 50,
                thinkingConfig: { thinkingBudget: 25 },
            },
        });
        return response.text?.trim() || null;
    } catch (error) {
        console.error("Error getting feedback:", error);
        throw error; // Re-throw to be handled by the caller
    }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string | null> => {
    const aiInstance = getAi();
    try {
        const response = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

export const getHint = async (messages: Message[], systemPrompt: string): Promise<string> => {
    const aiInstance = getAi();
    
    const hintSystemInstruction = `You are an expert English learning assistant. Your task is to suggest the user's next response in a conversation.
    The user is practicing English in a scenario where your role is: "${systemPrompt}".
    Based on the conversation history, provide a single, short, and logical sentence that the user could say next.
    Your response MUST ONLY be the suggested sentence. Do not add any extra text, quotation marks, or explanations like "You could say:".`;

    const conversationHistory = messages.map(m => `${m.speaker}: ${m.text}`).join('\n');
    const prompt = `Here is the conversation so far:\n${conversationHistory}\n\nWhat should the user say next?`;
    
    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: hintSystemInstruction,
                maxOutputTokens: 50,
                temperature: 0.7,
                stopSequences: ["\n"],
            }
        });

        const hint = response.text?.trim().replace(/"/g, '');
        return hint || "Sorry, I can't think of a hint right now.";

    } catch (error) {
        console.error("Error getting hint:", error);
        throw error; // Re-throw to be handled by the UI component
    }
};

export const getWordInfo = async (word: string): Promise<{ definition: string; example: string } | null> => {
    const aiInstance = getAi();
    const prompt = `Provide a simple definition and a simple example sentence for the word "${word}".`;
    try {
        const response: GenerateContentResponse = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING },
                    },
                },
            },
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;

    } catch (error) {
        console.error("Error getting word info:", error);
        throw error; // Re-throw to be handled by the UI component
    }
};

export const createCustomScenario = async (description: string): Promise<Omit<Scenario, 'id' | 'backgroundImage' | 'isCustom' | 'reverseGoal' | 'reverseSystemPrompt'>> => {
    const aiInstance = getAi();
    const prompt = `Based on the user's request, create a complete scenario object for an English learning app. The user's request is: "${description}". Your response MUST be a valid JSON object with the following structure: { "title": string, "emoji": string (a single relevant emoji), "description": string (a short summary), "goal": string (a concise learning objective for the user), "systemPrompt": string (a detailed prompt for the AI bot to play its role, starting the conversation) }. Do not include any other text or explanations outside of the JSON object. Generate a creative and relevant scenario.`;

    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        emoji: { type: Type.STRING },
                        description: { type: Type.STRING },
                        goal: { type: Type.STRING },
                        systemPrompt: { type: Type.STRING },
                    },
                    required: ["title", "emoji", "description", "goal", "systemPrompt"]
                },
            },
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("Failed to generate scenario from AI response.");

    } catch (error) {
        console.error("Error creating custom scenario:", error);
        throw error; // Re-throw to be handled by the UI component
    }
};

export const extractKeyVocabulary = async (messages: Message[]): Promise<VocabularyItem[] | null> => {
    const aiInstance = getAi();
    const conversationText = messages.map(m => `${m.speaker}: ${m.text}`).join('\n');
    const prompt = `From the following conversation, identify up to 5 important vocabulary words an English learner should know. For each word, provide a simple definition and a simple example sentence.
    Conversation:
    ${conversationText}`;
    
    const systemInstruction = `You are an English teacher helping a student. Your response must be a valid JSON array of objects. Each object should have a "word" key, a "definition" key, and an "example" key. Do not include any other text or explanations.`;

    try {
        const response: GenerateContentResponse = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            word: { type: Type.STRING },
                            definition: { type: Type.STRING },
                            example: { type: Type.STRING },
                        },
                        required: ["word", "definition", "example"]
                    }
                },
            },
        });
        
        if (response.text) {
            const parsed = JSON.parse(response.text);
            return parsed.slice(0, 5);
        }
        return null;

    } catch (error) {
        console.error("Error extracting vocabulary:", error);
        return null;
    }
};

export const getConversationTip = async (messages: Message[]): Promise<string | null> => {
    const aiInstance = getAi();
    const conversationText = messages.map(m => `${m.speaker}: ${m.text}`).join('\n');
    
    const systemInstruction = `You are an expert English language coach. Analyze the provided conversation transcript.
    Based on the user's messages, identify a single, primary area for improvement.
    Provide one concise, positive, and actionable tip to help the user. The tip should be under 25 words.
    Start with a positive phrase like "Great job!" or "Nice work!".
    Example: "Great job! Try using more descriptive adjectives to make your stories more vivid."
    If the user made no mistakes, give a general encouragement tip.
    Your entire response must be just the tip itself.`;

    const prompt = `Conversation Transcript:\n${conversationText}\n\nProvide a helpful tip for the user:`;

    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                maxOutputTokens: 60,
                temperature: 0.8,
            },
        });
        return response.text?.trim() || null;
    } catch (error) {
        console.error("Error getting conversation tip:", error);
        return null; // Don't block the UI for this
    }
};

export const translateText = async (text: string): Promise<string | null> => {
    const aiInstance = getAi();
    const systemInstruction = `You are a helpful translation assistant. Translate the following English text to Arabic. Your response must only be the translated text, with no extra explanations or quotation marks.`;
    
    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction,
                maxOutputTokens: text.length * 2, // A rough estimate
                temperature: 0.2,
            },
        });
        return response.text?.trim() || null;
    } catch (error) {
        console.error("Error translating text:", error);
        throw error;
    }
};

export const translateVocabItem = async (definition: string, example: string): Promise<{ translatedDefinition: string; translatedExample: string } | null> => {
    const aiInstance = getAi();
    const prompt = `Translate the following to Arabic.
    Definition to translate: "${definition}"
    Example sentence to translate: "${example}"`;

    try {
        const response: GenerateContentResponse = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translatedDefinition: { type: Type.STRING },
                        translatedExample: { type: Type.STRING },
                    },
                    required: ["translatedDefinition", "translatedExample"]
                },
            },
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    } catch (error) {
        console.error("Error translating vocab item:", error);
        throw error;
    }
};