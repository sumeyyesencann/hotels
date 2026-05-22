const express = require('express');
const router = express.Router();
const { runChat } = require('../agent/chat');

router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array gerekli' });
  }

  const userToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    const reply = await runChat(messages, userToken);
    res.json({ reply });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'AI yanıt veremedi' });
  }
});

module.exports = router;
