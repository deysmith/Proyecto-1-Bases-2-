const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  requestTimeout: 60000,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Variable que almacena la conexión a la base de datos
let pool = null;

async function obtenerPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = { sql, obtenerPool };