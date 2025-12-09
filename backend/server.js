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

// Initialize database synchronously for serverless
let dbInitialized = false;
initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('Database initialized');
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
  });

// API Routes
app.use('/api/auth', require('./api/auth'));

// Note routes - will work once DB is initialized
app.use('/api/notes', require('./api/notes'));
app.use('/api/ai', require('./api/ai'));

// Catch all handler for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Only start server if not in Vercel (serverless) environment
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
  });
}

module.exports = app;

