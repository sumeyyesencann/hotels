require('dotenv').config();
const express = require('express');
const { startCapacityCheckScheduler, runCapacityCheck } = require('./scheduler/capacityCheck');
const { startQueueConsumer } = require('./queue/consumer');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

// Manuel test endpoint'i
app.post('/trigger/capacity-check', async (req, res) => {
  try {
    const results = await runCapacityCheck();
    res.json({
      message: 'Kapasite kontrolü çalıştırıldı',
      warnings: results.length,
      details: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

startCapacityCheckScheduler();
startQueueConsumer();

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
