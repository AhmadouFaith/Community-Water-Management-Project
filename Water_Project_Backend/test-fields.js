const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'water_project_db'
});

connection.query('SELECT * FROM v_subscription_status LIMIT 1', (err, results, fields) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(fields.map(f => f.name));
  }
  connection.end();
});
