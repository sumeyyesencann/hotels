require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/hotels', require('./routes/admin'));
app.use('/api/v1/search', require('./routes/search'));
app.use('/api/v1/reservations', require('./routes/reservations'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hotel-service' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Hotel Service running on port ${PORT}`));
