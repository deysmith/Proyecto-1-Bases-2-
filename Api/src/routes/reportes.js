const express = require('express');
const { sql } = require('../db');
const { ejecutarSP, errorServidor, aEntero, leerPaginacion } = require('../helpers');

const router = express.Router();

// Parámetros de paginación que llevan casi todos los reportes
function paramsPagina(pagina, cantidad) {
  return [
    { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
    { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
  ];
}

// Rango de años de los tres tops: ?anioInicio=2014&anioFin=2015
function paramsRango(query) {
  return [
    { nombre: 'InicioRango', tipo: sql.Int, valor: aEntero(query.anioInicio) },
    { nombre: 'FinalRango', tipo: sql.Int, valor: aEntero(query.anioFin) }
  ];
}

// Filtros que comparten los dos seguimientos de compras
function paramsFiltrosSeguimiento(query) {
  return [
    { nombre: 'Anio', tipo: sql.Int, valor: aEntero(query.anio) },
    { nombre: 'Mes', tipo: sql.Int, valor: aEntero(query.mes) },
    { nombre: 'ID_Categoria', tipo: sql.Int, valor: aEntero(query.categoriaId) },
    { nombre: 'ID_Subcategoria', tipo: sql.Int, valor: aEntero(query.subcategoriaId) }
  ];
}

// Ejecuta el SP del reporte y responde con los datos
async function responderReporte(res, nombreSP, parametros, pagina, cantidad) {
  try {
    const filas = await ejecutarSP(nombreSP, parametros);
    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
}

// 1. GET /api/reportes/compras-proveedores?proveedor=datum&categoria=novelty
router.get('/compras-proveedores', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'Nombre_Proveedor', tipo: sql.NVarChar(100), valor: req.query.proveedor },
    { nombre: 'Categoria', tipo: sql.NVarChar(100), valor: req.query.categoria },
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'ObtenerDatosCompraProveedores', parametros, pagina, cantidad);
});

// 2. GET /api/reportes/ventas-clientes?cliente=toys&categoria=novelty
router.get('/ventas-clientes', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'Nombre_Cliente', tipo: sql.NVarChar(100), valor: req.query.cliente },
    { nombre: 'Categoria', tipo: sql.NVarChar(100), valor: req.query.categoria },
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'ObtenerDatosVentasCompradores', parametros, pagina, cantidad);
});

// 3. GET /api/reportes/top-productos?anioInicio=2014&anioFin=2015
router.get('/top-productos', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);
  const parametros = [...paramsRango(req.query), ...paramsPagina(pagina, cantidad)];

  responderReporte(res, 'ObtenerTopCincoProductos', parametros, pagina, cantidad);
});

// 4. GET /api/reportes/top-clientes?anioInicio=2014&anioFin=2015
router.get('/top-clientes', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);
  const parametros = [...paramsRango(req.query), ...paramsPagina(pagina, cantidad)];

  responderReporte(res, 'ObtenerTopCincoClientes', parametros, pagina, cantidad);
});

// 5. GET /api/reportes/top-proveedores?anioInicio=2014&anioFin=2015
router.get('/top-proveedores', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);
  const parametros = [...paramsRango(req.query), ...paramsPagina(pagina, cantidad)];

  responderReporte(res, 'ObtenerTopCincoProveedores', parametros, pagina, cantidad);
});

// 6. GET /api/reportes/resumen-categorias  (matriz, no recibe parámetros)
router.get('/resumen-categorias', async (req, res) => {
  try {
    const filas = await ejecutarSP('ResumenDeVentaPorCategoria');
    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// 7. GET /api/reportes/seguimiento-clientes?clienteId=1&anio=2015&mes=2&categoriaId=2
router.get('/seguimiento-clientes', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'ID_Cliente', tipo: sql.Int, valor: aEntero(req.query.clienteId) },
    ...paramsFiltrosSeguimiento(req.query),
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'ObtenerSeguimientoComprasClientes', parametros, pagina, cantidad);
});

// 8. GET /api/reportes/seguimiento-proveedores?proveedorId=2&anio=2015&mes=2&categoriaId=2
router.get('/seguimiento-proveedores', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'ID_Proveedor', tipo: sql.Int, valor: aEntero(req.query.proveedorId) },
    ...paramsFiltrosSeguimiento(req.query),
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'ObtenerSeguimientoComprasProveedores', parametros, pagina, cantidad);
});

// 9. GET /api/reportes/rotacion-inventario?anio=2013&proveedorId=2&categoriaId=2&productoId=10
router.get('/rotacion-inventario', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'ID_Producto', tipo: sql.Int, valor: aEntero(req.query.productoId) },
    { nombre: 'Anio', tipo: sql.Int, valor: aEntero(req.query.anio) },
    { nombre: 'ID_Proveedor', tipo: sql.Int, valor: aEntero(req.query.proveedorId) },
    { nombre: 'ID_CategoriaProducto', tipo: sql.Int, valor: aEntero(req.query.categoriaId) },
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'PromedioDiasRotacionProducto', parametros, pagina, cantidad);
});

// 10. GET /api/reportes/metodo-envio-favorito?anio=2013&mes=5&categoriaClienteId=3&categoriaProductoId=2&productoId=10
router.get('/metodo-envio-favorito', (req, res) => {
  const { pagina, cantidad } = leerPaginacion(req.query);

  const parametros = [
    { nombre: 'Anio', tipo: sql.Int, valor: aEntero(req.query.anio) },
    { nombre: 'Mes', tipo: sql.Int, valor: aEntero(req.query.mes) },
    { nombre: 'ID_CategoriaCliente', tipo: sql.Int, valor: aEntero(req.query.categoriaClienteId) },
    { nombre: 'ID_CategoriaProducto', tipo: sql.Int, valor: aEntero(req.query.categoriaProductoId) },
    { nombre: 'ID_Producto', tipo: sql.Int, valor: aEntero(req.query.productoId) },
    ...paramsPagina(pagina, cantidad)
  ];

  responderReporte(res, 'MetodoEnvioFavoritoPorCuidad', parametros, pagina, cantidad);
});

module.exports = router;