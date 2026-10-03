const express = require('express');
const { sql } = require('../db');
const {
  ejecutarSP, hayError, responderError, errorServidor, aEntero, aDecimal, leerPaginacion, armarParametros
} = require('../helpers');

const router = express.Router();

const camposCrear = [
  { nombre: 'ID_Cliente', tipo: sql.Int },
  { nombre: 'ID_BillToCustomer', tipo: sql.Int },
  { nombre: 'ID_MetodoEntrega', tipo: sql.Int },
  { nombre: 'ID_PersonaContacto', tipo: sql.Int },
  { nombre: 'ID_PersonaCuenta', tipo: sql.Int },
  { nombre: 'ID_Vendedor', tipo: sql.Int },
  { nombre: 'ID_Empacador', tipo: sql.Int },
  { nombre: 'ID_Producto', tipo: sql.Int },
  { nombre: 'Cantidad', tipo: sql.Int },
  { nombre: 'DeliveryInstructions', tipo: sql.NVarChar(sql.MAX) }
];

// Las instrucciones de entrega son opcionales
const camposObligatoriosCrear = [
  'ID_Cliente', 'ID_BillToCustomer', 'ID_MetodoEntrega', 'ID_PersonaContacto',
  'ID_PersonaCuenta', 'ID_Vendedor', 'ID_Empacador', 'ID_Producto', 'Cantidad'
];

const camposEditar = [
  { nombre: 'ID_Cliente', tipo: sql.Int },
  { nombre: 'ID_BillToCustomer', tipo: sql.Int },
  { nombre: 'ID_MetodoEntrega', tipo: sql.Int },
  { nombre: 'ID_PersonaContacto', tipo: sql.Int },
  { nombre: 'ID_PersonaCuenta', tipo: sql.Int },
  { nombre: 'ID_Vendedor', tipo: sql.Int },
  { nombre: 'ID_Empacador', tipo: sql.Int },
  { nombre: 'DeliveryInstructions', tipo: sql.NVarChar(sql.MAX) }
];

// Fechas en formato 2016-05-31
function fechaValida(texto) {
  return texto === undefined || /^\d{4}-\d{2}-\d{2}$/.test(texto);
}

function aFecha(texto) {
  return texto ? new Date(texto) : undefined;
}

// GET /api/facturas?pagina=1&cantidad=20
router.get('/', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    const filas = await ejecutarSP('GetFacturas', [
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/facturas/buscar?cliente=toys&fechaInicio=2016-01-01&fechaFin=2016-03-31&montoMinimo=100&montoMaximo=5000
router.get('/buscar', async (req, res) => {
  try {
    const { pagina, cantidad } = leerPaginacion(req.query);

    if (!fechaValida(req.query.fechaInicio) || !fechaValida(req.query.fechaFin)) {
      return res.status(400).json({ ok: false, error: 'Las fechas deben tener el formato AAAA-MM-DD' });
    }

    const filas = await ejecutarSP('BuscarFacturas', [
      { nombre: 'Nombre_Cliente', tipo: sql.NVarChar(100), valor: req.query.cliente },
      { nombre: 'FechaInicio', tipo: sql.Date, valor: aFecha(req.query.fechaInicio) },
      { nombre: 'FechaFin', tipo: sql.Date, valor: aFecha(req.query.fechaFin) },
      { nombre: 'MontoMinimo', tipo: sql.Decimal(18, 2), valor: aDecimal(req.query.montoMinimo) },
      { nombre: 'MontoMaximo', tipo: sql.Decimal(18, 2), valor: aDecimal(req.query.montoMaximo) },
      { nombre: 'NumeroPagina', tipo: sql.Int, valor: pagina },
      { nombre: 'CantidadRegistros', tipo: sql.Int, valor: cantidad }
    ]);

    res.json({ ok: true, pagina, cantidad, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/facturas/70512  (encabezado)
router.get('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El número de factura no es válido' });
    }

    const filas = await ejecutarSP('ObtenerEncabezadoFactura', [
      { nombre: 'Numero_Factura', tipo: sql.Int, valor: id }
    ]);

    if (filas.length === 0) {
      return res.status(404).json({ ok: false, error: 'Factura no encontrada' });
    }

    res.json({ ok: true, datos: filas[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/facturas/70512/detalle  (líneas de la factura)
router.get('/:id/detalle', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El número de factura no es válido' });
    }

    const filas = await ejecutarSP('ObtenerDetalleFactura', [
      { nombre: 'Numero_Factura', tipo: sql.Int, valor: id }
    ]);

    res.json({ ok: true, datos: filas });
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/facturas
router.post('/', async (req, res) => {
  try {
    const faltantes = camposObligatoriosCrear.filter(
      (campo) => req.body[campo] === undefined || req.body[campo] === null
    );

    if (faltantes.length > 0) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios', faltantes });
    }

    const filas = await ejecutarSP('CrearFactura', armarParametros(camposCrear, req.body));

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.status(201).json({ ok: true, mensaje: 'Factura creada', datos: filas[0] || null });
  } catch (error) {
    errorServidor(res, error);
  }
});

// PUT /api/facturas/70512  (solo se manda lo que se quiere cambiar)
router.put('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El número de factura no es válido' });
    }

    const parametros = armarParametros(camposEditar, req.body);
    parametros.push({ nombre: 'ID_Factura', tipo: sql.Int, valor: id });

    const filas = await ejecutarSP('EditarDatosFactura', parametros);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Factura actualizada' });
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/facturas/70512
router.delete('/:id', async (req, res) => {
  try {
    const id = aEntero(req.params.id);

    if (id === undefined) {
      return res.status(400).json({ ok: false, error: 'El número de factura no es válido' });
    }

    const filas = await ejecutarSP('EliminarFactura', [
      { nombre: 'ID_Factura', tipo: sql.Int, valor: id }
    ]);

    if (hayError(filas)) {
      return responderError(res, filas[0]);
    }

    res.json({ ok: true, mensaje: 'Factura eliminada' });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;