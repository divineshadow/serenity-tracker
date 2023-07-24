const express = require('express');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: false }));

// Route for handling the login form submission
app.post('/login', (req, res) => {
  console.log(req.body); // Output the form data to the console
  const { torn_id, torn_api, aw_api } = req.body;

  // Connect to the MariaDB database
  const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8' // Set the appropriate charset
  });

  // Handle database connection errors
  connection.connect((err) => {
      if (err) {
          console.error('Error connecting to the database:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      console.log('Connected to the database!');

      // Insert user information into the database
      connection.query(
          'INSERT INTO users (tornCityUserId, tornCityApiKey, arsonWarehouseApiKey) VALUES (?, ?, ?)',
          [torn_id, torn_api, aw_api],
          (error, results) => {
              if (error) {
                  console.error('Error inserting user information:', error);
                  res.status(500).send('Internal Server Error');
              } else {
                  console.log('User information inserted successfully');
                  res.status(200).send('Login successful');
              }
          }
      );

      // Close the database connection after the query
      connection.end();
  });
});




app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
