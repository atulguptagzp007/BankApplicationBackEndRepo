const Customer = require('../models/customer.model');

class CustomerController {
    static async getAllCustomers(req, res) {
        try {
            const customers = await Customer.findAll();
            res.json(customers);
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async createCustomer(req, res) {
        try {
            const customerData = req.body;
            
            // Validate required fields
            const requiredFields = ['account_no', 'name', 'address', 'sanction_amt', 'sanction_date'];
            const missingFields = requiredFields.filter(field => !customerData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: 'Missing required fields', 
                    fields: missingFields 
                });
            }

            // Check if customer already exists
            const existingCustomer = await Customer.findByAccountNo(customerData.account_no);
            if (existingCustomer) {
                return res.status(409).json({ message: 'Customer with this account number already exists' });
            }

            await Customer.create(customerData);
            res.status(201).json({ message: 'Customer created successfully' });
        } catch (error) {
            console.error('Error creating customer:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getCustomerByAccountNo(req, res) {
        try {
            const customer = await Customer.findByAccountNo(req.params.accountNo);
            
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            
            res.json(customer);
        } catch (error) {
            console.error('Error fetching customer:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updateCustomerComment(req, res) {
        try {
            const { comment } = req.body;
            const success = await Customer.updateComment(req.params.accountNo, comment);
            
            if (!success) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            
            res.json({ message: 'Comment updated successfully' });
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Delete a customer
    static async deleteCustomer(req, res) {
        const { accountNo } = req.params;
        console.log('Delete request received for account:', accountNo);
        
        try {
            const result = await Customer.delete(accountNo);
            if (!result) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            res.json({ message: 'Customer deleted successfully' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(500).json({ 
                message: 'Error deleting customer',
                error: error.message 
            });
        }
    }
}

module.exports = CustomerController; 