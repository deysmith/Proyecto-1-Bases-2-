const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Hace la petición a la API y devuelve el JSON.
// Si algo falla, lanza un Error con un mensaje claro para mostrar al usuario.
export async function pedir(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(URL_BASE + ruta, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones
    });
  } catch (error) {
    throw new Error('No se pudo conectar con la API. Verifique que esté encendida.');
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (error) {
    datos = null;
  }

  if (!respuesta.ok || (datos && datos.ok === false)) {
    throw new Error((datos && datos.error) || 'Ocurrió un error inesperado.');
  }

  return datos;
}

// Arma el texto ?a=1&b=2 sin incluir los valores vacíos
export function armarQuery(parametros) {
  const query = new URLSearchParams();

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      query.append(clave, valor);
    }
  });

  const texto = query.toString();
  return texto ? '?' + texto : '';
}