const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token gerekli' });

  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.sub) return res.status(401).json({ error: 'Geçersiz token' });

  req.user = { id: decoded.sub, email: decoded.email };
  next();
}

function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.replace('Bearer ', '');
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
