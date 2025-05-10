'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatService } from '@/lib/api/chat-service';
import { TokenService } from '@/lib/auth/token-service'; // Import TokenService

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // New state for auth status
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Check authentication status when component mounts and when chat is opened
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = TokenService.isAuthenticated();
      setIsAuthenticated(authStatus);
      if (isOpen && !authStatus && messages.length === 0) {
        // Add a message prompting to login if chat is open, user not auth, and no messages yet
        setMessages([
          {
            id: 'auth-prompt',
            role: 'assistant',
            content: 'Please log in to use the chat feature.'
          }
        ]);
      }
    };

    checkAuth(); // Check immediately
    // Optionally, re-check when isOpen changes, especially if login can happen in another tab
    // For simplicity, this example checks on mount and relies on user re-opening or refreshing.
  }, [isOpen]); // Rerun when isOpen changes to update message if needed

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // When opening the chat, re-check auth and potentially show the message.
    if (!isOpen) { // If chat is about to open
      const authStatus = TokenService.isAuthenticated();
      setIsAuthenticated(authStatus);
      if (!authStatus && messages.length === 0) {
        setMessages([
          {
            id: 'auth-prompt',
            role: 'assistant',
            content: 'Please log in to use the chat feature.'
          }
        ]);
      } else if (authStatus && messages.length === 1 && messages[0].id === 'auth-prompt') {
        // If user logged in and only auth prompt is there, clear it.
        setMessages([]);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || !isAuthenticated) return; // Prevent sending if not authenticated

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };
    // If the only message is the auth prompt, replace it, otherwise append
    setMessages((prevMessages) => 
      prevMessages.length === 1 && prevMessages[0].id === 'auth-prompt' 
      ? [newUserMessage] 
      : [...prevMessages, newUserMessage]
    );
    setInputValue('');
    setIsLoading(true);

    try {
      const modelPayload = { currentMessage: inputValue, history: messages.filter(msg => msg.id !== 'auth-prompt') }; // Exclude auth prompt from history
      
      const assistantReplyContent = await ChatService.sendPrompt(modelPayload);

      let formattedReply = '';
      if (typeof assistantReplyContent === 'string') {
        formattedReply = assistantReplyContent;
      } else if (assistantReplyContent && typeof assistantReplyContent === 'object') {
        formattedReply = `Summary: ${assistantReplyContent.summary}\nRecommendations: ${assistantReplyContent.recommendations?.join(', ')}`;
      } else {
        formattedReply = "Received an unexpected response format.";
      }

      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedReply,
      };
      setMessages((prevMessages) => [...prevMessages, newAssistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error && error.message === "User not authenticated." 
                   ? 'Please log in to send messages.' 
                   : 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Basic styles - consider moving to a CSS module or a styled-components approach for larger applications
  const widgetStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
  };

  const chatWindowStyle: React.CSSProperties = {
    width: '350px',
    height: '500px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };
  
  const messagesAreaStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: '10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const messageStyle = (role: 'user' | 'assistant'): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '18px',
    maxWidth: '70%',
    wordBreak: 'break-word',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: role === 'user' ? '#007bff' : '#e9ecef',
    color: role === 'user' ? 'white' : 'black',
  });

  const inputAreaStyle: React.CSSProperties = {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #ccc',
  };

  return (
    <div style={widgetStyle}>
      {isOpen && (
        <div style={chatWindowStyle}>
          <div style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Chat with AI Assistant</h4>
            <button onClick={toggleChat} style={{border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer'}}>&times;</button>
          </div>
          <div style={messagesAreaStyle}>
            {messages.map((msg) => (
              <div key={msg.id} style={messageStyle(msg.role)}>
                {/* Make sure content is treated as a string, especially for multi-line */} 
                {typeof msg.content === 'string' ? msg.content.split('\n').map((line, index) => (
                  <span key={index}>{line}<br/></span>
                )) : 'Invalid message content'}
              </div>
            ))}
            {isLoading && isAuthenticated && <div style={{alignSelf: 'flex-start', color: '#666'}}>Assistant is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={inputAreaStyle}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isAuthenticated ? "Type a message..." : "Please log in to chat"}
              style={{ flexGrow: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', marginRight: '10px' }}
              disabled={isLoading || !isAuthenticated} // Disable if not authenticated or loading
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isLoading || !isAuthenticated} // Disable if not authenticated or loading
              style={{
                padding: '10px 15px', 
                borderRadius: '20px', 
                border: 'none', 
                backgroundColor: (isLoading || !isAuthenticated) ? '#ccc' : '#007bff',
                color: 'white', 
                cursor: (isLoading || !isAuthenticated) ? 'not-allowed' : 'pointer'
              }}>
              Send
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={toggleChat} 
        style={{ 
            padding: '10px 20px', 
            borderRadius: '50%', 
            border: 'none', 
            backgroundColor: '#007bff', 
            color: 'white', 
            cursor: 'pointer', 
            fontSize: '1.5rem', 
            width: '60px', 
            height: '60px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
        {isOpen ? 'X' : 'Chat'}
      </button>
    </div>
  );
};

export default ChatWidget; 