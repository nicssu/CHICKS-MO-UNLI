// pos.js

let currentCart = [];
let activeCategory = 'All';
let currentEmployee = null; 

function findProductById(id) {
    return products.find(p => p.id == id); 
}

function formatMoney(n) { return Number(n || 0).toFixed(2); }

// --- EMPLOYEE LOGIN/STATUS ---

function renderEmployeeStatus() {
    const statusDiv = document.getElementById("employeeStatus");
    if (!statusDiv) return;

    if (currentEmployee) {
        statusDiv.className = 'employee-login';
        statusDiv.innerHTML = `
            <span class="status" style="color: var(--primary-color);">Logged In: ${currentEmployee.name}</span>
            <button class="btn" onclick="employeeLogout()">Logout</button>
        `;
        
    } else {
        // FIX: Added the input field and correct layout for login
        statusDiv.className = 'employee-login';
        statusDiv.innerHTML = `
            <span class="status" style="color: red;">Not Logged In</span>
            <input type="number" id="employeePinInput" placeholder="Enter PIN" maxlength="4" style="max-width: 100px; text-align: center;"/>
            <button class="btn primary" onclick="employeeLogin()">Login</button>
        `;
    }
    updatePaymentAndChange(); 
}

function employeeLogin() {
    const pinInput = document.getElementById("employeePinInput");
    const pin = pinInput.value.trim();
    const employee = employees.find(e => e.pin === pin);

    if (employee) {
        currentEmployee = employee;
        sessionStorage.setItem("currentEmployeeId", employee.id);
        renderEmployeeStatus();
        alert(`Welcome, ${employee.name}!`);
    } else {
        alert("Invalid PIN.");
        pinInput.value = '';
    }
}

function employeeLogout() {
    currentEmployee = null;
    sessionStorage.removeItem("currentEmployeeId");
    renderEmployeeStatus();
    alert("Logged out.");
}

// --- CORE POS FUNCTIONS ---

function buildCategoryTabs() {
    const tabsContainer = document.getElementById("categoryTabs");
    tabsContainer.innerHTML = '';
    
    if (products.length === 0) return; 

    const categories = ['All', ...new Set(products.map(p => p.category || 'Other'))];

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `btn ${category === activeCategory ? 'active-tab' : ''}`;
        btn.textContent = category;
        
        btn.onclick = () => {
            activeCategory = category;
            document.getElementById("posSearch").value = "";
            buildCategoryTabs(); 
            renderPOS(category);
        };
        tabsContainer.appendChild(btn);
    });
}


function renderPOS(categoryFilter = activeCategory, searchTerm = "") {
    if (typeof products === 'undefined' || products.length === 0) {
        document.getElementById("productGrid").innerHTML = '<p class="muted">No products found.</p>';
        return;
    }

    const container = document.getElementById("productGrid");
    container.innerHTML = "";
    
    const filteredProducts = products.filter(p => {
        const productCategory = p.category || 'Other';
        const matchesCategory = (categoryFilter === 'All' || productCategory === categoryFilter);
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    const threshold = config.lowStockThreshold;

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="muted" style="grid-column: 1/-1; text-align: center; padding: 20px;">No matching products found.</p>';
        return;
    }

    filteredProducts.forEach((p) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "pos-product-card"; // Use your specialized POS class
        const isOutOfStock = p.qty <= 0;
        const isLowStock = p.qty <= threshold && p.qty > 0;
        
        itemDiv.style.cursor = isOutOfStock ? 'not-allowed' : 'pointer';
        itemDiv.style.backgroundColor = isOutOfStock ? '#fdd' : (isLowStock ? '#fffbe5' : '#fff');
        itemDiv.style.opacity = isOutOfStock ? '0.7' : '1';

        itemDiv.innerHTML = `
            <div class="title">${p.name}</div>
            <div class="price">₱${formatMoney(p.price)}</div>
            <div class="stock" style="color: ${isOutOfStock ? 'red' : isLowStock ? 'orange' : 'green'};">Stock: ${p.qty}</div>
        `;
        
        if (!isOutOfStock) {
            itemDiv.onclick = () => addProductToCart(p.id, 1);
        } else {
            itemDiv.onclick = () => alert('Out of stock!');
        }

        container.appendChild(itemDiv);
    });

    renderCartSummary();
}

function renderCartSummary() {
    const container = document.getElementById("posListSummary");
    container.innerHTML = '';
    let subtotalTaxBase = 0; // Total of all base prices (price excluding tax)
    let subtotal = 0; // Total of all prices (price including tax)

    if (currentCart.length === 0) {
        document.getElementById("subtotalAmount").innerText = formatMoney(0);
        document.getElementById("taxAmount").innerText = formatMoney(0);
        document.getElementById("totalAmount").innerText = formatMoney(0);
        container.innerHTML = '<p class="muted">Click a product to start an order.</p>';
        updatePaymentAndChange();
        return;
    }
    
    // Calculate totals for tax-inclusive pricing
    const taxRate = config.taxRate;
    const taxFactor = 1 + (taxRate / 100);

    currentCart.forEach((line) => {
        // Line.price is the final price (tax-inclusive)
        const totalTaxInclusive = line.qty * line.price;
        subtotal += totalTaxInclusive; 
        
        // Base Price (price EXCLUDING tax)
        const basePrice = totalTaxInclusive / taxFactor;
        subtotalTaxBase += basePrice;
    });
    
    // Tax is the difference between total price and total base price
    const taxAmount = subtotal - subtotalTaxBase;
    const grandTotal = subtotal; // Grand total is the sum of tax-inclusive prices

    let listHTML = `<table style="width:100%; border-collapse: collapse; margin-bottom: 15px;">
                      <thead>
                        <tr>
                            <th style="text-align: left;">Item</th>
                            <th style="width: 70px;">Qty</th>
                            <th style="width: 80px; text-align: right;">Total</th>
                            <th style="width: 40px;"></th>
                        </tr>
                      </thead>
                      <tbody>`;
    
    currentCart.forEach((line, index) => {
        // Display tax-inclusive total for the line item
        const lineTotal = line.qty * line.price; 
        
        listHTML += `<tr>
                        <td>${line.name}</td>
                        <td>
                            <input type="number" value="${line.qty}" min="1" style="width:50px; padding: 4px;" 
                                onchange="updateCartQty(${index}, this.value)">
                        </td>
                        <td style="text-align: right;">₱${formatMoney(lineTotal)}</td>
                        <td>
                            <button class="btn" style="padding: 4px 8px;" onclick="removeCartItem(${index})">X</button>
                        </td>
                     </tr>`;
    });

    listHTML += `</tbody></table>`;
    container.innerHTML = listHTML;
    
    // Display totals
    document.getElementById("taxRateDisplay").innerText = taxRate.toFixed(2);
    // Subtotal is now the BASE price (pre-tax total)
    document.getElementById("subtotalAmount").innerText = formatMoney(subtotalTaxBase); 
    document.getElementById("taxAmount").innerText = formatMoney(taxAmount);
    document.getElementById("totalAmount").innerText = formatMoney(grandTotal);

    updatePaymentAndChange();
}

function addProductToCart(productId, qty) {
    const p = findProductById(productId);
    if (!p) return alert('Product not found');
    if (p.qty < qty) return alert('Insufficient stock');

    p.qty -= qty;
    saveAll();

    const existing = currentCart.find(c => c.id == p.id);
    if (existing) {
        existing.qty += qty;
    } else {
        // Record costPrice for profit calculation
        currentCart.push({ 
            id: p.id, 
            name: p.name, 
            qty: qty, 
            price: p.price, // This price is tax-inclusive
            costPrice: p.costPrice || 0, 
        });
    }

    renderCartSummary();
    renderPOS();
}

function updateCartQty(index, newQty) {
    newQty = Number(newQty);
    if (newQty <= 0) {
        removeCartItem(index);
        return;
    }
    const line = currentCart[index];
    const prod = findProductById(line.id);
    const diff = newQty - line.qty;

    if (diff > 0) {
        if (prod.qty < diff) {
            alert('Not enough stock to increase');
            // Re-render to fix the input value
            renderCartSummary(); 
            return;
        }
        prod.qty -= diff;
    } else if (diff < 0) {
        prod.qty += Math.abs(diff);
    }
    line.qty = newQty;
    saveAll();
    renderCartSummary();
    renderPOS();
}

function removeCartItem(index) {
    const line = currentCart[index];
    const prod = findProductById(line.id);
    if (prod) prod.qty += line.qty;
    currentCart.splice(index, 1);
    saveAll();
    renderCartSummary();
    renderPOS();
}

function clearOrder() {
    if (currentCart.length === 0) return;
    if (!confirm("Are you sure you want to cancel the entire order?")) return;
    
    currentCart.forEach(line => {
        const prod = findProductById(line.id);
        if (prod) prod.qty += line.qty;
    });
    currentCart = [];
    saveAll();
    
    document.getElementById("paymentReceived").value = '';
    
    renderCartSummary();
    renderPOS();
    document.getElementById("receiptCard").style.display = 'none';
    alert("Order cancelled. Stock restored.");
}

function updatePaymentAndChange() {
    const grandTotal = parseFloat(document.getElementById("totalAmount").innerText); 
    const payment = parseFloat(document.getElementById("paymentReceived").value) || 0;
    
    const change = payment - grandTotal;
    
    document.getElementById("changeAmount").innerText = formatMoney(Math.max(0, change));

    const checkoutBtn = document.getElementById("checkoutBtn");
    
    // Check if employee is logged in and total is paid
    const canCheckout = currentEmployee && payment >= grandTotal && grandTotal > 0; 
    
    checkoutBtn.disabled = !canCheckout;
    
    if (!currentEmployee) {
        checkoutBtn.textContent = 'Login to Checkout';
    } else if (grandTotal === 0) {
        checkoutBtn.textContent = 'Empty Order';
    } else if (payment < grandTotal) {
        checkoutBtn.textContent = 'Insufficient Payment';
    } else {
        checkoutBtn.textContent = 'Complete Transaction';
    }
}

// FULL REPLACEMENT for checkout() in pos.js
function checkout() {
    if (currentCart.length === 0) return alert("Cart is empty!");
    if (!currentEmployee) return alert("Please login with your PIN first!");

    const total = parseFloat(document.getElementById("totalAmount").innerText);
    const payment = parseFloat(document.getElementById("paymentReceived").value) || 0;
    const paymentMethod = document.getElementById("paymentMethod").value; 

    if (payment < total) {
        return alert("Inadequate payment amount!");
    }

    const change = payment - total;
    const taxRate = config.taxRate || 0;
    const taxAmount = total * (taxRate / 100);
    const subtotal = total - taxAmount;

    // Calculate total cost for profit tracking
    let totalCost = 0;
    currentCart.forEach(item => {
        const p = findProductById(item.id);
        const costPrice = p ? (p.cost || 0) : 0;
        // Use count OR qty depending on what's available
        const quantity = item.count || item.qty || 1;
        totalCost += costPrice * quantity;
    });

    // Create the Sale Object
    const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(currentCart)), 
        total: total,
        tax: taxAmount,
        cost: totalCost,
        profit: subtotal - totalCost,
        payment: payment,
        change: change,
        paymentMethod: paymentMethod, 
        cashier: currentEmployee.name
    };

    // Save to Database
    sales.push(sale);
    saveAll();

    // Show Receipt
    renderReceipt(sale);
    document.getElementById("receiptCard").style.display = 'block';
    
    // Reset POS
    currentCart = [];
    document.getElementById("paymentReceived").value = '';
    renderPOS();
    alert("Transaction Successful!");
}

// FULL REPLACEMENT for renderReceipt() in pos.js
function renderReceipt(sale) {
    const receiptContent = document.getElementById("receiptContent");
    
    // FIX: Using robust property checks to prevent 'undefined'
    let itemsHTML = sale.items.map(item => {
        const qty = item.count || item.qty || 0;
        const price = item.price || 0;
        const itemTotal = price * qty;
        
        return `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                <span>${qty}x ${item.name}</span>
                <span>₱${formatMoney(itemTotal)}</span>
            </div>
        `;
    }).join('');

    const receiptHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h3 style="margin:0; color: #4a148c;">ICHI-BOO TAKOYAKI</h3>
            <p style="font-size: 0.75rem; margin:2px 0;">${new Date(sale.date).toLocaleString()}</p>
            <p style="font-size: 0.75rem; margin:2px 0;">Cashier: ${sale.cashier}</p>
            <p style="font-size: 0.75rem; margin:2px 0;">ID: ${sale.id}</p>
        </div>
        <div style="border-top: 1px dashed #444; margin: 10px 0;"></div>
        ${itemsHTML}
        <div style="border-top: 1px dashed #444; margin: 10px 0;"></div>
        <div style="font-size: 0.9rem;">
            <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Method:</span> <span>${sale.paymentMethod}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 4px 0; font-weight: bold;">
                <span>TOTAL:</span> <span>₱${formatMoney(sale.total)}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Paid:</span> <span>₱${formatMoney(sale.payment)}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 4px 0; font-weight: bold; color: #2e7d32;">
                <span>CHANGE:</span> <span>₱${formatMoney(sale.change)}</span>
            </p>
        </div>
        <div style="border-top: 1px dashed #444; margin: 10px 0;"></div>
        <p style="text-align: center; font-size: 0.75rem; font-style: italic;">Thank you for dining with us!</p>
    `;
    
    receiptContent.innerHTML = receiptHTML;
}

function printReceipt() {
    const printContents = document.getElementById('receiptCard').innerHTML;
    const originalContents = document.body.innerHTML;

    // Temporarily replace body content with just the receipt to ensure clean printing
    document.body.innerHTML = printContents;
    window.print();
    
    // Restore the original POS interface
    document.body.innerHTML = originalContents;
    location.reload(); // Reload to re-bind all button listeners
}

window.addEventListener("DOMContentLoaded", () => {
    // Attempt to restore employee session
    const storedEmployeeId = sessionStorage.getItem("currentEmployeeId");
    if (storedEmployeeId) {
        currentEmployee = employees.find(e => e.id == storedEmployeeId);
    }
    renderEmployeeStatus();
    
    if (typeof products !== 'undefined') {
        buildCategoryTabs(); 
        renderPOS(); 
    } else {
        document.getElementById("productGrid").innerHTML = '<p class="muted">No products found. Please go to Inventory to add items.</p>';
    }

    // --- ADDED SEARCH LISTENER ---
    const searchInput = document.getElementById("posSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            renderPOS(activeCategory, term); // Pass both category and search term
        });
    }

    document.getElementById("paymentReceived").addEventListener("input", updatePaymentAndChange);
    document.getElementById("checkoutBtn").addEventListener("click", checkout);
    document.getElementById("cancelOrderBtn").addEventListener("click", clearOrder);

});
