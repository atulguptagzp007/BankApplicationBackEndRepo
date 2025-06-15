const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');

// Get all customers
router.get('/', CustomerController.getAllCustomers);

// Create new customer
router.post('/', CustomerController.createCustomer);

// Get customer details by account number
router.get('/:accountNo', CustomerController.getCustomerByAccountNo);

// Update customer comment
router.patch('/:accountNo/comment', CustomerController.updateCustomerComment);

// Delete customer
router.delete('/:accountNo', CustomerController.deleteCustomer);

module.exports = router; 