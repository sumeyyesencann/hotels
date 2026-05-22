const tools = [
  {
    type: 'function',
    function: {
      name: 'search_hotels',
      description: 'Otelleri şehir, giriş/çıkış tarihleri ve misafir sayısına göre arar ve müsait odaları döner',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Şehir adı (örn: İstanbul, Bodrum, Roma)' },
          check_in: { type: 'string', description: 'Giriş tarihi YYYY-MM-DD formatında' },
          check_out: { type: 'string', description: 'Çıkış tarihi YYYY-MM-DD formatında' },
          guests: { type: 'number', description: 'Misafir sayısı' }
        },
        required: ['city', 'check_in', 'check_out', 'guests']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_hotel',
      description: 'Seçilen oteli rezerve eder',
      parameters: {
        type: 'object',
        properties: {
          hotel_id: { type: 'string', description: 'Otel ID' },
          room_id: { type: 'string', description: 'Oda ID' },
          check_in: { type: 'string', description: 'Giriş tarihi YYYY-MM-DD' },
          check_out: { type: 'string', description: 'Çıkış tarihi YYYY-MM-DD' },
          guest_count: { type: 'number', description: 'Misafir sayısı' }
        },
        required: ['hotel_id', 'room_id', 'check_in', 'check_out', 'guest_count']
      }
    }
  }
];

module.exports = tools;
