const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/ai', async (req, res) => {
  const { messages, sectionContent } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages array.' });
  }
  try {
    // If sectionContent is provided, add it as system context
    let systemPrompt = '';
    if (sectionContent) {
      systemPrompt = `Here is the current section content for context:\n${sectionContent}\n`;
    }
    // Prepend system message if needed
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 500,
    });
    // If the user prompt is a rewrite or fix, return as JSON for the frontend
    const userPrompt = messages[messages.length - 1]?.content?.toLowerCase() || '';
    if (userPrompt.includes('rewrite') || userPrompt.includes('fix')) {
      return res.json({ response: { content: JSON.stringify({ newContent: completion.choices[0].message.content }) } });
    }
    res.json({ response: completion.choices[0].message });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: err.message || 'OpenAI API error' });
  }
});

app.listen(port, () => {
  console.log(`AI backend listening on port ${port}`);
}); 