const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rutasGenerales = require('./routes/generales');
const rutasClientes = require('./routes/clientes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Wide World Importers funcionando' });
});

app.use('/api/generales', rutasGenerales);
app.use('/api/clientes', rutasClientes);

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`API corriendo en http://localhost:${puerto}`);
});