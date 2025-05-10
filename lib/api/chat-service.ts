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

// This response structure is expected by both analysis and conversational (for now)
interface StandardChatApiResponse {
  summary: string;
  recommendations?: string[]; // Optional for purely conversational replies
  // Potentially other fields the API might return
}

// The service will return the 'response' part of the API call, which should be stringified JSON
// that we parse into StandardChatApiResponse in the calling components.

export const ChatService = {
  /**
   * Sends a complex data object to the AI for analysis.
   * Expects a structured JSON response with summary and recommendations.
   */
  async sendAnalysisPrompt(dataForAnalysis: any): Promise<string> { // Returns stringified JSON
    const userId = TokenService.getUserId();
    if (!userId) {
      console.error("User ID not found. Cannot send analysis prompt.");
      throw new Error("User not authenticated.");
    }
    if (!CHAT_API_KEY) {
      console.error("Chat API key not found for analysis.");
      throw new Error("Chat service is not configured.");
    }

    const analysisContent = ` . Please respond with JSON format like {"summary":string, "recommendations":[array of strings]}, analyze this object and Give me a summary and recommendations about: ${JSON.stringify(
      dataForAnalysis
    )}`;

    const payload: ChatRequestPayload = {
      messages: { role: "user", content: analysisContent },
      userId: userId,
    };

    try {
      const response = await apiClient.post<{ response: string }>(CHAT_API_URL, payload, {
        headers: { 'Authorization': `Bearer ${CHAT_API_KEY}` },
      });
      return response.data.response; // This is expected to be a stringified JSON
    } catch (error: any) {
      console.error("Error sending analysis prompt to chat API:", error.response?.data || error.message);
      throw new Error("Failed to get analysis from AI assistant.");
    }
  },
}; 