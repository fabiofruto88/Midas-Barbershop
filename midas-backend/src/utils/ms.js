// Convierte duraciones como "7d", "12h", "30m", "45s" o un número de segundos a milisegundos.
const UNITS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

const ms = (value) => {
  if (typeof value === 'number') return value * 1000;
  const match = /^(\d+)\s*([smhd])?$/.exec(String(value).trim());
  if (!match) throw new Error(`Duración inválida: ${value}`);
  const [, amount, unit = 's'] = match;
  return Number(amount) * UNITS[unit];
};

module.exports = ms;
