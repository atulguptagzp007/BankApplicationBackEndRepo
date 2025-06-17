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
                    npa_date DATE
                )
            `);

            await db.query(`
                CREATE TABLE IF NOT EXISTS customer_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    account_no VARCHAR(20) NOT NULL,
                    comment TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (account_no) REFERENCES customer_details(account_no) ON DELETE CASCADE
                )
            `);

            // Set timezone to IST
            await db.query('SET time_zone = "+05:30"');
            console.log('Database and tables initialized successfully');
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
                (account_no, name, address, sanction_amt, sanction_date, npa_date) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    customerData.account_no,
                    customerData.name,
                    customerData.address,
                    customerData.sanction_amt,
                    customerData.sanction_date,
                    customerData.npa_date || null
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

    static async getComments(accountNo) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM customer_comments WHERE account_no = ? ORDER BY created_at DESC',
                [accountNo]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async addComment(accountNo, comment) {
        try {
            const [result] = await db.query(
                'INSERT INTO customer_comments (account_no, comment) VALUES (?, ?)',
                [accountNo, comment]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async updateComment(commentId, comment) {
        try {
            const [result] = await db.query(
                'UPDATE customer_comments SET comment = ? WHERE id = ?',
                [comment, commentId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async deleteComment(commentId) {
        try {
            const [result] = await db.query(
                'DELETE FROM customer_comments WHERE id = ?',
                [commentId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(accountNo) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // First verify the customer exists
            const [customer] = await connection.query(
                'SELECT account_no FROM customer_details WHERE account_no = ?',
                [accountNo]
            );
            
            if (!customer || customer.length === 0) {
                await connection.rollback();
                throw new Error('Customer not found');
            }

            // Delete all comments for this customer
            await connection.query(
                'DELETE FROM customer_comments WHERE account_no = ?',
                [accountNo]
            );

            // Delete the customer
            const [result] = await connection.query(
                'DELETE FROM customer_details WHERE account_no = ?',
                [accountNo]
            );
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                throw new Error('Failed to delete customer');
            }

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            console.error('Error in delete:', error);
            throw new Error('Failed to delete customer: ' + error.message);
        } finally {
            connection.release();
        }
    }

    static async deleteAllComments(accountNo) {
        try {
            // First verify the customer exists
            const customerQuery = 'SELECT account_no FROM customer_details WHERE account_no = ?';
            const [customer] = await db.query(customerQuery, [accountNo]);
            
            if (!customer || customer.length === 0) {
                throw new Error('Customer not found');
            }

            // Delete all comments for the customer
            const deleteQuery = 'DELETE FROM customer_comments WHERE account_no = ?';
            const [result] = await db.query(deleteQuery, [accountNo]);
            
            return result;
        } catch (error) {
            console.error('Error in deleteAllComments:', error);
            throw new Error('Failed to delete comments: ' + error.message);
        }
    }
}

module.exports = Customer; 