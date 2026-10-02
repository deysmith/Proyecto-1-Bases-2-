const express = require('express');
const { sql } = require('../db');
const {
  ejecutarSP, hayError, responderError, errorServidor, aEntero, leerPaginacion, armarParametros
} = require('../helpers');

const router = express.Router();

const camposAgregar = [
  { nombre: 'Nombre_Proveedor', tipo: sql.NVarChar(100) },
  { nombre: 'CategoriaID', tipo: sql.Int },
  { nombre: 'Nombre_ContactoPrimario', tipo: sql.NVarChar(50) },
  { nombre: 'Nombre_ContactoSecundario', tipo: sql.NVarChar(50) },
  { nombre: 'ID_ContactoPrimario', tipo: sql.Int },
  { nombre: 'ID_ContactoSecundario', tipo: sql.Int },
  { nombre: 'MetodoEntegaID', tipo: sql.Int },
  { nombre: 'DeliveryCityID', tipo: sql.Int },
  { nombre: 'PostalCityID', tipo: sql.Int },
  { nombre: 'SupplierReference', tipo: sql.NVarChar(20) },
  { nombre: 'BanckAccountBranch', tipo: sql.NVarChar(50) },
  { nombre: 'BankAccountNumber', tipo: sql.NVarChar(20) },
  { nombre: 'PaymentDays', tipo: sql.Int },
  { nombre: 'Telefono', tipo: sql.NVarChar(20) },
  { nombre: 'Fax', tipo: sql.NVarChar(20) },
  { nombre: 'WebsiteURL', tipo: sql.NVarChar(256) },
  { nombre: 'DeliveryAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'DeliveryPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryLocation', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'PostalAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'PostalPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PostalAddress2', tipo: sql.NVarChar(60) }
];

const camposEditar = [
  { nombre: 'Nombre_Proveedor', tipo: sql.NVarChar(100) },
  { nombre: 'CategoriaID', tipo: sql.Int },
  { nombre: 'MetodoEntegaID', tipo: sql.Int },
  { nombre: 'DeliveryCityID', tipo: sql.Int },
  { nombre: 'PostalCityID', tipo: sql.Int },
  { nombre: 'SupplierReference', tipo: sql.NVarChar(20) },
  { nombre: 'BanckAccountBranch', tipo: sql.NVarChar(50) },
  { nombre: 'BankAccountNumber', tipo: sql.NVarChar(20) },
  { nombre: 'PaymentDays', tipo: sql.Int },
  { nombre: 'Telefono', tipo: sql.NVarChar(20) },
  { nombre: 'Fax', tipo: sql.NVarChar(20) },
  { nombre: 'WebsiteURL', tipo: sql.NVarChar(256) },
  { nombre: 'DeliveryAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'DeliveryPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryLocation', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'PostalAddress1', tipo: sql.NVarChar(60) },
  { nombre: 'PostalPostalCode', tipo: sql.NVarChar(10) },
  { nombre: 'DeliveryAddress2', tipo: sql.NVarChar(60) },
  { nombre: 'PostalAddress2', tipo: sql.NVarChar(60) }
];

// Estos no tienen valor por defecto en el SP, entonces son obligatorios
const camposObligatorios = [
  'Nombre_Proveedor', 'CategoriaID', 'MetodoEntegaID', 'DeliveryCityID',
  'PostalCityID', 'SupplierReference', 'BanckAccountBranch', 'BankAccountNumber',
  'PaymentDays', 'Telefono', 'Fax', 'WebsiteURL', 'DeliveryAddress1',
  'DeliveryPostalCode', 'PostalAddress1', 'PostalPostalCode'
];

// GET /api/proveedores?pagina=1&cantidad=20
router.get('/', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('GetProveedores', [
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/proveedores/buscar?nombre=novelty&categoriaId=2&metodoEntregaId=1&pagina=1&cantidad=20
router.get('/buscar', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('BuscarProveedores', [
      { nombre: 'Nombre_Proveedor', tipo: sql.NVarChar(100), valor: req.query.nombre },
      { nombre: 'CategoriaID', tipo: sql.Int, valor: aEntero(req.query.categoriaId) },
      { nombre: 'MetodoEntegaID', tipo: sql.Int, valor: aEntero(req.query.metodoEntregaId) },
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/proveedores/categorias  (solo las que tienen proveedores, para los filtros)
router.get('/categorias', async (req, res) => {
  try {
    const filas = await ejecutarSP('ObtenerCategoriasProveedores');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/proveedores/metodos-entrega  (solo los usados por proveedores, para los filtros)
router.get('/metodos-entrega', async (req, res) => {
  try {
    const filas = await ejecutarSP('ObtenerMetodosDeEntregaProveedores');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/proveedores/detalle?nombre=A Datum Corporation
router.get('/detalle', async (req, res) => {
  try {
    const nombre = req.query.nombre;

    if (!nombre) {
      return res.status(400).json({ ok: false, error: 'Falta el parámetro nombre' });
    }

    const filas = await ejecutarSP('ObtenerDatosProveedor', [
      { nombre: 'Nombre_Proveedor', tipo: sql.NVarChar(100), valor: nombre }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Proveedor no encontrado' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/proveedores/18
router.get('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del proveedor no es válido' });
    }

    const filas = await ejecutarSP('ObtenerDatosProveedor', [
      { nombre: 'ID_Proveedor', tipo: sql.Int, valor: id }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Proveedor no encontrado' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/proveedores
router.post('/', async (req, res) => {
  try {
    const faltantes = camposObligatorios.filter(
      (campo) => req.body[campo] === undefined || req.body[campo] === null
    );

    if (faltantes.length > 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios', faltantes });
    }

    const filas = await ejecutarSP('AgregarNuevoProveedor', armarParametros(camposAgregar, req.body));

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.status(201).json({ ok: true, mensaje: 'Proveedor creado', datos: filas[0] || null });
  } catch (error) {
    errorServidor(res, error);
  }
});

// PUT /api/proveedores/18  (solo se manda lo que se quiere cambiar)
router.put('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del proveedor no es válido' });
    }

    const parametros = armarParametros(camposEditar, req.body);
    parametros.push({ nombre: 'ID_Proveedor', tipo: sql.Int, valor: id });

    const filas = await ejecutarSP('EditarDatosProveedor', parametros);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Proveedor actualizado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/proveedores/18
router.delete('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del proveedor no es válido' });
    }

    const filas = await ejecutarSP('BorrarProveedor', [
      { nombre: 'ID_Proveedor', tipo: sql.Int, valor: id }
    ]);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Proveedor eliminado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;