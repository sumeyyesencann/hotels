const amqp = require('amqplib');

let channel = null;

async function getChannel() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.CLOUDAMQP_URL);
  channel = await conn.createChannel();
  await channel.assertQueue('new_reservations', { durable: true });
  return channel;
}

async function publishReservation(data) {
  const ch = await getChannel();
  ch.sendToQueue('new_reservations', Buffer.from(JSON.stringify(data)), { persistent: true });
}

module.exports = { publishReservation };
