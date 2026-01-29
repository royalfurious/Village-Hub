const Pool = require("pg").Pool;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "example",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || "hostel",
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

console.log('DB config:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'hostel',
  ssl: process.env.DB_SSL === 'true'
});

pool.on("error", (error, client) => {
  console.log(error);
});

module.exports = {
  pool
};
