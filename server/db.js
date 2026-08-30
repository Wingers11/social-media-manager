const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optionally add ssl: { rejectUnauthorized: false } if using managed PG
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
