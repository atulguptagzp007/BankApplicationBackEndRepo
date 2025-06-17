const Customer = require('../models/customer.model');
const XLSX = require('xlsx');
const fs = require('fs');

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

    static async getCustomerComments(req, res) {
        try {
            const comments = await Customer.getComments(req.params.accountNo);
            res.json(comments);
        } catch (error) {
            console.error('Error getting comments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async addCustomerComment(req, res) {
        try {
            const { comment } = req.body;
            const commentId = await Customer.addComment(req.params.accountNo, comment);
            res.status(201).json({ 
                message: 'Comment added successfully',
                commentId 
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updateCustomerComment(req, res) {
        try {
            const { comment } = req.body;
            const success = await Customer.updateComment(req.params.commentId, comment);
            
            if (!success) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            
            res.json({ message: 'Comment updated successfully' });
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async deleteCustomerComment(req, res) {
        try {
            const success = await Customer.deleteComment(req.params.commentId);
            
            if (!success) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            
            res.json({ message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Delete a customer
    static async deleteCustomer(req, res) {
        try {
            const { accountNo } = req.params;
            
            // Delete customer and all associated comments in one transaction
            const result = await Customer.delete(accountNo);
            
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Customer not found',
                    message: 'No customer found with the provided account number'
                });
            }

            res.status(200).json({
                message: 'Customer and associated comments deleted successfully',
                accountNo: accountNo
            });
        } catch (error) {
            console.error('Error in deleteCustomer:', error);
            res.status(500).json({
                error: error.message,
                message: 'Error deleting customer'
            });
        }
    }

    static async deleteAllComments(req, res) {
        try {
            const { accountNo } = req.params;
            
            // First check if customer exists
            const customer = await Customer.findByAccountNo(accountNo);
            if (!customer) {
                return res.status(404).json({
                    error: 'Customer not found',
                    message: 'No customer found with the provided account number'
                });
            }

            // Try to delete comments
            const result = await Customer.deleteAllComments(accountNo);
            
            // If no comments were found, return success anyway
            if (result.affectedRows === 0) {
                return res.status(200).json({
                    message: 'No comments found for this customer',
                    deletedCount: 0
                });
            }

            res.status(200).json({
                message: 'All comments deleted successfully',
                deletedCount: result.affectedRows
            });
        } catch (error) {
            console.error('Error deleting comments:', error);
            res.status(500).json({
                error: error.message,
                message: 'Error deleting comments'
            });
        }
    }

    static async importCustomers(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    message: 'Please upload an Excel file'
                });
            }

            console.log('Processing file:', req.file.path); // Debug log

            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            console.log('Excel data:', data); // Debug log

            let importedCount = 0;
            let errors = [];

            for (const row of data) {
                try {
                    // Validate required fields
                    if (!row.account_no || !row.name || !row.address || !row.sanction_amt || !row.sanction_date) {
                        errors.push(`Row ${importedCount + 1}: Missing required fields`);
                        continue;
                    }

                    // Check if customer already exists
                    const existingCustomer = await Customer.findByAccountNo(row.account_no);
                    if (existingCustomer) {
                        errors.push(`Row ${importedCount + 1}: Customer with account number ${row.account_no} already exists`);
                        continue;
                    }

                    // Convert Excel date to YYYY-MM-DD format
                    let sanctionDate = row.sanction_date;
                    let npaDate = row.npa_date;

                    // Handle Excel date numbers (days since 1900-01-01)
                    if (typeof sanctionDate === 'number') {
                        const date = new Date((sanctionDate - 25569) * 86400 * 1000);
                        sanctionDate = date.toISOString().split('T')[0];
                    } else if (typeof sanctionDate === 'string') {
                        // Handle DD/MM/YYYY or DD-MM-YYYY format
                        const parts = sanctionDate.split(/[-/]/);
                        if (parts.length === 3) {
                            sanctionDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    }

                    // Handle NPA date if present
                    if (npaDate) {
                        if (typeof npaDate === 'number') {
                            const date = new Date((npaDate - 25569) * 86400 * 1000);
                            npaDate = date.toISOString().split('T')[0];
                        } else if (typeof npaDate === 'string') {
                            const parts = npaDate.split(/[-/]/);
                            if (parts.length === 3) {
                                npaDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        }
                    }

                    console.log('Processing row:', { ...row, sanctionDate, npaDate }); // Debug log

                    // Create customer
                    await Customer.create({
                        account_no: row.account_no,
                        name: row.name,
                        address: row.address,
                        sanction_amt: parseFloat(row.sanction_amt),
                        sanction_date: sanctionDate,
                        npa_date: npaDate || null,
                        comment: row.comment || null
                    });

                    importedCount++;
                } catch (error) {
                    console.error('Error processing row:', error); // Debug log
                    errors.push(`Row ${importedCount + 1}: ${error.message}`);
                }
            }

            // Clean up uploaded file
            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Error deleting file:', error);
            }

            res.status(200).json({
                message: 'Import completed',
                importedCount,
                errorCount: errors.length,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            console.error('Error importing customers:', error);
            res.status(500).json({ 
                error: error.message,
                message: 'Error importing customers',
                details: error.stack
            });
        }
    }
}

module.exports = CustomerController; 