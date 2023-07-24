const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');
const axios = require('axios');

require('dotenv').config();

// Connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Set the views directory for EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve the static files
app.use(express.static(path.join(__dirname, 'public')));

// Function to fetch player information from Torn API and update variables
function getPlayerInformation(tornCityUserId, tornCityApiKey, arsonWarehouseApiKey, res) {
  const profileUrl = `https://api.torn.com/user/${tornCityUserId}?selections=profile&key=${tornCityApiKey}`;
  const networthUrl = `https://api.torn.com/user/${tornCityUserId}?selections=networth&key=${tornCityApiKey}`;

  // Fetch player profile and networth data in parallel using Promise.all
  Promise.all([axios.get(profileUrl), axios.get(networthUrl)])
    .then(([profileResponse, networthResponse]) => {
      const profileData = profileResponse.data;
      const networthData = networthResponse.data.networth;

      // Set variables with the API responses
      const playerName = profileData.name;
      const playerAge = profileData.age;
      const liquidCash = networthData.bank + networthData.pending;
      const stockCash = networthData.stockmarket;
      const networth = networthData.total;

      // Redirect the user to the dashboard page with the updated variables
      res.render('dashboard', {
        playerName,
        playerId: tornCityUserId,
        fullApiKey: tornCityApiKey,
        awhKey: arsonWarehouseApiKey,
        playerInfo: 'Some Player Info',
        marketValues: 'Market Values',
        awhPricing: 'Arson Warehouse Pricing',
        currentLogs: 'Current Logs',
        historicLogs: 'Historic Logs',
        playerAge,
        liquidCash,
        stockCash,
        networth,
        todayTradesIn: '50',
        todayUniqueTradees: '30',
        todayBazaarCustomers: '25',
        todayUniqueBazaar: '20',
        todayTradeOut: '40',
      });
    })
    .catch((error) => {
      console.error('Error fetching player information:', error);
      return res.status(500).send('Error fetching player information');
    });
}

// Endpoint to handle the login form submission
app.post('/login', (req, res) => {
  const { tornCityUserId, tornCityApiKey, arsonWarehouseApiKey } = req.body;

  // Check if the user exists in the database
  const selectQuery = 'SELECT * FROM users WHERE torn_id = ?';
  db.query(selectQuery, [tornCityUserId], (err, results) => {
    if (err) {
      console.error('Error checking user information:', err);
      return res.status(500).send('Error checking user information');
    }

    if (results.length === 0) {
      // If the user doesn't exist, insert the new user into the database
      const insertQuery = 'INSERT INTO users (torn_id, torn_api, aw_api) VALUES (?, ?, ?)';
      db.query(insertQuery, [tornCityUserId, tornCityApiKey, arsonWarehouseApiKey], (err, result) => {
        if (err) {
          console.error('Error creating new user:', err);
          return res.status(500).send('Error creating new user');
        }
        console.log('New user created:', result.insertId);

        // Set cookies for user ID, Torn City API Key, and Arson Warehouse API Key
        res.cookie('tornCityUserId', tornCityUserId);
        res.cookie('tornCityApiKey', tornCityApiKey);
        res.cookie('arsonWarehouseApiKey', arsonWarehouseApiKey);

        // Fetch player information and update variables
        getPlayerInformation(tornCityUserId, tornCityApiKey, arsonWarehouseApiKey, res);
      });
    } else {
      // If the user exists, update the Torn City API Key and Arson Warehouse API Key
      const updateQuery = 'UPDATE users SET torn_api = ?, aw_api = ? WHERE torn_id = ?';
      db.query(updateQuery, [tornCityApiKey, arsonWarehouseApiKey, tornCityUserId], (err, result) => {
        if (err) {
          console.error('Error updating user information:', err);
          return res.status(500).send('Error updating user information');
        }
        console.log('User information updated:', result.affectedRows);

        // Set cookies for user ID, Torn City API Key, and Arson Warehouse API Key
        res.cookie('tornCityUserId', tornCityUserId);
        res.cookie('tornCityApiKey', tornCityApiKey);
        res.cookie('arsonWarehouseApiKey', arsonWarehouseApiKey);

        // Fetch player information and update variables
        getPlayerInformation(tornCityUserId, tornCityApiKey, arsonWarehouseApiKey, res);
      });
    }
  });
});

// Endpoint to render the dashboard page
app.get('/dashboard', (req, res) => {
  // Get user ID and API keys from cookies
  const tornCityUserId = req.cookies.tornCityUserId;
  const tornCityApiKey = req.cookies.tornCityApiKey;
  const arsonWarehouseApiKey = req.cookies.arsonWarehouseApiKey;

  // Fetch player information and update variables
  getPlayerInformation(tornCityUserId, tornCityApiKey, arsonWarehouseApiKey, res);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
