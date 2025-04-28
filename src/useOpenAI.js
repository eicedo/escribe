import { useState, useCallback } from 'react';
import { OpenAI } from 'openai';

// Maximum number of messages to keep in history
const MAX_HISTORY = 6;

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: this should be backend-only in prod!
});

export function useOpenAI() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrompt, setLastPrompt] = useState('');

  // Helper to update history with new messages
  const updateHistory = useCallback((newMessage) => {
    setHistory(prev => {
      const updated = [...prev, newMessage];
      // Keep only the last MAX_HISTORY messages
      return updated.slice(-MAX_HISTORY);
    });
  }, []);

  const ask = async (text, options = {}) => {
    const { regenerate = false, displayMessage } = options;
    setLoading(true);
    setError(null);
    
    try {
      // If not regenerating, save the new prompt
      if (!regenerate) {
        setLastPrompt(text);
        // Use displayMessage if provided, otherwise use the full text
        updateHistory({ role: 'user', content: displayMessage || text });
      }

      // Prepare messages for API call
      const messages = regenerate 
        ? history.slice(0, -1) // Remove last response for regeneration
        : history;

      console.log('Sending request to OpenAI:', { text, messages });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [...messages, { role: 'user', content: regenerate ? lastPrompt : text }],
        temperature: 0.7,
        max_tokens: 500,
      });
      console.log('OpenAI response:', completion);

      const response = completion.choices[0].message;
      updateHistory({ role: 'assistant', content: response.content });
      
      return response.content;
    } catch (err) {
      console.error('OpenAI API error:', err);
      const errorMessage = err.message || 'Error reaching OpenAI';
      setError(errorMessage);
      return `⚠️ ${errorMessage}`;
    } finally {
      setLoading(false);
    }
  };

  // Function to regenerate the last response
  const regenerate = async () => {
    if (lastPrompt) {
      return ask(lastPrompt, { regenerate: true });
    }
    return null;
  };

  // Clear chat history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastPrompt('');
    setError(null);
  }, []);

  return { 
    ask, 
    regenerate,
    clearHistory,
    history,
    loading,
    error,
    lastPrompt 
  };
}
