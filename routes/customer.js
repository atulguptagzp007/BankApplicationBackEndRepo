const express = require('express');
const router = express.Router();
const db = require('../db');

// ... existing code ...

// Delete a customer
router.delete('/:accountNo', async (req, res) => {
  const { accountNo } = req.params;
  console.log('Attempting to delete customer with account number:', accountNo);
  
  try {
    // First check if customer exists
    const checkResult = await db.query(
      'SELECT * FROM customers WHERE account_no = $1',
      [accountNo]
    );

    console.log('Customer check result:', checkResult.rows);

    if (checkResult.rows.length === 0) {
      console.log('Customer not found');
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete the customer
    const deleteResult = await db.query(
      'DELETE FROM customers WHERE account_no = $1 RETURNING *',
      [accountNo]
    );

    console.log('Delete result:', deleteResult.rows);

    if (deleteResult.rowCount === 0) {
      console.log('No customer was deleted');
      return res.status(404).json({ message: 'No customer was deleted' });
    }

    console.log('Customer deleted successfully');
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in delete customer route:', error);
    res.status(500).json({ 
      message: 'Error deleting customer',
      error: error.message 
    });
  }
});

module.exports = router; 