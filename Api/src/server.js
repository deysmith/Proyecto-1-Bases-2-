const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rutasGenerales = require('./routes/generales');
const rutasClientes = require('./routes/clientes');
const rutasProveedores = require('./routes/proveedores');
const rutasProductos = require('./routes/productos');
const rutasFacturas = require('./routes/facturas');
const rutasReportes = require('./routes/reportes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Wide World Importers funcionando' });
});

app.use('/api/generales', rutasGenerales);
app.use('/api/clientes', rutasClientes);
app.use('/api/proveedores', rutasProveedores);
app.use('/api/productos', rutasProductos);
app.use('/api/facturas', rutasFacturas);
app.use('/api/reportes', rutasReportes);

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`API corriendo en http://localhost:${puerto}`);
});