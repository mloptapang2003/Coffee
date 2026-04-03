const express = require('express');
const bcrypt  = require('bcryptjs');

module.exports = function authRoutes(db) {
    const router = express.Router();

    router.post('/login', (req, res) => {
        try {
            const { username, password } = req.body;

            const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            if (!bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }

            let permissions = JSON.parse(user.permissions);
            if (user.role === 'admin') {
                permissions = ['pos', 'items', 'orders', 'reports', 'users'];
            }

            const { password: _pwd, permissions: _perm, ...userWithoutPassword } = user;
            res.json({ success: true, user: { ...userWithoutPassword, permissions } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    return router;
};
