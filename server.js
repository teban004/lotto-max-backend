// server.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000; // Use PORT environment variable if available

// Use environment variables for database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route to ensure server is running
app.get('/', (req, res) => {
    res.send('API is running');
});

// Endpoint to fetch winning numbers
app.get('/api/winning-numbers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lotto_max_results ORDER BY draw_date DESC LIMIT 10');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching data from database', err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

/**
 * @route GET /api/stats/
 * @desc Get stats for all numbers
 * @returns {object} - List of stats for all numbers
 */
app.get('/api/stats', async (req, res) => {
    try {
        // Parameterized query to prevent SQL injection
        const query = `
            WITH number_series AS (
                SELECT generate_series(1, 50) AS number
            ),
            lotto_counts AS (
                SELECT
                    number,
                    COUNT(*) AS count,
                    MAX(draw_date) AS last_draw_date
                FROM
                    number_series
                LEFT JOIN
                    lotto_max_results
                ON
                    number IN (number1, number2, number3, number4, number5, number6, number7, bonus_number) -- adjust to match your column names
                GROUP BY
                    number
            )
            SELECT
                number,
                COALESCE(count, 0) AS count,
                last_draw_date
            FROM
                lotto_counts
            ORDER BY
                number;
        `;
    
        // Execute the query
        const result = await pool.query(query);
    
        // Check if any data was returned
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }
    
        // Return the stats data
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching data from database', err);
        res.status(500).send('Server Error');
    }
});

/**
 * @route GET /api/stats/:number
 * @desc Get stats for a specific number
 * @param {number} number - The number to retrieve data for
 * @returns {object} - Stats related to the number
 */
app.get('/api/stats/:number', async (req, res) => {
    const { number } = req.params;
  
    // Input validation: Ensure 'number' is an integer
    if (isNaN(number) || !Number.isInteger(parseFloat(number))) {
        return res.status(400).json({ error: 'Invalid number provided' });
    }
  
    try {
        // Parameterized query to prevent SQL injection
        const query = `
            SELECT 
            COUNT(*) AS freq
            FROM lotto_max_results
            WHERE number1 = $1 OR number2 = $1 OR number3 = $1 OR number4 = $1 OR number5 = $1 OR number6 = $1 OR number7 = $1 OR bonus_number = $1
        `;
        const values = [parseInt(number)];
    
        // Execute the query
        const result = await pool.query(query, values);
    
        // Check if any data was returned
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No data found for the provided number' });
        }
    
        // Return the stats data
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching data from database', err);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
