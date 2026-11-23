const { clearEditorCookie } = require('./_auth');
module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  clearEditorCookie(res);
  return res.status(200).json({ ok: true });
};
