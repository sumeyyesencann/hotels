const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCapacityCheck() {
  console.log('[Scheduler] Kapasite kontrolü başladı...');
  const results = [];

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const { data: hotels } = await supabase.from('hotels').select('id, name');

  for (const hotel of hotels || []) {
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, room_type, total_rooms, available_rooms')
      .eq('hotel_id', hotel.id);

    const lowCapacityRooms = (rooms || []).filter(r =>
      r.total_rooms > 0 && (r.available_rooms / r.total_rooms) < 0.20
    );

    if (lowCapacityRooms.length === 0) continue;

    console.log('========================================');
    console.log(`[Kapasite Uyarısı] ${hotel.name}`);
    const hotelResult = { hotel: hotel.name, rooms: [] };

    for (const r of lowCapacityRooms) {
      const pct = Math.round(r.available_rooms / r.total_rooms * 100);
      console.log(`  ${r.room_type}: ${r.available_rooms}/${r.total_rooms} oda müsait (%${pct})`);
      hotelResult.rooms.push({ room_type: r.room_type, available: r.available_rooms, total: r.total_rooms, pct });
    }
    console.log('========================================');
    results.push(hotelResult);
  }

  console.log('[Scheduler] Kapasite kontrolü tamamlandı.');
  return results;
}

function startCapacityCheckScheduler() {
  cron.schedule('0 0 * * *', async () => {
    try {
      await runCapacityCheck();
    } catch (err) {
      console.error('[Scheduler] Hata:', err.message);
    }
  });
  console.log('[Scheduler] Gece 00:00 kapasite kontrolü planlandı.');
}

module.exports = { startCapacityCheckScheduler, runCapacityCheck };
