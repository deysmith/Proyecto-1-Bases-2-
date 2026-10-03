const express = require('express');
const { sql } = require('../db');
const {
  ejecutarSP, hayError, responderError, errorServidor, aEntero, leerPaginacion, armarParametros
} = require('../helpers');

const router = express.Router();

const camposAgregar = [
  { nombre: 'Nombre_Producto', tipo: sql.NVarChar(100) },
  { nombre: 'ProveedorID', tipo: sql.Int },
  { nombre: 'ColorID', tipo: sql.Int },
  { nombre: 'UnitPackageID', tipo: sql.Int },
  { nombre: 'OuterPackageID', tipo: sql.Int },
  { nombre: 'Marca', tipo: sql.NVarChar(50) },
  { nombre: 'Size', tipo: sql.NVarChar(20) },
  { nombre: 'QuantityPerOuter', tipo: sql.Int },
  { nombre: 'TaxRate', tipo: sql.Decimal(18, 3) },
  { nombre: 'UnitPrice', tipo: sql.Decimal(18, 2) },
  { nombre: 'RecommendedPrice', tipo: sql.Decimal(18, 2) },
  { nombre: 'TypicalWeight', tipo: sql.Decimal(18, 3) },
  { nombre: 'MarketingSearchDetails', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'BinLocation', tipo: sql.NVarChar(20) },
  { nombre: 'QuantityOnHand', tipo: sql.Int },
  { nombre: 'Grupos_Productos', tipo: sql.NVarChar(100) }
];

const camposEditar = [
  { nombre: 'Nombre_Producto', tipo: sql.NVarChar(100) },
  { nombre: 'ColorID', tipo: sql.Int },
  { nombre: 'UnitPackageID', tipo: sql.Int },
  { nombre: 'OuterPackageID', tipo: sql.Int },
  { nombre: 'Marca', tipo: sql.NVarChar(50) },
  { nombre: 'Size', tipo: sql.NVarChar(20) },
  { nombre: 'QuantityPerOuter', tipo: sql.Int },
  { nombre: 'TaxRate', tipo: sql.Decimal(18, 3) },
  { nombre: 'UnitPrice', tipo: sql.Decimal(18, 2) },
  { nombre: 'RecommendedPrice', tipo: sql.Decimal(18, 2) },
  { nombre: 'TypicalWeight', tipo: sql.Decimal(18, 3) },
  { nombre: 'MarketingSearchDetails', tipo: sql.NVarChar(sql.MAX) },
  { nombre: 'BinLocation', tipo: sql.NVarChar(20) },
  { nombre: 'QuantityOnHand', tipo: sql.Int },
  { nombre: 'Grupos_Productos', tipo: sql.NVarChar(100) }
];

// Estos no tienen valor por defecto en el SP, entonces son obligatorios
const camposObligatorios = [
  'Nombre_Producto', 'ProveedorID', 'UnitPackageID', 'OuterPackageID',
  'QuantityPerOuter', 'TaxRate', 'UnitPrice', 'TypicalWeight',
  'MarketingSearchDetails', 'BinLocation', 'QuantityOnHand', 'Grupos_Productos'
];

// Si los grupos vienen como arreglo [1, 2, 3] los convierte a "1,2,3"
function prepararGrupos(body) {
  if (Array.isArray(body.Grupos_Productos)) {
    body.Grupos_Productos = body.Grupos_Productos.join(',');
  }
}

// GET /api/productos?pagina=1&cantidad=20
router.get('/', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('GetProductos', [
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/productos/buscar?nombre=shirt&grupoId=2&cantidadMinima=10&cantidadMaxima=500
router.get('/buscar', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('BuscarProductos', [
      { nombre: 'Nombre', tipo: sql.NVarChar(100), valor: req.query.nombre },
      { nombre: 'GrupoID', tipo: sql.Int, valor: aEntero(req.query.grupoId) },
      { nombre: 'CantidadMinima', tipo: sql.Int, valor: aEntero(req.query.cantidadMinima) },
      { nombre: 'CantidadMaxima', tipo: sql.Int, valor: aEntero(req.query.cantidadMaxima) },
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/productos/grupos  (solo los grupos con productos, para los filtros)
router.get('/grupos', async (req, res) => {
  try {
    const filas = await ejecutarSP('ObtenerGruposProductos');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/productos/detalle?nombre=Camiseta TEC
router.get('/detalle', async (req, res) => {
  try {
    const nombre = req.query.nombre;

    if (!nombre) {
      return res.status(400).json({ ok: false, error: 'Falta el parámetro nombre' });
    }

    const filas = await ejecutarSP('ObtenerDatosProducto', [
      { nombre: 'Nombre_Producto', tipo: sql.NVarChar(100), valor: nombre }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/productos/10
router.get('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del producto no es válido' });
    }

    const filas = await ejecutarSP('ObtenerDatosProducto', [
      { nombre: 'ID_Producto', tipo: sql.Int, valor: id }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/productos
router.post('/', async (req, res) => {
  try {
    prepararGrupos(req.body);

    const faltantes = camposObligatorios.filter(
      (campo) => req.body[campo] === undefined || req.body[campo] === null
    );

    if (faltantes.length > 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios', faltantes });
    }

    const filas = await ejecutarSP('AgregarNuevoProducto', armarParametros(camposAgregar, req.body));

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.status(201).json({ ok: true, mensaje: 'Producto creado', datos: filas[0] || null });
  } catch (error) {
    errorServidor(res, error);
  }
});

// PUT /api/productos/10  (solo se manda lo que se quiere cambiar)
router.put('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del producto no es válido' });
    }

    prepararGrupos(req.body);

    const parametros = armarParametros(camposEditar, req.body);
    parametros.push({ nombre: 'ID_Producto', tipo: sql.Int, valor: id });

    const filas = await ejecutarSP('EditarDatosProducto', parametros);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Producto actualizado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/productos/10
router.delete('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El ID del producto no es válido' });
    }

    const filas = await ejecutarSP('EliminarProducto', [
      { nombre: 'ID_Producto', tipo: sql.Int, valor: id }
    ]);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Producto eliminado' });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;