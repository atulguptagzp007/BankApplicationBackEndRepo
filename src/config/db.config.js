const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'tramway.proxy.rlwy.net',
    port: 19166,
    user: 'root',
    password: 'XbpexoWWeotkiYeYUqqCgYENeiewlpwF',
    database: 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool; 