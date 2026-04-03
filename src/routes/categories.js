const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = function categoriesRoutes(db) {
    const router = express.Router();

    router.get('/', (req, res) => {
        try {
            const categories = db.prepare('SELECT * FROM categories').all();
            res.json({ success: true, categories });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    router.post('/', (req, res) => {
        try {
            const { name, name_km, icon } = req.body;
            const id = uuidv4();
            db.prepare('INSERT INTO categories (id, name, name_km, icon) VALUES (?, ?, ?, ?)')
                .run(id, name, name_km, icon || 'fa-box');
            res.json({ success: true, message: 'Category created successfully', category: { id, name, name_km, icon } });
        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    return router;
};
