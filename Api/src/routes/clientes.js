const express = require('express');
const { sql } = require('../db');
const {
  ejecutarSP, hayError, responderError, errorServidor, aEntero, leerPaginacion
} = require('../helpers');

const router = express.Router();

// Campos del body y su tipo en SQL Server
const camposAgregar = [
  { nombre: 'Nombre_Cliente', tipo: sql.NVarChar(100) },
  { nombre: 'CategoriaID', tipo: sql.Int },
  { nombre: 'Nombre_ContactoPrimario', tipo: sql.NVarChar(50) },
  { nombre: 'Nombre_ContactoSecundario', tipo: sql.NVarChar(50) },
  { nombre: 'ID_ContactoPrimario', tipo: sql.Int },
  { nombre: 'ID_ContactoSecundario', tipo: sql.Int },
  { nombre: 'MetodoEntregaID', tipo: sql.Int },
  { nombre: 'DeliveryCityID', tipo: sql.Int },
  { nombre: 'PostalCityID', tipo: sql.Int },
  { nombre: 'Telefono', tipo: sql.NVarChar(20) },
  { nombre: 'Fax', tipo: sql.NVarChar(20) },
  { nombre: 'WebsiteURL', tipo: sql.NVarChar(256) },
  { nombre: 'DeliveryAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'DeliveryPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryLocation', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'PostalAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'PostalPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PostalAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PaymentDays', tipo: sql.Int }
];

const camposEditar = [
  { nombre: 'Nombre_Cliente', tipo: sql.NVarChar(100) },
  { nombre: 'CategoriaID', tipo: sql.Int },
  { nombre: 'MetodoEntregaID', tipo: sql.Int },
  { nombre: 'DeliveryCityID', tipo: sql.Int },
  { nombre: 'PostalCityID', tipo: sql.Int },
  { nombre: 'Telefono', tipo: sql.NVarChar(20) },
  { nombre: 'Fax', tipo: sql.NVarChar(20) },
  { nombre: 'WebsiteURL', tipo: sql.NVarChar(256) },
  { nombre: 'DeliveryAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'DeliveryPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryLocation', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'PostalAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'PostalPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PostalAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PaymentDays', tipo: sql.Int }
];

// Estos no tienen valor por defecto en el SP, entonces son obligatorios
const camposObligatorios = [
  'Nombre_Cliente', 'CategoriaID', 'MetodoEntregaID', 'DeliveryCityID',
  'PostalCityID', 'Telefono', 'Fax', 'WebsiteURL', 'DeliveryAddress1',
  'DeliveryPostalCode', 'PostalAddress1', 'PostalPostalCode', 'PaymentDays'
];

// Convierte el body en la lista de parámetros que espera ejecutarSP
function armarParametros(campos, body) {
  return campos.map((campo) => ({
    nombre: campo.nombre,
    tipo: campo.tipo,
    valor: body[campo.nombre]
  }));
}

// GET /api/clientes?pagina=1&cantidad=20
router.get('/', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('GetClientes', [
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/clientes/buscar?criterio=toys&categoriaId=3&metodoEntregaId=2&pagina=1&cantidad=20
router.get('/buscar', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('BuscarFiltrarClientes', [
      { nombre: 'Criterio', tipo: sql.NVarChar(100), valor: req.query.criterio },
      { nombre: 'CategoriaID', tipo: sql.Int, valor: aEntero(req.query.categoriaId) },
      { nombre: 'MetodoEntregaID', tipo: sql.Int, valor: aEntero(req.query.metodoEntregaId) },
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/clientes/categorias  (solo las que tienen clientes, para los filtros)
router.get('/categorias', async (req, res) => {
  try {
    const filas = await ejecutarSP('ObtenerCategoriasClientes');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/clientes/metodos-entrega  (solo los usados por clientes, para los filtros)
router.get('/metodos-entrega', async (req, res) => {
  try {
    const filas = await ejecutarSP('ObtenerMetodosDeEntregaClientes');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/clientes/detalle?nombre=Tailspin Toys (Sylvanite, MT)
router.get('/detalle', async (req, res) => {
  try {
    const nombre = req.query.nombre;

    if (!nombre) {
      return res.status(400).json({ ok: false, error: 'Falta el parámetro nombre' });
    }

    const filas = await ejecutarSP('ObtenerDatosClientes', [
      { nombre: 'Nombre_Cliente', tipo: sql.NVarChar(100), valor: nombre }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  try {
    const faltantes = camposObligatorios.filter(
      (campo) => req.body[campo] === undefined || req.body[campo] === null
    );

    if (faltantes.length > 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios', faltantes });
    }

    const filas = await ejecutarSP('AgregarNuevoCliente', armarParametros(camposAgregar, req.body));

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.status(201).json({ ok: true, mensaje: 'Cliente creado', datos: filas[0] || null });
  } catch (error) {
    errorServidor(res, error);
  }
});

// PUT /api/clientes/1164  (solo se manda lo que se quiere cambiar)
router.put('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del cliente no es válido' });
    }

    const parametros = armarParametros(camposEditar, req.body);
    parametros.push({ nombre: 'ID_Cliente', tipo: sql.Int, valor: id });

    const filas = await ejecutarSP('EditarDatosClientes', parametros);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Cliente actualizado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/clientes/1164 -> Un ejemplo para que mi asistente favorito de BDII lo pruebe conmigo en la revisión, si llega a esta parte me debe un papanachos.
router.delete('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del cliente no es válido' });
    }

    const filas = await ejecutarSP('BorrarCliente', [
      { nombre: 'ID_Cliente', tipo: sql.Int, valor: id }
    ]);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Cliente eliminado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;