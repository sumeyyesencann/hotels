const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token gerekli' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Geçersiz token' });

  req.user = user;
  next();
}

async function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  req.user = user || null;
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
