const crypto = require('crypto');
const { setEditorCookie } = require('./_auth');

const attempts = new Map();
function validDni(dni) { return typeof dni === 'string' && /^\d{8}$/.test(dni); }
function safeEqual(a, b) {
  const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex');
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}
function verifyDni(dni) {
  const configured = (process.env.EDITOR_DNI_HASHES || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!configured.length) throw new Error('No están configurados los DNI autorizados.');
  return configured.some(entry => {
    const parts = entry.split(':');
    if (parts.length !== 2 || !/^[a-f0-9]{32,128}$/i.test(parts[0]) || !/^[a-f0-9]{128}$/i.test(parts[1])) return false;
    const [salt, expected] = parts;
    const actual = crypto.scryptSync(dni, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return safeEqual(actual, expected);
  });
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, until: now + 10 * 60 * 1000 };
  if (now > record.until) { record.count = 0; record.until = now + 10 * 60 * 1000; }
  if (record.count >= 10) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
  record.count++;
  attempts.set(ip, record);
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const dni = body && String(body.dni || '').trim();
    if (!validDni(dni) || !verifyDni(dni)) return res.status(401).json({ error: 'DNI no autorizado.' });
    attempts.delete(ip);
    setEditorCookie(res);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('POST /api/login:', e.message);
    return res.status(500).json({ error: 'El acceso de edición aún no está configurado. Revisa las variables de Vercel.' });
  }
};
