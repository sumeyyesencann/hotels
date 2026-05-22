require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());

const HOTEL_SERVICE = process.env.HOTEL_SERVICE_URL || 'http://localhost:3001';
const COMMENTS_SERVICE = process.env.COMMENTS_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE = process.env.AI_SERVICE_URL || 'http://localhost:3003';

const proxy = (target) =>
  createProxyMiddleware({ target, changeOrigin: true, on: { error: (err, req, res) => { res.status(502).json({ error: 'Service unavailable' }); } } });

app.use('/api/v1/hotels', proxy(HOTEL_SERVICE));
app.use('/api/v1/search', proxy(HOTEL_SERVICE));
app.use('/api/v1/reservations', proxy(HOTEL_SERVICE));
app.use('/api/v1/comments', proxy(COMMENTS_SERVICE));
app.use('/api/v1/ai', proxy(AI_SERVICE));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
