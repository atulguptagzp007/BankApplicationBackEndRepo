const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// Comment routes
router.get('/:accountNo/comments', CustomerController.getCustomerComments);
router.post('/:accountNo/comments', CustomerController.addCustomerComment);
router.patch('/comments/:commentId', CustomerController.updateCustomerComment);
router.delete('/comments/:commentId', CustomerController.deleteCustomerComment);

// Delete all comments for a customer
router.delete('/:accountNo/comments', CustomerController.deleteAllComments);

// Import customers from Excel
router.post('/import', upload.single('file'), CustomerController.importCustomers);

module.exports = router; 