
const { hasEditorSession } = require('./_auth');

function config() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel.');
  }

  return { url, key };
}

function headers(key, extra = {}) {
  const h = {
    apikey: key,
    'Content-Type': 'application/json',
    ...extra
  };

  // Las claves nuevas sb_secret_ no se envían como Bearer JWT.
  // Las claves antiguas service_role sí utilizan Authorization.
  if (!key.startsWith('sb_secret_')) {
    h.Authorization = `Bearer ${key}`;
  }

  return h;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // CARGAR CUMPLEAÑOS
  if (req.method === 'GET') {
    try {
      const { url, key } = config();

      const response = await fetch(
        `${url}/rest/v1/app_state?id=eq.1&select=data`,
        {
          headers: headers(key)
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase respondió ${response.status}: ${detail}`);
      }

      const rows = await response.json();

      if (!rows.length || !rows[0].data) {
        throw new Error('No existe el registro inicial app_state.');
      }

      return res.status(200).json(rows[0].data);

    } catch (e) {
      console.error('GET /api/data:', e.message);

      return res.status(500).json({
        error: 'No se pudieron cargar los datos. Revisa la configuración de Supabase.'
      });
    }
  }

  // GUARDAR CAMBIOS
  if (req.method === 'POST') {
    if (!hasEditorSession(req)) {
      return res.status(401).json({
        error: 'Sesión no autorizada o vencida.'
      });
    }

    try {
      const body = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

      if (!body || !Array.isArray(body.people) || body.people.length > 1000) {
        return res.status(400).json({
          error: 'Formato de datos no válido.'
        });
      }

      const ids = new Set();

      for (const p of body.people) {
        if (
          !p ||
          !Number.isInteger(Number(p.id)) ||
          ids.has(Number(p.id)) ||
          typeof p.n !== 'string' || !p.n.trim() ||
          typeof p.s !== 'string' || !p.s.trim() ||
          typeof p.a !== 'string' || !p.a.trim() ||
          !Number.isInteger(Number(p.m)) ||
          Number(p.m) < 1 || Number(p.m) > 12 ||
          !Number.isInteger(Number(p.d)) ||
          Number(p.d) < 1 || Number(p.d) > 31
        ) {
          return res.status(400).json({
            error: 'Hay un registro con campos no válidos.'
          });
        }

        ids.add(Number(p.id));
      }

      const { url, key } = config();

      const response = await fetch(
        `${url}/rest/v1/app_state?id=eq.1`,
        {
          method: 'PATCH',
          headers: headers(key, {
            Prefer: 'return=minimal'
          }),
          body: JSON.stringify({
            data: body,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase respondió ${response.status}: ${detail}`);
      }

      return res.status(200).json({ ok: true });

    } catch (e) {
      console.error('POST /api/data:', e.message);

      return res.status(500).json({
        error: 'No se pudieron guardar los cambios en Supabase.'
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');

  return res.status(405).json({
    error: 'Método no permitido.'
  });
};
