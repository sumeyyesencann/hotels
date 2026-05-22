const OpenAI = require('openai');
const tools = require('./tools');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HOTEL_SERVICE = process.env.HOTEL_SERVICE_URL || 'http://localhost:3001';

async function callTool(name, args, userToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

  if (name === 'search_hotels') {
    const params = new URLSearchParams({
      city: args.city,
      check_in: args.check_in,
      check_out: args.check_out,
      guests: args.guests
    });
    const res = await fetch(`${HOTEL_SERVICE}/api/v1/search?${params}`, { headers });
    return await res.json();
  }

  if (name === 'book_hotel') {
    const res = await fetch(`${HOTEL_SERVICE}/api/v1/reservations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(args)
    });
    return await res.json();
  }

  return { error: 'Bilinmeyen tool' };
}

async function runChat(messages, userToken) {
  const today = new Date().toISOString().split('T')[0];
  const systemMessage = {
    role: 'system',
    content: `Sen bir otel rezervasyon asistanısın. Kullanıcıların otel aramasına ve rezervasyon yapmasına yardım ediyorsun.
    Bugünün tarihi: ${today}. Kullanıcı yıl belirtmeden tarih söylerse (örn: "7 temmuz"), bu yılı veya gelecekteki en yakın tarihi kullan.
    Arama sonuçlarını net ve anlaşılır şekilde listele. Rezervasyon onayı iste. Türkçe yanıt ver.`
  };

  const allMessages = [systemMessage, ...messages];

  let response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: allMessages,
    tools,
    tool_choice: 'auto'
  });

  let message = response.choices[0].message;

  while (message.tool_calls && message.tool_calls.length > 0) {
    allMessages.push(message);

    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await callTool(toolCall.function.name, args, userToken);

      allMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: allMessages,
      tools,
      tool_choice: 'auto'
    });

    message = response.choices[0].message;
  }

  return message.content;
}

module.exports = { runChat };
