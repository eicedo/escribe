import { useState, useCallback } from 'react';

// Maximum number of messages to keep in history
const MAX_HISTORY = 6;

export function useOpenAI() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const [response, setResponse] = useState(null);

  // Helper to update history with new messages
  const updateHistory = useCallback((newMessage) => {
    setHistory(prev => {
      const updated = [...prev, newMessage];
      // Keep only the last MAX_HISTORY messages
      return updated.slice(-MAX_HISTORY);
    });
  }, []);

  const ask = async (text, options = {}) => {
    const { regenerate = false, displayMessage, mode = 'rewrite', sectionContent } = options;
    setLoading(true);
    setError(null);
    setResponse(null);
    
    // Mode instructions
    const modeInstructions = {
      brainstorm: 'Brainstorm ideas for the following text:',
      outline: 'Create an outline for the following text:',
      rewrite: 'Rewrite the following text to improve clarity and style:',
      summarize: 'Summarize the following text:',
      fix: 'Correct the grammar and spelling in the following text:',
    };
    const instruction = modeInstructions[mode] || modeInstructions['rewrite'];
    const promptWithMode = `${instruction}\n\n${text}`;

    try {
      // If not regenerating, save the new prompt
      if (!regenerate) {
        setLastPrompt(text);
        // Use displayMessage if provided, otherwise use the full text
        updateHistory({ role: 'user', content: displayMessage || promptWithMode });
      }

      // Prepare messages for API call
      const messages = regenerate 
        ? history.slice(0, -1) // Remove last response for regeneration
        : history;

      const apiMessages = [...messages, { role: 'user', content: regenerate ? lastPrompt : promptWithMode }];

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, sectionContent }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error reaching AI backend');
      }

      const data = await res.json();
      const aiMessage = data.response;
      // Try to parse as JSON for newContent
      let parsed;
      try {
        parsed = JSON.parse(aiMessage.content);
        if (parsed && parsed.newContent) {
          updateHistory({ role: 'assistant', content: parsed.newContent });
          setResponse(parsed);
          return parsed;
        }
      } catch (e) {}
      updateHistory({ role: 'assistant', content: aiMessage.content });
      setResponse(aiMessage.content);
      return aiMessage.content;
    } catch (err) {
      console.error('AI backend error:', err);
      const errorMessage = err.message || 'Error reaching AI backend';
      setError(errorMessage);
      setResponse(`⚠️ ${errorMessage}`);
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
    setResponse(null);
  }, []);

  return { 
    ask, 
    regenerate,
    clearHistory,
    history,
    loading,
    error,
    lastPrompt,
    response
  };
}
