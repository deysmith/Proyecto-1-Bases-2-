const express = require('express');
const { sql } = require('../db');
const { ejecutarSP, errorServidor, aEntero } = require('../helpers');

const router = express.Router();

const rutas = [
  { url: '/categorias-proveedores', sp: 'ObtenerTodasCategoriasProveedores' },
  { url: '/categorias-clientes', sp: 'ObtenerTodasCategoriasClientes' },
  { url: '/metodos-entrega', sp: 'ObtenerMetodosDeEntregaGeneral' },
  { url: '/grupos-productos', sp: 'ObtenerTodasGruposProductos' },
  { url: '/tipos-paquete', sp: 'ObtenerTiposDePaquete' },
  { url: '/colores-productos', sp: 'ObtenerColoresProductos' },
  { url: '/anios-ventas', sp: 'ObtenerFechasVentasAnioProveedor' }
];

rutas.forEach((ruta) => {
  router.get(ruta.url, async (req, res) => {
    try {
      const filas = await ejecutarSP(ruta.sp);
      res.json({ ok: true, datos: filas });
    } catch (error) {
      errorServidor(res, error);
    }
  });
});

// GET /api/generales/ciudades?criterio=glen&cantidad=20
router.get('/ciudades', async (req, res) => {
  try {
    const cantidad = Math.min(aEntero(req.query.cantidad) || 20, 50);

    const filas = await ejecutarSP('BuscarCiudades', [
      { nombre: 'Criterio', tipo: sql.NVarChar(50), valor: req.query.criterio },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;