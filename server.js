// Coffee POS System - Server entry point
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const db                         = require('./src/db');
const { initSocket, broadcast }  = require('./src/socket');

const app    = express();
const PORT   = process.env.PORT || 3000;
const server = http.createServer(app);

// Real-time sync
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth',       require('./src/routes/auth')(db));
app.use('/api/users',      require('./src/routes/users')(db, broadcast));
app.use('/api/categories', require('./src/routes/categories')(db));
app.use('/api/products',   require('./src/routes/products')(db, broadcast));
app.use('/api/orders',     require('./src/routes/orders')(db, broadcast));
app.use('/api/reports',    require('./src/routes/reports')(db));
app.use('/api/settings',   require('./src/routes/settings')(db));

// Start
server.listen(PORT, () => {
    console.log('');
    console.log('☕ Coffee POS running on http://localhost:' + PORT);
    console.log('📊 Database: coffee_pos.db');
    console.log('🔌 Real-time: Socket.io enabled');
    console.log('');
});
