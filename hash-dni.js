// Ejecuta localmente: node scripts/hash-dni.js 12345678
// No envía ni imprime el DNI; solo muestra el hash para Vercel.
const crypto = require('crypto');
const dni = process.argv[2] || '';
if (!/^\d{8}$/.test(dni)) {
  console.error('Uso: node scripts/hash-dni.js DNI_DE_8_DIGITOS');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(dni, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
console.log(`${salt}:${hash}`);
