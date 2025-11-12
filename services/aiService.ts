

import { GoogleGenAI } from '@google/genai';
import { ChatMessage, TextSearchAIResponse, VisualSearchAIResponse } from '../types';

let ai: GoogleGenAI;

try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (error) {
  console.error("CRITICAL: Failed to initialize GoogleGenAI client.", error);
  // This fallback prevents the entire app from crashing if the AI client fails to initialize.
  // Functions that use `ai` have their own try-catch blocks to handle the resulting error gracefully.
  ai = {
    models: {
      generateContent: () => { throw new Error("AI client failed to initialize. Please check your API key and environment."); },
      generateContentStream: () => { throw new Error("AI client failed to initialize. Please check your API key and environment."); }
    }
  } as unknown as GoogleGenAI;
}


const TEXT_SEARCH_SYSTEM_INSTRUCTION = `You are an elite Movie Investigator. Your role is to help the user find movies or series that perfectly match their intention. You have two tasks:

1.  **QUESTION**: Generate a single intriguing, open-ended question to get more details about the user's search (max 15 words).
2.  **TERMS**: Generate a list of 7 ULTRA-HIGH-QUALITY search terms for the media API, based on the user's query. This list must include quality terms (e.g., "best", "top", "acclaimed").

Respond ONLY with a single JSON structure with the following format:

{
  "pregunta": "[Your investigator question here]",
  "terminos_busqueda": "[Term1]|[Term2]|[Term3]|[Term4]|[Term5]|[Term6]|[Term7]"
}`;

const VISUAL_SEARCH_SYSTEM_INSTRUCTION = `You are an expert Movie Investigator specializing in visual recognition. Your task is to identify the movie or series from the provided image.

1.  **If you can identify the exact title**, respond with the title.
2.  **If you are unsure of the title**, generate a list of 7 highly descriptive search terms based on the actors, scene, style, or any identifiable elements in the image.

Respond ONLY with a single JSON structure with the following format. Fill in *either* "title" or "search_terms", but not both.

{
  "title": "[The exact movie or series title, or null]",
  "search_terms": "[Term1|Term2|...|Term7, or null]"
}`;


const CHAT_SYSTEM_INSTRUCTION = `You are CineSuggest AI, a friendly and knowledgeable chatbot specializing in movies and TV shows. Your goal is to have a natural conversation with the user, helping them discover new things to watch, answer trivia, or just chat about film. Be conversational, engaging, and helpful. Don't just provide lists; explain why you're suggesting something. Keep your responses concise and easy to read.`;


export const getTextSearchTermsFromAI = async (query: string): Promise<TextSearchAIResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Query: "${query}"`,
            config: {
                systemInstruction: TEXT_SEARCH_SYSTEM_INSTRUCTION,
                temperature: 0.5,
                responseMimeType: 'application/json',
            },
        });
        
        const content = response.text.trim();
        const parsed: TextSearchAIResponse = JSON.parse(content);

        if (!parsed.terminos_busqueda) {
            throw new Error("AI returned empty search terms.");
        }
        
        return parsed;
    } catch (error) {
        console.error("Error calling Gemini API for text search:", error);
        // Fallback to the original query if AI fails
        return {
            pregunta: "I'm running a direct search for you...",
            terminos_busqueda: query,
        };
    }
}

export const getVisualSearchResultsFromAI = async (imageBase64: string, mimeType: string, query: string): Promise<VisualSearchAIResponse> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: imageBase64,
            },
        };

        const textPart = {
            text: `User's optional text hint: "${query || 'No hint provided'}"`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // This model supports multimodal input
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: VISUAL_SEARCH_SYSTEM_INSTRUCTION,
                temperature: 0.4,
                responseMimeType: 'application/json',
            },
        });

        const content = response.text.trim();
        const parsed: VisualSearchAIResponse = JSON.parse(content);
        
        if (!parsed.title && !parsed.search_terms) {
            throw new Error("AI could not identify the image or provide search terms.");
        }

        return parsed;

    } catch (error) {
        console.error("Error calling Gemini API for visual search:", error);
        throw new Error("Failed to get visual search response from AI.");
    }
};

export async function* getChatResponseFromAIStream(history: ChatMessage[]): AsyncGenerator<string> {
    const contents = history
        .filter(msg => msg.role !== 'error')
        .map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: CHAT_SYSTEM_INSTRUCTION,
                temperature: 0.7,
            },
        });

        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                yield chunkText;
            }
        }
    } catch (error) {
        console.error("Error calling Gemini API for chat stream:", error);
        throw new Error("Failed to get chat response from AI.");
    }
}