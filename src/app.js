const express = require('express');
const cors = require('cors');
const Customer = require('./models/customer.model');
const customerRoutes = require('./routes/customer.routes');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
Customer.initializeTable()
    .then(() => console.log('Database initialized'))
    .catch(err => console.error('Database initialization failed:', err));

// Routes
app.use('/api/customer', customerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app; 