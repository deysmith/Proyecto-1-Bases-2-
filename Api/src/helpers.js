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

// Códigos de error de los SPs, se van agregando según los módulos
const codigosNoExiste = [50007, 50011, 50017, 50026];
const codigosDuplicado = [50001, 50002, 50003, 50018, 2627, 2601];

function responderError(res, fila) {
  let estado = 400;
  if (codigosNoExiste.includes(fila.NumeroError)) estado = 404;
  if (codigosDuplicado.includes(fila.NumeroError)) estado = 409;

  res.status(estado).json({
    ok: false,
    codigo: fila.NumeroError,
    error: fila.MensajeError
  });
}

function errorServidor(res, error) {
  // Los THROW de los SPs (50000 en adelante) son errores de validación, no del servidor
  if (error.number >= 50000 && error.number < 60000) {
    return res.status(400).json({ ok: false, codigo: error.number, error: error.message });
  }

  console.log(error);
  res.status(500).json({ ok: false, error: error.message });
}

// Se convierte texto a entero, si no se puede devuelve undefined
function aEntero(valor) {
  const numero = parseInt(valor);
  return isNaN(numero) ? undefined : numero;
}

// Convierte texto a decimal, si no se puede devuelve undefined
function aDecimal(valor) {
  const numero = parseFloat(valor);
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

// Convierte el body en la lista de parámetros que espera ejecutarSP
function armarParametros(campos, body) {
  return campos.map((campo) => ({
    nombre: campo.nombre,
    tipo: campo.tipo,
    valor: body[campo.nombre]
  }));
}

module.exports = { ejecutarSP, hayError, responderError, errorServidor, aEntero, aDecimal, leerPaginacion, armarParametros };