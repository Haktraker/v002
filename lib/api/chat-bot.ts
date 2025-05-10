import axios from 'axios';
import { toast } from 'sonner';

// Constants
const CHAT_API_URL = `${process.env.NEXT_PUBLIC_CHAT_BASE_URL}/chat`;
const CHAT_API_KEY = process.env.NEXT_PUBLIC_CHAT_KEY;

// Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Request format expected by the backend (Assistants API)
export interface AssistantApiRequest {
  userId: string;
  messages: {
    content: string;
  };
}

// Response format from the backend
interface AssistantApiResponse {
  response: string;
}

// Bot response JSON format
interface BotResponseJSON {
  summary: string;
  recommendations: string[];
}

export interface ChatRequest {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  message: Message;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Generate a consistent user ID based on session or create a new one
function getUserId(): string {
  // Check if we already have a userId in localStorage
  let userId = localStorage.getItem('chat_user_id');
  
  // If not, create one and store it
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('chat_user_id', userId);
  }
  
  return userId;
}

/**
 * Parse the JSON response from the bot
 * @param responseText The raw response text from the bot
 * @returns The parsed content, extracting only the summary field
 */
function parseBotResponse(responseText: string): string {
  try {
    // Try to parse the response as JSON
    const jsonResponse = JSON.parse(responseText) as BotResponseJSON;
    
    // Extract only the summary field
    if (jsonResponse && jsonResponse.summary) {
      return jsonResponse.summary;
    }
    
    // If no summary field, return the original response
    return responseText;
  } catch (error) {
    // If parsing fails, return the original response
    return responseText;
  }
}

/**
 * Sends a request to the OpenAI API to get a chat response
 */
export async function sendChatRequest(request: ChatRequest): Promise<ChatResponse> {
  try {
    // Get the last user message to send (Assistants API expects a single message)
    const lastUserMessage = request.messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (!lastUserMessage || !lastUserMessage.content.trim()) {
      throw new Error('No valid user message to send');
    }
    
    // Format according to the backend's expected format
    const assistantRequest: AssistantApiRequest = {
      userId: getUserId(),
      messages: {
        content: lastUserMessage.content
      }
    };

    
    const response = await axios.post(
      CHAT_API_URL,
      assistantRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHAT_API_KEY}`
        }
      }
    );
    
    // The backend returns { response: string } where response is a JSON string
    const apiResponse = response.data as AssistantApiResponse;
    
    // Parse the JSON response and extract only the summary
    const parsedContent = parseBotResponse(apiResponse.response);
    
    // Convert to our app's expected format
    return {
      message: {
        role: 'assistant',
        content: parsedContent
      }
    };
  } catch (error) {
    toast.error(`Error sending chat request: ${error}`);
    
    // Return a graceful error message instead of throwing
    return {
      message: {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI service. Please try again later.'
      }
    };
  }
}

/**
 * Sends a chat message and returns the AI response
 */
export async function sendMessage(messages: Message[]): Promise<Message> {
  try {
    // Validate messages to ensure they all have content
    if (!messages.every(msg => msg.role && msg.content)) {
      throw new Error('All messages must have a role and content');
    }
    
    const chatRequest: ChatRequest = {
      messages,
      temperature: 0.7,
    };
    
    const response = await sendChatRequest(chatRequest);
    return response.message;
  } catch (error) {
    toast.error(`Error in sendMessage: ${error}`);
    return {
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again later.'
    };
  }
}
