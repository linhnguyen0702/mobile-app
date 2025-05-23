const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Debug middleware
router.use((req, res, next) => {
  console.log('Search route accessed:', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Search route is working' });
});

// GET /api/search
router.get('/', searchController.search);

module.exports = router; 