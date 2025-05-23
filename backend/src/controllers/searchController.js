const Product = require('../models/Product');
const pool = require('../config/database');

function buildImageUrl(image) {
  if (!image) return `${process.env.BASE_URL || 'http://172.20.10.4:3000'}/uploads/default.jpg`;
  if (image.startsWith('http')) return image;
  // Remove any leading slashes
  const cleanImagePath = image.replace(/^\/+/, '');
  return `${process.env.BASE_URL || 'http://172.20.10.4:3000'}/uploads/${cleanImagePath}`;
}

exports.search = async (req, res) => {
  console.log('Search controller called with query:', req.query);
  
  try {
    const { q } = req.query;
    
    if (!q) {
      console.log('No search query provided');
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log('Executing product search query...');
    // Search in products using MySQL LIKE
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.description LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    console.log('Executing category search query...');
    // Search in categories using MySQL LIKE
    const [categories] = await pool.execute(`
      SELECT * FROM categories 
      WHERE name LIKE ?
      LIMIT 5
    `, [`%${q}%`]);

    console.log('Processing search results...');
    // Process image URLs
    products.forEach(p => {
      p.image = buildImageUrl(p.image);
      if (p.full_description && !p.fullDescription) {
        p.fullDescription = p.full_description;
      }
    });

    console.log('Search results:', {
      query: q,
      productsFound: products.length,
      categoriesFound: categories.length
    });

    res.json({
      products,
      categories
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 