'use client';

import { useAuth } from '@/lib/auth/auth-provider';
import dynamic from 'next/dynamic';

// Import the chatbot dynamically to avoid SSR issues
const Chatbot = dynamic(() => import('@/components/chatbot'), { 
  ssr: false,
  loading: () => null 
});

export default function AuthChatbot() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't render anything while auth state is loading or if user is not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Chatbot />
    </div>
  );
} 