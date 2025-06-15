const db = require('../config/db.config');

class Customer {
    static async initializeTable() {
        try {
            await db.query('CREATE DATABASE IF NOT EXISTS railway');
            await db.query('USE railway');

            await db.query(`
                CREATE TABLE IF NOT EXISTS customer_details (
                    account_no VARCHAR(20) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    address TEXT NOT NULL,
                    sanction_amt DECIMAL(15,2) NOT NULL,
                    sanction_date DATE NOT NULL,
                    npa_date DATE,
                    comment TEXT
                )
            `);
            console.log('Database and table initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await db.query('SELECT * FROM customer_details ORDER BY name');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async create(customerData) {
        try {
            const [result] = await db.query(
                `INSERT INTO customer_details 
                (account_no, name, address, sanction_amt, sanction_date, npa_date, comment) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    customerData.account_no,
                    customerData.name,
                    customerData.address,
                    customerData.sanction_amt,
                    customerData.sanction_date,
                    customerData.npa_date || null,
                    customerData.comment || null
                ]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findByAccountNo(accountNo) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM customer_details WHERE account_no = ?',
                [accountNo]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateComment(accountNo, comment) {
        try {
            const [result] = await db.query(
                'UPDATE customer_details SET comment = ? WHERE account_no = ?',
                [comment, accountNo]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(accountNo) {
        try {
            console.log('Attempting to delete customer:', accountNo);
            
            // First check if customer exists
            const checkResult = await db.query(
                'SELECT * FROM customer_details WHERE account_no = ?',
                [accountNo]
            );
    
            if (checkResult[0].length === 0) {
                console.log('Customer not found');
                return null;
            }
    
            // Store customer data before deletion
            const customerToDelete = checkResult[0][0];
    
            // Execute deletion
            const deleteResult = await db.query(
                'DELETE FROM customer_details WHERE account_no = ?',
                [accountNo]
            );
    
            console.log('Delete affected rows:', deleteResult[0].affectedRows);
            
            if (deleteResult[0].affectedRows === 0) {
                console.warn('No rows were deleted');
                return null;
            }
    
            return customerToDelete;
        } catch (error) {
            console.error('Error in Customer.delete:', error);
            throw error;
        }
    }
}

module.exports = Customer; 