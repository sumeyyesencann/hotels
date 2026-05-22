require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/ai', require('./routes/ai'));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ai-agent-service' }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`AI Agent Service running on port ${PORT}`));
