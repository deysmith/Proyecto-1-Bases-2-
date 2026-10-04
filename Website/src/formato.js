const formatoDinero = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// Convierte un número en dinero ($1,234.50). Si el valor no es un número (por ejemplo "No indica") lo deja igual
export function dinero(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  return isNaN(numero) ? valor : formatoDinero.format(numero);
}

// Convierte un número entero en texto con separador de miles
export function entero(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('es-CR');
}

// Convierte una fecha de la API (2013-01-01T00:00:00.000Z) en 1/1/2013
export function fecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-CR', { timeZone: 'UTC' });
}

// Convierte un número en texto con 2 decimales (por ejemplo días de rotación)
export function decimal(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}