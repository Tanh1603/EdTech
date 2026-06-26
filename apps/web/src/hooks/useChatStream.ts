import { useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useChatStream = (sessionId: string) => {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { getToken } = useAuth();
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessageStream = async (content: string, onSuccess?: () => void) => {
    setStreamingContent('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = await getToken({ template: 'rbac' });
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      
      // Step 1: Create user message to get messageId
      const createMsgResponse = await fetch(`${baseUrl}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role: 'user', content }),
        signal: abortController.signal
      });

      if (!createMsgResponse.ok) {
        throw new Error(`Failed to save user message: ${createMsgResponse.status}`);
      }

      const createMsgData = await createMsgResponse.json();
      const messageId = createMsgData?.data?.id || createMsgData?.id;

      if (!messageId) {
        throw new Error('Could not retrieve message ID from created message response');
      }

      // Step 2: Connect to the SSE stream using GET and the messageId
      const response = await fetch(`${baseUrl}/chat/sessions/${sessionId}/messages/${messageId}/stream`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE request failed with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser / response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode new chunk and append to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split buffer by lines
        const lines = buffer.split('\n');
        // Keep the last line in buffer if it is incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace(/^event:\s*/, '').trim();
          } else if (trimmed.startsWith('data:')) {
            const data = trimmed.replace(/^data:\s*/, '');
            
            if (currentEvent === 'token') {
              // Append word token to streaming state
              setStreamingContent((prev) => prev + data);
            } else if (currentEvent === 'done') {
              // Finished streaming completely
              setIsStreaming(false);
              onSuccess?.();
              abortController.abort(); // Cancel the request connection cleanly
              return;
            }
          }
        }
      }
      
      // Fallback in case stream closes without 'done' event
      setIsStreaming(false);
      onSuccess?.();

    } catch (err: unknown) {
      // Don't report abort errors to user
      const error = err as Error;
      if (error.name !== 'AbortError') {
        console.error('SSE Stream Error:', err);
      }
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return { sendMessageStream, stopStreaming, streamingContent, isStreaming };
};
