const express = require('express');
const { ejecutarSP, errorServidor } = require('../helpers');

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

module.exports = router;