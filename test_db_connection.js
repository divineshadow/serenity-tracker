const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'sql8.freesqldatabase.com',
  user: 'sql8634968',
  password: 'mmy9i5aWBI',
  database: 'sql8634968',
  charset: 'utf8'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database!');
  // You can perform your database operations here.
  // For example, you can execute queries using the connection object.
});

// Don't close the connection immediately, as you'll lose the connection
// before you get a chance to execute any queries. Keep the connection open
// until you've performed the necessary database operations.
// connection.end();
