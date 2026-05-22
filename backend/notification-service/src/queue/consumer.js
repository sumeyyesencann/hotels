const amqp = require('amqplib');

async function startQueueConsumer() {
  try {
    const conn = await amqp.connect(process.env.CLOUDAMQP_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('new_reservations', { durable: true });
    channel.prefetch(1);

    console.log('[Queue] Rezervasyon kuyruğu dinleniyor...');

    channel.consume('new_reservations', async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());

        console.log('========================================');
        console.log('[Bildirim] YENİ REZERVASYON');
        console.log(`  Rezervasyon ID : ${data.reservation_id}`);
        console.log(`  Otel           : ${data.hotel_name}`);
        console.log(`  Kullanıcı      : ${data.user_email}`);
        console.log(`  Giriş          : ${data.check_in}`);
        console.log(`  Çıkış          : ${data.check_out}`);
        console.log(`  Oda Tipi       : ${data.room_type}`);
        console.log(`  Misafir        : ${data.guest_count}`);
        console.log(`  Toplam Fiyat   : ${data.total_price} TL`);
        console.log('========================================');

        channel.ack(msg);
      } catch (err) {
        console.error('[Queue] Mesaj işleme hatası:', err.message);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('[Queue] Bağlantı hatası:', err.message);
    setTimeout(startQueueConsumer, 5000);
  }
}

module.exports = { startQueueConsumer };
