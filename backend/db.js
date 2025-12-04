// backend/db.js - SQLite Database Setup
const Database = require('better-sqlite3');
const path = require('path');

// Create/connect to SQLite database
const dbPath = path.join(__dirname, 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
const initializeDatabase = () => {
    // Stores table
    db.exec(`
        CREATE TABLE IF NOT EXISTS stores (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    // Staff table
    db.exec(`
        CREATE TABLE IF NOT EXISTS staff (
            staffId TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            storeId TEXT NOT NULL,
            createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(storeId) REFERENCES stores(code)
        )
    `);

    // Access codes table
    db.exec(`
        CREATE TABLE IF NOT EXISTS accessCodes (
            code TEXT PRIMARY KEY,
            staffId TEXT NOT NULL,
            createdAt INTEGER NOT NULL,
            FOREIGN KEY(staffId) REFERENCES staff(staffId) ON DELETE CASCADE
        )
    `);

    // Items table
    db.exec(`
        CREATE TABLE IF NOT EXISTS items (
            itemId TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            expirationDate TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            imageUrl TEXT,
            addedByStaffId TEXT NOT NULL,
            storeCode TEXT NOT NULL,
            createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(addedByStaffId) REFERENCES staff(staffId),
            FOREIGN KEY(storeCode) REFERENCES stores(code)
        )
    `);

    console.log('Database schema initialized');
};

// STORE OPERATIONS
const storeOperations = {
    getAllStores: () => {
        return db.prepare('SELECT * FROM stores ORDER BY name').all();
    },
    
    addStore: (code, name) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO stores (code, name) VALUES (?, ?)');
        stmt.run(code, name);
    },
    
    getStore: (code) => {
        return db.prepare('SELECT * FROM stores WHERE code = ?').get(code);
    }
};

// STAFF OPERATIONS
const staffOperations = {
    getAllStaff: () => {
        return db.prepare('SELECT * FROM staff ORDER BY name').all();
    },
    
    getStaffById: (staffId) => {
        return db.prepare('SELECT * FROM staff WHERE staffId = ?').get(staffId);
    },
    
    addStaff: (staffId, name, storeId) => {
        const stmt = db.prepare('INSERT INTO staff (staffId, name, storeId) VALUES (?, ?, ?)');
        stmt.run(staffId, name, storeId);
        return staffOperations.getStaffById(staffId);
    },
    
    deleteStaff: (staffId) => {
        const stmt = db.prepare('DELETE FROM staff WHERE staffId = ?');
        stmt.run(staffId);
    }
};

// ACCESS CODES OPERATIONS
const accessCodeOperations = {
    getAllAccessCodes: () => {
        return db.prepare(`
            SELECT ac.*, s.storeId as storeCode
            FROM accessCodes ac
            JOIN staff s ON ac.staffId = s.staffId
            ORDER BY ac.createdAt DESC
        `).all();
    },
    
    getAccessCodeByCode: (code) => {
        return db.prepare('SELECT * FROM accessCodes WHERE code = ?').get(code.toUpperCase());
    },
    
    addAccessCode: (code, staffId) => {
        const stmt = db.prepare('INSERT INTO accessCodes (code, staffId, createdAt) VALUES (?, ?, ?)');
        stmt.run(code, staffId, Date.now());
        return accessCodeOperations.getAccessCodeByCode(code);
    },
    
    deleteAccessCodesByStaffId: (staffId) => {
        const stmt = db.prepare('DELETE FROM accessCodes WHERE staffId = ?');
        stmt.run(staffId);
    }
};

// ITEMS OPERATIONS
const itemOperations = {
    getAllItems: () => {
        return db.prepare('SELECT * FROM items ORDER BY expirationDate ASC').all();
    },
    
    getItemsByStore: (storeCode) => {
        return db.prepare('SELECT * FROM items WHERE storeCode = ? ORDER BY expirationDate ASC').all(storeCode);
    },
    
    getItemsByStaff: (staffId) => {
        return db.prepare('SELECT * FROM items WHERE addedByStaffId = ? ORDER BY expirationDate ASC').all(staffId);
    },
    
    getItemById: (itemId) => {
        return db.prepare('SELECT * FROM items WHERE itemId = ?').get(itemId);
    },
    
    addItem: (itemId, name, category, expirationDate, quantity, imageUrl, addedByStaffId, storeCode) => {
        const stmt = db.prepare(`
            INSERT INTO items (itemId, name, category, expirationDate, quantity, imageUrl, addedByStaffId, storeCode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(itemId, name, category, expirationDate, quantity, imageUrl, addedByStaffId, storeCode);
        return itemOperations.getItemById(itemId);
    },
    
    updateItem: (itemId, name, category, expirationDate, quantity, imageUrl) => {
        const stmt = db.prepare(`
            UPDATE items
            SET name = ?, category = ?, expirationDate = ?, quantity = ?, imageUrl = ?
            WHERE itemId = ?
        `);
        stmt.run(name, category, expirationDate, quantity, imageUrl, itemId);
        return itemOperations.getItemById(itemId);
    },
    
    deleteItem: (itemId) => {
        const stmt = db.prepare('DELETE FROM items WHERE itemId = ?');
        const result = stmt.run(itemId);
        return result.changes > 0;
    },
    
    deleteItemsByStaff: (staffId) => {
        const stmt = db.prepare('DELETE FROM items WHERE addedByStaffId = ?');
        stmt.run(staffId);
    }
};

module.exports = {
    db,
    initializeDatabase,
    storeOperations,
    staffOperations,
    accessCodeOperations,
    itemOperations
};
