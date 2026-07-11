const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres_cyber_dock_user',
  host: process.env.PGHOST || 'dpg-d29mquer433s739ir01g-a.oregon-postgres.render.com',
  database: process.env.PGDATABASE || 'postgres_cyber_dock',
  password: process.env.PGPASSWORD || 'KVT8w15r7n2EDQQ7w4TNxI8HvR09JZ0u',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: { rejectUnauthorized: false }, // Necessário para conexão externa segura

  // Pool dimensionado e com timeouts, para que jobs paralelos não esgotem as
  // conexões nem deixem queries travadas segurando conexão indefinidamente.
  max: process.env.PGPOOL_MAX ? parseInt(process.env.PGPOOL_MAX, 10) : 15,
  connectionTimeoutMillis: 10000,          // espera no máx. 10s por uma conexão
  idleTimeoutMillis: 30000,                // libera conexões ociosas após 30s
  statement_timeout: 30000,                // aborta query travada após 30s
  query_timeout: 30000,
  application_name: 'cyberdock-backend',
});

pool.on('error', (err) => {
  console.error('Erro inesperado em cliente ocioso do pool PostgreSQL:', err.message);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar com o PostgreSQL:', err);
  } else {
    console.log('Conexão com o PostgreSQL bem-sucedida:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getClient: () => pool.connect(),
};
