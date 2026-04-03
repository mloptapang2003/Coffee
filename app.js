// Coffee POS System - Main Application

class CoffeePOS {
    constructor() {
        this.data = getData();
        this.cart = [];
        this.currentPage = 'pos';
        this.currentCategory = 'all';
        this.currentUser = null;
        this.editingItem = null;
        this.editingUser = null;
        this.viewingOrder = null;
        this.socket = null;
        this.onlineUsers = new Map();

        this.init();
    }

    init() {
        this.initSocket();
        this.checkAuth();
        this.bindEvents();
        if (this.currentUser) {
            this.showApp();
        }
    }

    initSocket() {
        // Initialize Socket.io connection
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('🔌 Connected to real-time server');
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from real-time server');
        });

        // Listen for real-time events
        this.socket.on('user-status', (data) => {
            this.handleUserStatus(data);
        });

        this.socket.on('user-created', (data) => {
            this.handleUserCreated(data);
        });

        this.socket.on('user-updated', (data) => {
            this.handleUserUpdated(data);
        });

        this.socket.on('user-deleted', (data) => {
            this.handleUserDeleted(data);
        });

        this.socket.on('order-created', (data) => {
            this.handleOrderCreated(data);
        });

        this.socket.on('order-deleted', (data) => {
            this.handleOrderDeleted(data);
        });

        this.socket.on('product-created', (data) => {
            this.handleProductCreated(data);
        });

        this.socket.on('product-updated', (data) => {
            this.handleProductUpdated(data);
        });

        this.socket.on('product-deleted', (data) => {
            this.handleProductDeleted(data);
        });
    }

    checkAuth() {
        this.currentUser = getCurrentUser();
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = this.currentUser.fullname;
            // Ensure admin has all permissions
            if (this.currentUser.role === 'admin') {
                this.currentUser.permissions = ['pos', 'items', 'orders', 'reports', 'users'];
            }
            // Display current user permissions
            this.displayUserPermissions();
        }
    }

    displayUserPermissions() {
        const permLabel = document.getElementById('userPermissions');
        if (!permLabel) return;

        const permissions = this.currentUser.permissions || [];
        const isAdmin = this.currentUser.role === 'admin';

        if (isAdmin) {
            permLabel.innerHTML = '<span style="color: var(--primary);">✓ Admin (Full Access)</span>';
            return;
        }

        const permIcons = {
            pos: '<i class="fas fa-cash-register" title="លក់"></i>',
            items: '<i class="fas fa-box" title="គ្រប់គ្រងមុខម្ហូប"></i>',
            orders: '<i class="fas fa-receipt" title="មើលការលក់"></i>',
            reports: '<i class="fas fa-chart-line" title="របាយការណ៍"></i>'
        };

        permLabel.innerHTML = permissions.map(p => permIcons[p] || '').join(' ');
    }

    bindEvents() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigate(page);
            });
        });

        // Category filter (POS)
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.renderProducts();
            });
        });

        // Search product
        document.getElementById('searchProduct').addEventListener('input', () => {
            this.renderProducts();
        });

        // Cart actions
        document.getElementById('clearCartBtn').addEventListener('click', () => {
            this.clearCart();
        });

        document.getElementById('discountPercent').addEventListener('input', () => {
            document.getElementById('saleAmount').value = '';
            this.updateCartTotals();
        });

        document.getElementById('saleAmount').addEventListener('input', () => {
            document.getElementById('discountPercent').value = '';
            this.updateCartTotals();
        });

        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.openCheckout();
        });

        document.getElementById('confirmPaymentBtn').addEventListener('click', () => {
            this.confirmPayment();
        });

        document.getElementById('amountReceived').addEventListener('input', () => {
            this.calculateChange();
        });

        // Payment methods
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // New order
        document.getElementById('newOrderBtn').addEventListener('click', () => {
            this.clearCart();
        });

        // Item management
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.openItemModal();
        });

        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Search and filter items
        document.getElementById('searchItem').addEventListener('input', () => {
            this.renderItems();
        });

        document.getElementById('filterCategory').addEventListener('change', () => {
            this.renderItems();
        });

        // User management
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });

        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Reports
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReports();
        });

        document.getElementById('reportPeriod').addEventListener('change', () => {
            const customRange = document.getElementById('customDateRange');
            if (document.getElementById('reportPeriod').value === 'custom') {
                customRange.classList.remove('hidden');
            } else {
                customRange.classList.add('hidden');
            }
            this.generateReports();
        });

        document.getElementById('customStartDate').addEventListener('change', () => {
            this.generateReports();
        });

        document.getElementById('customEndDate').addEventListener('change', () => {
            this.generateReports();
        });

        // Order date filter
        document.getElementById('orderDateFilter').addEventListener('change', () => {
            this.renderOrders();
        });

        // Export orders
        document.getElementById('exportOrdersBtn').addEventListener('click', () => {
            this.exportOrders();
        });

        // Print order
        document.getElementById('printOrderBtn').addEventListener('click', () => {
            this.printOrder();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAllModals();
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Image upload drop zone
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        if (uploadPlaceholder) {
            uploadPlaceholder.addEventListener('click', () => {
                document.getElementById('itemImageFile').click();
            });
        }
    }

    // Authentication
    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                setCurrentUser(result.user);
                document.getElementById('currentUser').textContent = result.user.fullname;
                this.showToast('ការចូលប្រើប្រាស់ជោគជ័យ!', 'success');
                this.showApp();
            } else {
                this.showToast(result.message || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('មិនអាចភ្ជាប់ទៅសែរវើរបានទេ! សូមពិនិត្យមើល server.js', 'error');
        }
    }

    logout() {
        // Emit user logout to socket
        if (this.socket && this.currentUser) {
            this.socket.emit('user-logout');
        }
        
        this.currentUser = null;
        setCurrentUser(null);
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showToast('បានចាកចេញ!', 'success');
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        this.navigate('pos');

        // Hide users nav for non-admin
        if (this.currentUser.role !== 'admin') {
            document.getElementById('usersNav').classList.add('hidden');
        }

        // Apply user permissions
        this.applyUserPermissions();

        // Emit user login to socket
        if (this.socket && this.currentUser) {
            this.socket.emit('user-login', this.currentUser);
        }
    }

    applyUserPermissions() {
        const permissions = this.currentUser.permissions || [];
        const isAdmin = this.currentUser.role === 'admin';

        // Refresh permission display
        this.displayUserPermissions();

        // Hide/show nav items based on permissions
        const itemsNav = document.querySelector('[data-page="items"]');
        const ordersNav = document.querySelector('[data-page="orders"]');
        const reportsNav = document.querySelector('[data-page="reports"]');
        const usersNav = document.getElementById('usersNav');

        if (itemsNav) {
            if (!permissions.includes('items') && !isAdmin) {
                itemsNav.classList.add('hidden');
            } else {
                itemsNav.classList.remove('hidden');
            }
        }

        if (ordersNav) {
            if (!permissions.includes('orders') && !isAdmin) {
                ordersNav.classList.add('hidden');
            } else {
                ordersNav.classList.remove('hidden');
            }
        }

        if (reportsNav) {
            if (!permissions.includes('reports') && !isAdmin) {
                reportsNav.classList.add('hidden');
            } else {
                reportsNav.classList.remove('hidden');
            }
        }

        if (usersNav) {
            if (!isAdmin) {
                usersNav.classList.add('hidden');
            } else {
                usersNav.classList.remove('hidden');
            }
        }

        // If user has no POS permission, redirect to first available page
        if (!permissions.includes('pos') && !isAdmin) {
            const availablePages = ['items', 'orders', 'reports'];
            const firstPage = permissions.find(p => availablePages.includes(p));
            if (firstPage && this.currentPage === 'pos') {
                this.navigate(firstPage);
            }
        }
    }

    // Navigation
    navigate(page) {
        // Check permissions for each page
        if (this.currentUser.role !== 'admin') {
            const permissions = this.currentUser.permissions || [];
            
            if (page === 'items' && !permissions.includes('items')) {
                this.showToast('អ្នកមិនមានសិទ្ធិចូលមើលផ្នែកនេះទេ!', 'error');
                return;
            }
            if (page === 'orders' && !permissions.includes('orders')) {
                this.showToast('អ្នកមិនមានសិទ្ធិចូលមើលផ្នែកនេះទេ!', 'error');
                return;
            }
            if (page === 'reports' && !permissions.includes('reports')) {
                this.showToast('អ្នកមិនមានសិទ្ធិចូលមើលផ្នែកនេះទេ!', 'error');
                return;
            }
            if (page === 'users') {
                this.showToast('មានតែ Admin ទេដែលអាចចូលផ្នែកនេះ!', 'error');
                return;
            }
        }

        this.currentPage = page;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('active');
        });
        document.getElementById(page + 'Page').classList.remove('hidden');
        document.getElementById(page + 'Page').classList.add('active');

        // Load page data
        switch(page) {
            case 'pos':
                this.renderProducts();
                break;
            case 'items':
                this.renderItems();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'reports':
                this.generateReports();
                break;
            case 'users':
                this.renderUsers();
                break;
        }
    }

    // Products (POS)
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        let products = this.data.products.filter(p => p.active);

        if (this.currentCategory !== 'all') {
            products = products.filter(p => p.category === this.currentCategory);
        }

        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-light);">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>គ្មានមុខម្ហូបត្រូវនឹងការស្វែងរក</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const hasSale = product.salePrice && product.salePrice > 0;
            
            return `
                <div class="product-card" data-id="${product.id}" onclick="pos.addToCart(${product.id})">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}">` 
                        : `<div class="product-icon"><i class="fas ${product.icon}"></i></div>`
                    }
                    <h3>${product.name}</h3>
                    ${hasSale 
                        ? `<div class="original-price">${formatCurrency(product.price)}</div>
                           <div class="sale-price">${formatCurrency(product.salePrice)}</div>`
                        : `<div class="price">${formatCurrency(product.price)}</div>`
                    }
                </div>
            `;
        }).join('');
    }

    // Cart
    addToCart(productId) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
                originalPrice: product.price,
                quantity: 1,
                image: product.image,
                icon: product.icon
            });
        }

        this.renderCart();
        this.showToast(`បានបន្ថែម ${product.name} ចូលរទេះ!`, 'success');
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>គ្មានមុខម្ហូបក្នុងរទេះ</p>
                </div>
            `;
            document.getElementById('checkoutBtn').disabled = true;
        } else {
            cartItems.innerHTML = this.cart.map((item, index) => `
                <div class="cart-item">
                    ${item.image 
                        ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">`
                        : `<div class="cart-item-icon"><i class="fas ${item.icon}"></i></div>`
                    }
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${formatCurrency(item.price)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="pos.decreaseQty(${index})">-</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="qty-btn" onclick="pos.increaseQty(${index})">+</button>
                        <button class="cart-item-remove" onclick="pos.removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            document.getElementById('checkoutBtn').disabled = false;
        }

        document.getElementById('cartCount').textContent = `(${this.cart.reduce((sum, item) => sum + item.quantity, 0)})`;
        this.updateCartTotals();
    }

    increaseQty(index) {
        this.cart[index].quantity++;
        this.renderCart();
    }

    decreaseQty(index) {
        if (this.cart[index].quantity > 1) {
            this.cart[index].quantity--;
        } else {
            this.removeFromCart(index);
        }
        this.renderCart();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.renderCart();
    }

    clearCart() {
        this.cart = [];
        document.getElementById('discountPercent').value = '';
        document.getElementById('saleAmount').value = '';
        this.renderCart();
        this.showToast('បានសម្អាតរទេះ!', 'success');
    }

    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const saleAmount = parseFloat(document.getElementById('saleAmount').value) || 0;
        
        let discountAmount = 0;
        if (discountPercent > 0) {
            discountAmount = subtotal * (discountPercent / 100);
        } else if (saleAmount > 0) {
            discountAmount = Math.min(saleAmount, subtotal);
        }
        
        const total = subtotal - discountAmount;

        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('discountAmount').textContent = '-' + formatCurrency(discountAmount);
        document.getElementById('total').textContent = formatCurrency(Math.max(0, total));
    }

    // Checkout
    openCheckout() {
        const modal = document.getElementById('checkoutModal');
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const saleAmount = parseFloat(document.getElementById('saleAmount').value) || 0;
        
        let discountAmount = 0;
        if (discountPercent > 0) {
            discountAmount = subtotal * (discountPercent / 100);
        } else if (saleAmount > 0) {
            discountAmount = Math.min(saleAmount, subtotal);
        }
        
        const total = subtotal - discountAmount;

        document.getElementById('receiptNumber').textContent = generateReceiptNumber();
        document.getElementById('receiptDate').textContent = formatDate(new Date().toISOString());
        document.getElementById('receiptServer').textContent = this.currentUser.fullname;

        document.getElementById('receiptItems').innerHTML = this.cart.map(item => `
            <div class="receipt-item">
                <span class="receipt-item-name">${item.name}</span>
                <span class="receipt-item-qty">x${item.quantity}</span>
                <span class="receipt-item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `).join('');

        document.getElementById('receiptSubtotal').textContent = formatCurrency(subtotal);
        document.getElementById('receiptDiscountPercent').textContent = discountPercent > 0 ? discountPercent + '%' : '0%';
        document.getElementById('receiptDiscountAmount').textContent = formatCurrency(discountAmount);
        document.getElementById('receiptTotal').textContent = formatCurrency(Math.max(0, total));

        document.getElementById('amountReceived').value = '';
        document.getElementById('changeAmount').textContent = '0៛';

        modal.classList.add('active');
    }

    calculateChange() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const saleAmount = parseFloat(document.getElementById('saleAmount').value) || 0;
        
        let discountAmount = 0;
        if (discountPercent > 0) {
            discountAmount = subtotal * (discountPercent / 100);
        } else if (saleAmount > 0) {
            discountAmount = Math.min(saleAmount, subtotal);
        }
        
        const total = subtotal - discountAmount;
        const received = parseFloat(document.getElementById('amountReceived').value) || 0;
        const change = received - total;

        document.getElementById('changeAmount').textContent = change >= 0 ? formatCurrency(change) : '0៛';
    }

    async confirmPayment() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const saleAmount = parseFloat(document.getElementById('saleAmount').value) || 0;

        let discountAmount = 0;
        if (discountPercent > 0) {
            discountAmount = subtotal * (discountPercent / 100);
        } else if (saleAmount > 0) {
            discountAmount = Math.min(saleAmount, subtotal);
        }

        const total = subtotal - discountAmount;
        const received = parseFloat(document.getElementById('amountReceived').value) || 0;

        if (received < total && total > 0) {
            this.showToast('ចំនួនទទួលមិនគ្រប់គ្រាន់!', 'error');
            return;
        }

        // Create order object
        const order = {
            receiptNumber: document.getElementById('receiptNumber').textContent,
            date: new Date().toISOString(),
            items: [...this.cart],  // Send as array, server will stringify
            subtotal: subtotal,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            total: Math.max(0, total),
            paymentMethod: document.querySelector('.payment-method.active').dataset.method,
            userId: this.currentUser.id,
            userName: this.currentUser.fullname
        };

        try {
            // Save order to database via REST API
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });

            const result = await response.json();
            console.log('Order save result:', result);

            if (result.success) {
                // Print receipt
                this.printReceipt();

                // Close modal
                this.closeAllModals();

                // Clear cart
                this.clearCart();

                // Refresh orders page
                if (this.currentPage === 'orders') {
                    await this.renderOrders();
                }

                this.showToast('ការទូទាត់ជោគជ័យ!', 'success');
            } else {
                this.showToast(result.message || 'កំហុសក្នុងការរក្សាទុកការលក់!', 'error');
            }
        } catch (error) {
            console.error('Order save error:', error);
            this.showToast('មានកំហុសកើតឡើង: ' + error.message, 'error');
        }
    }

    printReceipt() {
        const printWindow = window.open('', '', 'width=400,height=600');
        const receiptContent = document.querySelector('.receipt').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
                    .receipt-header { text-align: center; margin-bottom: 15px; }
                    .receipt-header h3 { color: #6F4E37; font-size: 20px; margin: 5px 0; }
                    .receipt-header p { font-size: 12px; color: #666; margin: 3px 0; }
                    .receipt-divider { border-top: 2px dashed #ddd; margin: 15px 0; }
                    .receipt-items { margin-bottom: 15px; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                    .receipt-totals { padding-top: 10px; }
                    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                    .receipt-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="receipt">${receiptContent}</div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    // Items Management
    renderItems() {
        const grid = document.getElementById('itemsGrid');
        const searchTerm = document.getElementById('searchItem').value.toLowerCase();
        const filterCategory = document.getElementById('filterCategory').value;
        
        let items = this.data.products;

        if (filterCategory !== 'all') {
            items = items.filter(i => i.category === filterCategory);
        }

        if (searchTerm) {
            items = items.filter(i => i.name.toLowerCase().includes(searchTerm));
        }

        if (items.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-light);">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>គ្មានមុខម្ហូប</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => {
            const hasSale = item.salePrice && item.salePrice > 0;
            
            return `
                <div class="item-card">
                    ${item.image 
                        ? `<img src="${item.image}" alt="${item.name}" class="item-card-image">`
                        : `<div class="item-card-icon"><i class="fas ${item.icon}"></i></div>`
                    }
                    <div class="item-card-body">
                        <span class="category-tag">${categoryNames[item.category]}</span>
                        <h3>${item.name}</h3>
                        <div class="price-row">
                            ${hasSale 
                                ? `
                                    <span class="sale-price">${formatCurrency(item.salePrice)}</span>
                                    <span class="original-price">${formatCurrency(item.price)}</span>
                                `
                                : `<span class="price">${formatCurrency(item.price)}</span>`
                            }
                        </div>
                        <div class="item-card-actions">
                            <button class="btn-edit-item" onclick="pos.openItemModal(${item.id})">
                                <i class="fas fa-edit"></i> កែសម្រួល
                            </button>
                            <button class="btn-delete-item" onclick="pos.deleteItem(${item.id})">
                                <i class="fas fa-trash"></i> លុប
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openItemModal(itemId = null) {
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');
        
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('uploadPlaceholder').style.display = 'block';

        if (itemId) {
            const item = this.data.products.find(p => p.id === itemId);
            if (item) {
                this.editingItem = item;
                document.getElementById('itemModalTitle').innerHTML = '<i class="fas fa-edit"></i> កែសម្រួលមុខម្ហូប';
                document.getElementById('itemId').value = item.id;
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemCategory').value = item.category;
                document.getElementById('itemPrice').value = item.price;
                document.getElementById('itemSalePrice').value = item.salePrice || '';
                document.getElementById('itemDescription').value = item.description || '';
                document.getElementById('itemActive').checked = item.active;
                document.getElementById('itemImage').value = item.image || '';
                
                if (item.image) {
                    document.getElementById('imagePreview').innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <button type="button" class="remove-image" onclick="pos.removeImage()">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    document.getElementById('uploadPlaceholder').style.display = 'none';
                }
            }
        } else {
            this.editingItem = null;
            document.getElementById('itemModalTitle').innerHTML = '<i class="fas fa-plus"></i> បន្ថែមមុខម្ហូប';
            document.getElementById('itemId').value = '';
        }

        modal.classList.add('active');
    }

    previewImage(input) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target.result;
                document.getElementById('itemImage').value = base64Image;
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${base64Image}" alt="Preview">
                    <button type="button" class="remove-image" onclick="pos.removeImage()">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                document.getElementById('uploadPlaceholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        document.getElementById('itemImage').value = '';
        document.getElementById('itemImageFile').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('uploadPlaceholder').style.display = 'block';
    }

    saveItem() {
        const id = document.getElementById('itemId').value;
        const name = document.getElementById('itemName').value;
        const category = document.getElementById('itemCategory').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const salePrice = parseFloat(document.getElementById('itemSalePrice').value) || 0;
        const description = document.getElementById('itemDescription').value;
        const active = document.getElementById('itemActive').checked;
        const image = document.getElementById('itemImage').value;

        if (id) {
            // Update
            const item = this.data.products.find(p => p.id === parseInt(id));
            if (item) {
                item.name = name;
                item.category = category;
                item.price = price;
                item.salePrice = salePrice;
                item.description = description;
                item.active = active;
                item.image = image;
                this.showToast('បានកែសម្រួលមុខម្ហូប!', 'success');
            }
        } else {
            // Add new
            const newItem = {
                id: generateId(),
                name,
                category,
                price,
                salePrice,
                description,
                active,
                image,
                icon: categoryIcons[category] || 'fa-utensils'
            };
            this.data.products.push(newItem);
            this.showToast('បានបន្ថែមមុខម្ហូប!', 'success');
        }

        saveData(this.data);
        this.closeAllModals();
        this.renderItems();
    }

    deleteItem(id) {
        if (confirm('តើអ្នកចង់លុបមុខម្ហូបនេះទេ?')) {
            this.data.products = this.data.products.filter(p => p.id !== id);
            saveData(this.data);
            this.renderItems();
            this.showToast('បានលុបមុខម្ហូប!', 'success');
        }
    }

    // Orders
    async renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">កំពុងទាញយកទិន្នន័យ...</td></tr>';

        try {
            // Build API query parameters
            let apiUrl = '/api/orders?';
            
            // Admin and manager can see all orders, staff can only see their own
            if (this.currentUser.role === 'staff') {
                apiUrl += `userId=${this.currentUser.id}&`;
            }
            
            // Add date filter if selected
            const dateFilter = document.getElementById('orderDateFilter').value;
            if (dateFilter) {
                apiUrl += `date=${dateFilter}&`;
            }
            
            console.log('Fetching orders from:', apiUrl);
            
            const response = await fetch(apiUrl);
            const result = await response.json();
            
            console.log('Orders API response:', result);

            if (!result.success) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">មិនអាចទាញយកទិន្នន័យបានទេ!</td></tr>';
                this.showToast('មិនអាចទាញយកការលក់បានទេ!', 'error');
                return;
            }

            let orders = result.orders;
            console.log('Orders loaded:', orders.length);

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">គ្មានការលក់</td></tr>';
                return;
            }

            // Update local data
            this.data.orders = orders;

            tbody.innerHTML = orders.map((order, index) => {
                // Handle both single and double-encoded JSON
                let items;
                try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    // Check if it's double-encoded (string inside string)
                    if (typeof items === 'string') {
                        items = JSON.parse(items);
                    }
                } catch (e) {
                    console.error('Error parsing items:', e);
                    items = [];
                }
                
                const itemCount = Array.isArray(items) ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
                const itemNames = Array.isArray(items) ? items.map(i => i.name).join(', ') : '';

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${order.receiptNumber}</td>
                        <td>${formatDate(order.date)}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemNames}</td>
                        <td>${itemCount}</td>
                        <td>${formatCurrency(order.total)}</td>
                        <td>${order.discountAmount > 0 ? formatCurrency(order.discountAmount) : '-'}</td>
                        <td>${order.userName}</td>
                        <td>
                            <button class="btn-view-order" onclick="pos.viewOrder('${order.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Render orders error:', error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-light);">កំហុសក្នុងការទាញយកទិន្នន័យ!</td></tr>';
            this.showToast('កំហុសក្នុងការទាញយកការលក់: ' + error.message, 'error');
        }
    }

    viewOrder(orderId) {
        // Find order in local data (already loaded from API)
        let order = this.data.orders.find(o => o.id === orderId);
        if (!order) return;

        // Handle both single and double-encoded JSON
        let items;
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            // Check if it's double-encoded (string inside string)
            if (typeof items === 'string') {
                items = JSON.parse(items);
            }
        } catch (e) {
            console.error('Error parsing items in viewOrder:', e);
            items = [];
        }

        this.viewingOrder = { ...order, items };

        const content = document.getElementById('orderViewContent');
        content.innerHTML = `
            <div class="order-view-header">
                <div class="order-info-item">
                    <label>លេខវិក័យបត្រ</label>
                    <span>${order.receiptNumber}</span>
                </div>
                <div class="order-info-item">
                    <label>កាលបរិច្ឆេទ</label>
                    <span>${formatDate(order.date)}</span>
                </div>
                <div class="order-info-item">
                    <label>អ្នកបម្រើ</label>
                    <span>${order.userName}</span>
                </div>
                <div class="order-info-item">
                    <label>វិធីទូទាត់</label>
                    <span>${order.paymentMethod.toUpperCase()}</span>
                </div>
            </div>
            <div class="order-view-items">
                ${items.map(item => `
                    <div class="order-view-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-view-totals">
                <div class="receipt-row">
                    <span>ចំនួនទឹកប្រាក់:</span>
                    <span>${formatCurrency(order.subtotal)}</span>
                </div>
                ${order.discountAmount > 0 ? `
                    <div class="receipt-row discount">
                        <span>បញ្ចុះ:</span>
                        <span>${formatCurrency(order.discountAmount)}</span>
                    </div>
                ` : ''}
                <div class="receipt-row total">
                    <span>សរុប:</span>
                    <span>${formatCurrency(order.total)}</span>
                </div>
            </div>
        `;

        document.getElementById('orderViewModal').classList.add('active');
    }

    printOrder() {
        if (!this.viewingOrder) return;
        
        const printWindow = window.open('', '', 'width=400,height=600');
        const order = this.viewingOrder;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
                    .receipt-header { text-align: center; margin-bottom: 15px; }
                    .receipt-header h3 { color: #6F4E37; font-size: 20px; margin: 5px 0; }
                    .receipt-divider { border-top: 2px dashed #ddd; margin: 15px 0; }
                    .order-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .totals { padding-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3>Coffee POS</h3>
                    <p>ប្រព័ន្ធគ្រប់គ្រងហាងកាហ្វេ</p>
                </div>
                <div style="border-top: 2px dashed #ddd; margin: 15px 0;"></div>
                <p><strong>លេខវិក័យបត្រ:</strong> ${order.receiptNumber}</p>
                <p><strong>កាលបរិច្ឆេទ:</strong> ${formatDate(order.date)}</p>
                <p><strong>អ្នកបម្រើ:</strong> ${order.userName}</p>
                <div style="border-top: 2px dashed #ddd; margin: 15px 0;"></div>
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
                <div style="border-top: 2px dashed #ddd; margin: 15px 0;"></div>
                <div class="totals">
                    <div class="total-row">
                        <span>ចំនួនទឹកប្រាក់:</span>
                        <span>${formatCurrency(order.subtotal)}</span>
                    </div>
                    ${order.discountAmount > 0 ? `
                        <div class="total-row" style="color: red;">
                            <span>បញ្ចុះ:</span>
                            <span>${formatCurrency(order.discountAmount)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row final">
                        <span>សរុប:</span>
                        <span>${formatCurrency(order.total)}</span>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    exportOrders() {
        const orders = this.data.orders;
        if (orders.length === 0) {
            this.showToast('គ្មានទិន្នន័យសម្រាប់ Export', 'warning');
            return;
        }

        let csv = 'ល.រ,លេខវិក័យបត្រ,កាលបរិច្ឆេទ,មុខម្ហូប,ចំនួន,សរុប,បញ្ចុះ,អ្នកបម្រើ\n';
        orders.forEach((order, index) => {
            let items;
            try {
                items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                if (typeof items === 'string') {
                    items = JSON.parse(items);
                }
            } catch (e) {
                items = [];
            }
            if (!Array.isArray(items)) items = [];
            const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
            const itemNames = items.map(i => i.name).join('; ');
            csv += `${index + 1},${order.receiptNumber},${order.date},"${itemNames}",${itemCount},${order.total},${order.discountAmount},${order.userName}\n`;
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showToast('បាន Export ទិន្នន័យ!', 'success');
    }

    // Users
    async renderUsers() {
        // Only admin can see users page
        if (this.currentUser.role !== 'admin') {
            document.getElementById('usersPage').classList.add('hidden');
            return;
        }

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">កំពុងទាញយកទិន្នន័យ...</td></tr>';

        try {
            console.log('Fetching users with userId:', this.currentUser.id, 'userRole:', this.currentUser.role);
            
            // Fetch users from REST API
            const response = await fetch(`/api/users?userId=${this.currentUser.id}&userRole=${this.currentUser.role}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Users API response:', result);

            if (!result.success) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">${result.message || 'មិនអាចទាញយកទិន្នន័យបានទេ!'}</td></tr>`;
                this.showToast(result.message || 'មិនអាចទាញយកទិន្នន័យបានទេ!', 'error');
                return;
            }

            const users = result.users;
            console.log('Users loaded:', users.length);

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">គ្មានអ្នកប្រើប្រាស់</td></tr>';
                return;
            }

            // Update local data
            this.data.users = users;

            const roleNames = {
                admin: 'Admin',
                manager: 'អ្នកគ្រប់គ្រង',
                staff: 'បុគ្គលិក'
            };

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.fullname}</td>
                    <td><span class="role-badge ${user.role}">${roleNames[user.role]}</span></td>
                    <td>${formatDisplayDate(user.createdAt)}</td>
                    <td>
                        <button class="btn-view-order" onclick="pos.openUserModal('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== this.currentUser.id ? `
                            <button class="btn-delete-item" onclick="pos.deleteUser('${user.id}')" style="margin-left: 5px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Render users error:', error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">កំហុស: ${error.message}</td></tr>`;
            this.showToast('កំហុសក្នុងការទាញយកទិន្នន័យ: ' + error.message, 'error');
        }
    }

    openUserModal(userId = null) {
        // Only admin can manage users
        if (this.currentUser.role !== 'admin') {
            this.showToast('មានតែ Admin ទេដែលអាចគ្រប់គ្រងអ្នកប្រើប្រាស់!', 'error');
            return;
        }

        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');

        form.reset();
        document.getElementById('userPassword').required = !userId;
        document.getElementById('passwordNote').style.display = userId ? 'block' : 'none';

        if (userId) {
            // Find user in local data (already loaded from API)
            const user = this.data.users.find(u => u.id === userId);
            if (user) {
                this.editingUser = user;
                document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> កែសម្រួលអ្នកប្រើប្រាស់';
                document.getElementById('userId').value = user.id;
                document.getElementById('userUsername').value = user.username;
                document.getElementById('userFullname').value = user.fullname;
                document.getElementById('userPassword').value = '';
                document.getElementById('userRole').value = user.role;

                // Set permissions - only admin can assign permissions
                const userPermissions = user.permissions || [];
                document.getElementById('permPOS').checked = userPermissions.includes('pos');
                document.getElementById('permItems').checked = userPermissions.includes('items');
                document.getElementById('permOrders').checked = userPermissions.includes('orders');
                document.getElementById('permReports').checked = userPermissions.includes('reports');
            }
        } else {
            this.editingUser = null;
            document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> បន្ថែមអ្នកប្រើប្រាស់';
            document.getElementById('userId').value = '';
        }

        modal.classList.add('active');
    }

    async saveUser() {
        // Only admin can save users
        if (this.currentUser.role !== 'admin') {
            this.showToast('មានតែ Admin ទេដែលអាចគ្រប់គ្រងអ្នកប្រើប្រាស់!', 'error');
            return;
        }

        const id = document.getElementById('userId').value;
        const username = document.getElementById('userUsername').value;
        const fullname = document.getElementById('userFullname').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;

        console.log('Saving user:', { id, username, fullname, role, hasPassword: !!password });

        // Validate password for new users
        if (!id && !password) {
            this.showToast('សូមបញ្ចូលពាក្យសម្ងាត់!', 'error');
            return;
        }

        // Prevent creating duplicate admin
        if (role === 'admin' && id) {
            const existingUser = this.data.users.find(u => u.id === id);
            if (existingUser && existingUser.role !== 'admin') {
                // Check if there's already another admin
                const otherAdmins = this.data.users.filter(u => u.role === 'admin' && u.id !== id);
                if (otherAdmins.length > 0) {
                    this.showToast('មិនអាចផ្លាស់ប្តូរជា Admin ទេ ព្រោះមាន Admin រួចហើយ!', 'error');
                    return;
                }
            }
        }

        // Prevent creating new admin if one exists (except current user)
        if (role === 'admin' && !id) {
            const existingAdmins = this.data.users.filter(u => u.role === 'admin' && u.id !== this.currentUser.id);
            if (existingAdmins.length > 0) {
                this.showToast('មានតែ Admin មួយគត់ដែលអាចមានក្នុងប្រព័ន្ធ!', 'error');
                return;
            }
        }

        // Build permissions - only admin can assign permissions
        const permissions = [];
        if (document.getElementById('permPOS').checked) permissions.push('pos');
        if (document.getElementById('permItems').checked) permissions.push('items');
        if (document.getElementById('permOrders').checked) permissions.push('orders');
        if (document.getElementById('permReports').checked) permissions.push('reports');

        // If role is admin, give all permissions
        if (role === 'admin') {
            permissions.length = 0;
            permissions.push('pos', 'items', 'orders', 'reports', 'users');
        }

        const isUpdatingCurrentUser = id && id === this.currentUser.id;

        try {
            if (id) {
                // Update via REST API
                const response = await fetch(`/api/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        fullname,
                        password: password || undefined,
                        role,
                        permissions,
                        active: true,
                        userId: this.currentUser.id,
                        userRole: this.currentUser.role
                    })
                });

                const result = await response.json();
                console.log('Update user result:', result);

                if (result.success) {
                    // Update local data
                    const user = this.data.users.find(u => u.id === id);
                    if (user) {
                        user.username = username;
                        user.fullname = fullname;
                        user.role = role;
                        user.permissions = permissions;

                        // Update current user permissions if editing self
                        if (isUpdatingCurrentUser) {
                            this.currentUser.permissions = permissions;
                            if (role === 'admin') {
                                this.currentUser.role = 'admin';
                                this.currentUser.permissions = ['pos', 'items', 'orders', 'reports', 'users'];
                            }
                        }
                    }

                    this.showToast('បានកែសម្រួលអ្នកប្រើប្រាស់!', 'success');
                } else {
                    this.showToast(result.message || 'កំហុសក្នុងការកែសម្រួល!', 'error');
                    return;
                }
            } else {
                // Create via REST API
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        fullname,
                        role,
                        permissions,
                        userId: this.currentUser.id,
                        userRole: this.currentUser.role
                    })
                });

                const result = await response.json();
                console.log('Create user result:', result);

                if (result.success) {
                    this.showToast('បានបន្ថែមអ្នកប្រើប្រាស់!', 'success');
                } else {
                    this.showToast(result.message || 'កំហុសក្នុងការបន្ថែម!', 'error');
                    return;
                }
            }

            saveData(this.data);
            this.closeAllModals();
            await this.renderUsers();

            // Refresh permissions if editing current user
            if (isUpdatingCurrentUser) {
                this.applyUserPermissions();
                this.showToast('សិទ្ធិប្រើប្រាស់ត្រូវបានធ្វើបច្ចុប្បន្នភាព! ប្រព័ន្ធនឹងផ្ទុកឡើងវិញ...', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('User save error:', error);
            this.showToast('មានកំហុសកើតឡើង!', 'error');
        }
    }

    async deleteUser(id) {
        // Only admin can delete users
        if (this.currentUser.role !== 'admin') {
            this.showToast('មានតែ Admin ទេដែលអាចលុបអ្នកប្រើប្រាស់!', 'error');
            return;
        }

        if (confirm('តើអ្នកចង់លុបអ្នកប្រើប្រាស់នេះទេ?')) {
            try {
                // Delete via REST API
                const response = await fetch(`/api/users/${id}?userId=${this.currentUser.id}&userRole=${this.currentUser.role}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    // Update local data
                    this.data.users = this.data.users.filter(u => u.id !== id);
                    saveData(this.data);
                    this.renderUsers();
                    this.showToast('បានលុបអ្នកប្រើប្រាស់!', 'success');
                } else {
                    this.showToast(result.message || 'កំហុសក្នុងការលុប!', 'error');
                }
            } catch (error) {
                console.error('User delete error:', error);
                this.showToast('មានកំហុសកើតឡើង!', 'error');
            }
        }
    }

    // Reports
    async generateReports() {
        const period = document.getElementById('reportPeriod').value;
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        let periodLabel = '';

        switch(period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ថ្ងៃនេះ';
                break;
            case 'yesterday':
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ម្សិលមិញ';
                break;
            case 'week':
                // Start of current week (Monday)
                const dayOfWeek = now.getDay() || 7;
                startDate.setDate(now.getDate() - dayOfWeek + 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'សប្តាហ៍នេះ';
                break;
            case 'lastWeek':
                const lastWeekDay = now.getDay() || 7;
                startDate.setDate(now.getDate() - lastWeekDay - 6);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(now.getDate() - lastWeekDay);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'សប្តាហ៍មុន';
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ខែនេះ';
                break;
            case 'lastMonth':
                startDate.setMonth(now.getMonth() - 1);
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(now.getMonth() - 1);
                endDate.setDate(0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ខែមុន';
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ឆ្នាំនេះ';
                break;
            case 'lastYear':
                startDate.setFullYear(now.getFullYear() - 1);
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setFullYear(now.getFullYear() - 1);
                endDate.setMonth(11, 31);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ឆ្នាំមុន';
                break;
            case 'custom':
                const customStart = document.getElementById('customStartDate').value;
                const customEnd = document.getElementById('customEndDate').value;
                if (customStart) {
                    startDate = new Date(customStart);
                    startDate.setHours(0, 0, 0, 0);
                }
                if (customEnd) {
                    endDate = new Date(customEnd);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                }
                periodLabel = 'កំណត់ដោយខ្លួនឯង';
                break;
            default:
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                periodLabel = 'ថ្ងៃនេះ';
        }

        // Format dates for API
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        try {
            // Fetch stats from REST API
            const response = await fetch(`/api/reports/summary?startDate=${startDateStr}&endDate=${endDateStr}`);
            const result = await response.json();

            if (!result.success) {
                this.showToast('មិនអាចទាញយករបាយការណ៍បានទេ!', 'error');
                return;
            }

            const stats = result.stats;

            // Update report UI
            document.getElementById('reportPeriodTitle').innerHTML = `
                <i class="fas fa-calendar-alt"></i>
                <span>រយៈពេល: ${periodLabel}</span>
            `;

            document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('topProduct').textContent = stats.topProduct || '-';
            document.getElementById('avgOrderValue').textContent = formatCurrency(stats.avgOrderValue);

            document.getElementById('reportTotalRevenue').textContent = formatCurrency(stats.totalRevenue);
            document.getElementById('reportTotalDiscount').textContent = formatCurrency(stats.totalDiscount);

            // Calculate total items sold
            const itemsOrdersResponse = await fetch(`/api/orders?startDate=${startDateStr}&endDate=${endDateStr}`);
            const ordersResult = await itemsOrdersResponse.json();
            let totalItemsSold = 0;
            if (ordersResult.success) {
                ordersResult.orders.forEach(order => {
                    // Handle both single and double-encoded JSON
                    let items;
                    try {
                        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                        if (typeof items === 'string') {
                            items = JSON.parse(items);
                        }
                    } catch (e) {
                        items = [];
                    }
                    if (Array.isArray(items)) {
                        totalItemsSold += items.reduce((sum, item) => sum + item.quantity, 0);
                    }
                });
            }
            document.getElementById('reportItemsSold').textContent = totalItemsSold;
            document.getElementById('reportCustomers').textContent = stats.totalOrders;

            // Load top products
            await this.loadTopProducts(startDateStr, endDateStr);

        } catch (error) {
            console.error('Generate reports error:', error);
            this.showToast('កំហុសក្នុងការទាញយករបាយការណ៍: ' + error.message, 'error');
        }
    }

    async loadTopProducts(startDate, endDate) {
        try {
            const response = await fetch(`/api/orders?startDate=${startDate}&endDate=${endDate}`);
            const result = await response.json();

            if (!result.success) {
                return;
            }

            const productSales = {};

            result.orders.forEach(order => {
                // Handle both single and double-encoded JSON
                let items;
                try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    if (typeof items === 'string') {
                        items = JSON.parse(items);
                    }
                } catch (e) {
                    items = [];
                }
                
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        if (!productSales[item.name]) {
                            productSales[item.name] = 0;
                        }
                        productSales[item.name] += item.quantity;
                    });
                }
            });

            // Sort by quantity and get top 5
            const topProducts = Object.entries(productSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const container = document.getElementById('topProductsList');
            if (topProducts.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">គ្មានទិន្នន័យ</p>';
                return;
            }

            container.innerHTML = topProducts.map((product, index) => `
                <div class="top-product-item">
                    <div class="top-product-rank">#${index + 1}</div>
                    <div class="top-product-info">
                        <div class="top-product-name">${product[0]}</div>
                        <div class="top-product-qty">លក់បាន ${product[1]} ចំនួន</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load top products error:', error);
        }
    }

    // ============== REAL-TIME EVENT HANDLERS ==============

    handleUserStatus(data) {
        console.log('👥 User status update:', data);
        if (data.type === 'online') {
            this.onlineUsers.set(data.userId, {
                username: data.username,
                fullname: data.fullname,
                online: true
            });
            this.showToast(`${data.fullname} បានចូលប្រើប្រាស់ (${data.onlineCount} អ្នក)`, 'success');
        } else {
            this.onlineUsers.delete(data.userId);
            console.log(`📊 Online users: ${data.onlineCount}`);
        }
    }

    handleUserCreated(data) {
        console.log('👤 User created:', data);
        this.showToast('អ្នកប្រើប្រាស់ថ្មីត្រូវបានបន្ថែម!', 'success');
        // Refresh users page if open
        if (this.currentPage === 'users') {
            this.renderUsers();
        }
    }

    handleUserUpdated(data) {
        console.log('👤 User updated:', data);
        this.showToast('អ្នកប្រើប្រាស់ត្រូវបានកែសម្រួល!', 'success');
        // Refresh users page if open
        if (this.currentPage === 'users') {
            this.renderUsers();
        }
        // Update current user if self
        if (this.currentUser && data.id === this.currentUser.id) {
            this.currentUser.role = data.role;
            this.currentUser.permissions = data.permissions;
        }
    }

    handleUserDeleted(data) {
        console.log('👤 User deleted:', data);
        this.showToast('អ្នកប្រើប្រាស់ត្រូវបានលុប!', 'warning');
        // Refresh users page if open
        if (this.currentPage === 'users') {
            this.renderUsers();
        }
    }

    handleOrderCreated(data) {
        console.log('🛒 Order created:', data);
        this.showToast('ការលក់ថ្មីត្រូវបានបង្កើត!', 'success');
        // Refresh orders page if open
        if (this.currentPage === 'orders') {
            this.renderOrders();
        }
        // Update reports if open
        if (this.currentPage === 'reports') {
            this.generateReports();
        }
    }

    handleOrderDeleted(data) {
        console.log('🗑️ Order deleted:', data);
        this.showToast('ការលក់ត្រូវបានលុប!', 'warning');
        // Refresh orders page if open
        if (this.currentPage === 'orders') {
            this.renderOrders();
        }
        // Update reports if open
        if (this.currentPage === 'reports') {
            this.generateReports();
        }
    }

    handleProductCreated(data) {
        console.log('📦 Product created:', data);
        this.showToast('មុខម្ហូបថ្មីត្រូវបានបន្ថែម!', 'success');
        // Refresh products if on POS or items page
        if (this.currentPage === 'pos') {
            this.renderProducts();
        } else if (this.currentPage === 'items') {
            this.renderItems();
        }
    }

    handleProductUpdated(data) {
        console.log('📦 Product updated:', data);
        this.showToast('មុខម្ហូបត្រូវបានកែសម្រួល!', 'success');
        // Refresh products if on POS or items page
        if (this.currentPage === 'pos') {
            this.renderProducts();
        } else if (this.currentPage === 'items') {
            this.renderItems();
        }
    }

    handleProductDeleted(data) {
        console.log('🗑️ Product deleted:', data);
        this.showToast('មុខម្ហូបត្រូវបានលុប!', 'warning');
        // Refresh products if on POS or items page
        if (this.currentPage === 'pos') {
            this.renderProducts();
        } else if (this.currentPage === 'items') {
            this.renderItems();
        }
    }

    // Utilities
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.viewingOrder = null;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize app
const pos = new CoffeePOS();
