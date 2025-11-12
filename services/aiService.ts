import { OPENROUTER_API_KEY, OPENROUTER_API_BASE_URL, OPENROUTER_TEXT_MODEL, OPENROUTER_VISION_MODEL } from '../constants';
import { ChatMessage, TextSearchAIResponse, VisualSearchAIResponse } from '../types';

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
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        console.warn("OpenRouter API key not set. Falling back to direct search.");
        return { pregunta: "Using direct search...", terminos_busqueda: query };
    }
    try {
        const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://cinesuggest.ai', // Recommended by OpenRouter
                'X-Title': 'CineSuggest AI', // Recommended by OpenRouter
            },
            body: JSON.stringify({
                model: OPENROUTER_TEXT_MODEL,
                messages: [
                    { role: 'system', content: TEXT_SEARCH_SYSTEM_INSTRUCTION },
                    { role: 'user', content: `User Query: "${query}"` }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("OpenRouter API Error:", errorBody);
            throw new Error(`OpenRouter API responded with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed: TextSearchAIResponse = JSON.parse(content);

        if (!parsed.terminos_busqueda) {
            throw new Error("AI returned empty search terms.");
        }
        
        return parsed;
    } catch (error) {
        console.error("Error calling OpenRouter API for text search:", error);
        return {
            pregunta: "AI search failed. Running a direct search...",
            terminos_busqueda: query,
        };
    }
}

export const getVisualSearchResultsFromAI = async (imageBase64: string, mimeType: string, query: string): Promise<VisualSearchAIResponse> => {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        throw new Error("OpenRouter API key is not configured. Cannot perform visual search.");
    }
    try {
        const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://cinesuggest.ai',
                'X-Title': 'CineSuggest AI',
            },
            body: JSON.stringify({
                model: OPENROUTER_VISION_MODEL,
                messages: [
                    { role: 'system', content: VISUAL_SEARCH_SYSTEM_INSTRUCTION },
                    { 
                        role: 'user', 
                        content: [
                            { type: 'text', text: `User's optional text hint: "${query || 'No hint provided'}"` },
                            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("OpenRouter API Error:", errorBody);
            throw new Error(`OpenRouter API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed: VisualSearchAIResponse = JSON.parse(content);
        
        if (!parsed.title && !parsed.search_terms) {
            throw new Error("AI could not identify the image or provide search terms.");
        }

        return parsed;

    } catch (error) {
        console.error("Error calling OpenRouter API for visual search:", error);
        throw new Error("Failed to get visual search response from AI.");
    }
};

export async function* getChatResponseFromAIStream(history: ChatMessage[]): AsyncGenerator<string> {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        yield "The OpenRouter API key is not configured. Please add it to use the chat feature.";
        return;
    }

    const messages = history
        .filter(msg => msg.role !== 'error')
        .map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }));

    try {
        const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://cinesuggest.ai',
                'X-Title': 'CineSuggest AI',
            },
            body: JSON.stringify({
                model: OPENROUTER_TEXT_MODEL,
                messages: [
                    { role: 'system', content: CHAT_SYSTEM_INSTRUCTION },
                    ...messages
                ],
                stream: true
            })
        });

        if (!response.body) {
            throw new Error("Response body is null");
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last partial line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        console.error("Failed to parse stream chunk:", data, e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error calling OpenRouter API for chat stream:", error);
        throw new Error("Failed to get chat response from AI.");
    }
}