import { useState } from 'react';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: this should be backend-only in prod!
});

export function useOpenAI() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (text) => {
    setLoading(true);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: text }],
      });
      setResponse(completion.choices[0].message.content);
    } catch (err) {
      setResponse('⚠️ Error reaching OpenAI');
    }
    setLoading(false);
  };

  return { ask, response, loading };
}
