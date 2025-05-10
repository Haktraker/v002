import { apiClient } from './config';
import { TokenService } from '@/lib/auth/token-service';

const CHAT_API_URL = `${process.env.NEXT_PUBLIC_CHAT_BASE_URL}/chat`;
const CHAT_API_KEY = process.env.NEXT_PUBLIC_CHAT_KEY;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestPayload {
  messages: ChatMessage;
  userId: string;
}

interface ChatResponse {
  // Define the expected response structure from your chat API
  // For example:
  // summary: string;
  // recommendations: string[];
  response: any; // Replace 'any' with a more specific type if known
}

export const ChatService = {
  async sendPrompt(model: any): Promise<any> { // Replace 'any' with a more specific type for 'model' and the return type
    const userId = TokenService.getUserId();
    console.log("userId", userId);
    if (!userId) {
      console.error("User ID not found. Cannot send prompt.");
      throw new Error("User not authenticated.");
    }

    if (!CHAT_API_KEY) {
      console.error("Chat API key not found.");
      throw new Error("Chat service is not configured.");
    }
    
    // Construct the payload as per the user's example
    const payload: ChatRequestPayload = {
      messages: {
        role: "user",
        content: ` . Please respond with JSON format like {"summary":string, "recommendations":[array of strings]}, analyze this object and Give me a summary and recommendations about: ${JSON.stringify(
          model
        )}`,
      },
      userId: userId,
    };

    try {
      const response = await apiClient.post<ChatResponse>(CHAT_API_URL, payload, {
        headers: {
          // Assuming the chat API key needs to be sent as a header.
          // Adjust if it needs to be sent differently (e.g., in the body or as a query param).
          'Authorization': `Bearer ${CHAT_API_KEY}`, // Or your specific auth scheme for the chat API
          // 'X-Api-Key': CHAT_API_KEY, // Another common way to send API keys
        }
      });
      return response.data.response; // Or however the actual reply is structured
    } catch (error: any) {
      console.error("Error sending prompt to chat API:", error.response?.data || error.message);
      throw new Error("Failed to get response from chat assistant.");
    }
  },
}; 