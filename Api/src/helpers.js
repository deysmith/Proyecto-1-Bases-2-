const { obtenerPool } = require('./db');

// Se ejecuta un procedure, y los parámetros undefined o null no se mandan, así el SP usa su valor por defecto.
async function ejecutarSP(nombreSP, parametros = []) {
  const pool = await obtenerPool();
  const peticion = pool.request();

  for (const p of parametros) {
    if (p.valor !== undefined && p.valor !== null) {
      peticion.input(p.nombre, p.tipo, p.valor);
    }
  }

  const resultado = await peticion.execute(nombreSP);
  return resultado.recordset || [];
}

// Los SPs devuelven los errores como un SELECT con NumeroError
function hayError(filas) {
  return filas.length > 0 && filas[0].NumeroError !== undefined;
}

function responderError(res, fila) {
  let estado = 400;
  if (fila.NumeroError === 50007) estado = 404; // no existe
  if (fila.NumeroError === 50001 || fila.NumeroError === 2627 || fila.NumeroError === 2601) estado = 409; // nombre repetido

  res.status(estado).json({
    ok: false,
    codigo: fila.NumeroError,
    error: fila.MensajeError
  });
}

function errorServidor(res, error) {
  console.log(error);
  res.status(500).json({ ok: false, error: error.message });
}

// Se convierte texto a entero, si no se puede devuelve undefined
function aEntero(valor) {
  const numero = parseInt(valor);
  return isNaN(numero) ? undefined : numero;
}

// Lee ?pagina=1&cantidad=20 y valida que sean positivos
function leerPaginacion(query) {
  let pagina = aEntero(query.pagina);
  let cantidad = aEntero(query.cantidad);

  if (pagina === undefined || pagina < 1) pagina = 1;
  if (cantidad === undefined || cantidad < 1) cantidad = 20;

  return { pagina, cantidad };
}

module.exports = { ejecutarSP, hayError, responderError, errorServidor, aEntero, leerPaginacion };