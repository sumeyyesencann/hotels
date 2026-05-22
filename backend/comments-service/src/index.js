require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/mongodb');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/v1/comments', require('./routes/comments'));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'comments-service' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Comments Service running on port ${PORT}`));
