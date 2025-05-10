'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, sendMessage } from '@/lib/api/chat-bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, Send, Bot, User, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

// Function to format the message content with Markdown-like syntax
const formatMessage = (content: string) => {
  // Split by newlines
  const lines = content.split('\n');
  
  // Process each line
  return lines.map((line, index) => {
    // Bold text
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Check if it's a numbered list item (recommendation)
    const isListItem = /^\d+\.\s/.test(boldLine);
    
    if (isListItem) {
      return (
        <li key={index} className="ml-5 list-item">
          <span dangerouslySetInnerHTML={{ __html: boldLine.replace(/^\d+\.\s/, '') }} />
        </li>
      );
    }
    
    // Regular line
    return (
      <p key={index} className={index > 0 ? "mt-2" : ""}>
        <span dangerouslySetInnerHTML={{ __html: boldLine }} />
      </p>
    );
  });
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    // Focus the input field when opening the chat
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to the chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get response from OpenAI
      const assistantMessage = await sendMessage([...messages, userMessage]);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from assistant');
      // Add error message
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again later.' 
        }
      ]);
    } finally {
      setIsLoading(false);
      // Focus the input after sending a message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Card className="flex flex-col h-[500px] w-[350px] sm:w-[400px] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-3 bg-primary text-white font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span>HakTrak Assistant</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleChat}
            className="h-8 w-8 text-white hover:bg-primary-foreground/20"
          >
            <X size={18} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary text-white flex items-center justify-center">
                    <Bot size={16} />
                  </Avatar>
                )}
                
                <div 
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-sm">{formatMessage(msg.content)}</div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 bg-secondary text-white flex items-center justify-center">
                    <User size={16} />
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-primary text-white flex items-center justify-center">
                  <Bot size={16} />
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
