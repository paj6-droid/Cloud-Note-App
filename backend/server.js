require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Database initialization state
let dbInitialized = false;
let dbInitializationPromise = null;
let dbInitializationError = null;

// Initialize database
function initializeDatabase() {
  if (!dbInitializationPromise) {
    dbInitializationPromise = initDatabase()
      .then(() => {
        dbInitialized = true;
        dbInitializationError = null;
        console.log('Database initialized successfully');
      })
      .catch((error) => {
        dbInitialized = false;
        dbInitializationError = error;
        console.error('Failed to initialize database:', error);
        // In local development, exit on database failure
        if (process.env.VERCEL !== '1') {
          console.error('Exiting due to database initialization failure');
          process.exit(1);
        }
      });
  }
  return dbInitializationPromise;
}

// Middleware to ensure database is ready before processing API requests
function ensureDatabaseReady(req, res, next) {
  // If already initialized, proceed
  if (dbInitialized) {
    return next();
  }
  
  // If initialization failed, return error
  if (dbInitializationError) {
    return res.status(503).json({
      success: false,
      message: 'Database is not available. Please try again later.'
    });
  }
  
  // If initialization is in progress, wait for it
  if (dbInitializationPromise) {
    dbInitializationPromise
      .then(() => next())
      .catch(() => {
        res.status(503).json({
          success: false,
          message: 'Database initialization failed. Please try again later.'
        });
      });
  } else {
    // Start initialization and wait
    initializeDatabase()
      .then(() => next())
      .catch(() => {
        res.status(503).json({
          success: false,
          message: 'Database initialization failed. Please try again later.'
        });
      });
  }
}

// Start database initialization immediately
initializeDatabase();

// API Routes - protected by database readiness middleware
app.use('/api/auth', ensureDatabaseReady, require('./api/auth'));
app.use('/api/notes', ensureDatabaseReady, require('./api/notes'));
app.use('/api/ai', ensureDatabaseReady, require('./api/ai'));

// Catch all handler for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Only start server if not in Vercel (serverless) environment
if (process.env.VERCEL !== '1') {
  // Wait for database initialization before starting server
  initializeDatabase()
    .then(() => {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server due to database initialization failure:', error);
      process.exit(1);
    });
}

module.exports = app;

