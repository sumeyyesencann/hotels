const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log('[auth] Header:', authHeader ? authHeader.substring(0, 30) + '...' : 'YOK');

  if (!authHeader) return res.status(401).json({ error: 'Token gerekli' });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  console.log('[auth] Token length:', token.length);

  const decoded = jwt.decode(token);
  console.log('[auth] Decoded:', decoded ? `sub=${decoded.sub}, email=${decoded.email}` : 'NULL');

  if (!decoded || !decoded.sub) return res.status(401).json({ error: 'Geçersiz token' });

  req.user = { id: decoded.sub, email: decoded.email };
  next();
}

function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return next();

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = jwt.decode(token);
  req.user = (decoded && decoded.sub) ? { id: decoded.sub, email: decoded.email } : null;
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Giriş gerekli' });

  const { data, error } = await supabase
    .from('hotel_admins')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(403).json({ error: 'Admin yetkisi gerekli' });

  next();
}

module.exports = { authenticate, authenticateOptional, requireAdmin };
