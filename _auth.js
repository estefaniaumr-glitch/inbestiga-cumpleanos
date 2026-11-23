const crypto = require('crypto');

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
  return value;
}
function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => {
    const i = part.indexOf('=');
    return i < 0 ? ['', ''] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }).filter(([k]) => k));
}
function hasEditorSession(req) {
  try {
    const token = parseCookies(req).inbestiga_editor;
    if (!token) return false;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) && data.role === 'editor';
  } catch (_) { return false; }
}
function setEditorCookie(res) {
  const payload = Buffer.from(JSON.stringify({
    role: 'editor',
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
  })).toString('base64url');
  const token = payload + '.' + sign(payload);
  res.setHeader('Set-Cookie', `inbestiga_editor=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);
}
function clearEditorCookie(res) {
  res.setHeader('Set-Cookie', 'inbestiga_editor=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}
module.exports = { hasEditorSession, setEditorCookie, clearEditorCookie };
