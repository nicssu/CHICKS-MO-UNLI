// js/inventory.js

let currentCategory = 'all';
let currentSearch = '';
let rawSortDirection = true;
let productSortDirection = true;

function formatMoney(n) {
    return Number(n || 0).toFixed(2);
}

// --- PART 1: FINISHED PRODUCT INVENTORY ---

function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return; //
    
    // Dynamically get only categories that actually have products
    let activeCategories = products
        .map(p => p.category)
        .filter(c => c && c.trim() !== ''); //
    
    // Create a unique list and always include 'all'
    let categories = ['all', ...new Set(activeCategories)]; //

    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        // Format text: 'all' becomes 'All Products', others stay as is
        btn.textContent = cat === 'all' ? 'All Products' : cat;
        btn.className = `btn ${currentCategory.toLowerCase() === cat.toLowerCase() ? 'active-tab' : ''}`; //
        
        btn.onclick = () => {
            currentCategory = cat;
            renderInventory(); //
        };
        container.appendChild(btn);
    });
}

function renderInventory() {
    const container = document.getElementById("inventoryList");
    const searchInput = document.getElementById("inventorySearch");
    if (!container) return;

    currentSearch = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(currentSearch);
        const matchesCat = currentCategory === 'all' || p.category === currentCategory;
        return matchesSearch && matchesCat;
    });

    // START TABLE
    let html = `
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--primary-color); color: white; position: sticky; top: 0; z-index: 10;">
                    <th style="padding:12px; text-align:left; cursor:pointer;" onclick="sortProducts('name')">Product Name ↕</th>
                    <th style="padding:12px; text-align:left; cursor:pointer;" onclick="sortProducts('category')">Category ↕</th>
                    <th style="padding:12px; text-align:right; cursor:pointer;" onclick="sortProducts('price')">Price ↕</th>
                    <th style="padding:12px; text-align:right; cursor:pointer;" onclick="sortProducts('qty')">Stock ↕</th>
                    <th style="padding:12px; text-align:center;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredProducts.forEach((p, index) => {
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding:12px;">${p.name}</td>
                <td style="padding:12px;">${p.category || 'Uncategorized'}</td>
                <td style="padding:12px; text-align:right;">₱${formatMoney(p.price)}</td>
                <td style="padding:12px; text-align:right; font-weight:bold; color: ${p.qty <= 5 ? 'red' : 'inherit'}">
                    ${p.qty}
                </td>
                <td style="padding:12px; text-align:center;">
                    <button class="btn" onclick="editProduct(${index})">Edit</button>
                    <button class="btn" onclick="removeProduct(${p.id})" style="background:#ff5252; color:white;">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    renderCategoryTabs();
}

function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const cat = document.getElementById("productCategory").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value) || 0;
    const cost = parseFloat(document.getElementById("productCostPrice").value) || 0;
    const qty = parseInt(document.getElementById("productQty").value) || 0;

    if (!name) return alert("Product name is required!");

    // Check if the product name already exists in our database
    let index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

    if (index > -1) {
        // --- ADD LOG HERE FOR UPDATES ---
        logActivity("Stock Update", `Modified ${name} (New Qty: ${qty}, Price: ₱${price})`);

        // UPDATE EXISTING: If it exists, overwrite the data
        products[index].category = cat;
        products[index].price = price;
        products[index].cost = cost;
        products[index].qty = qty;
    } else {
        // --- ADD LOG HERE FOR NEW ITEMS ---
        logActivity("New Product", `Added ${name} with ${qty} units to ${cat}`);

        // ADD NEW: If it's a new name, create a new entry
        products.push({
            id: Date.now(),
            name: name,
            category: cat,
            price: price,
            cost: cost,
            qty: qty
        });
    }

    saveAll();
    renderInventory();
    
    // Clear the form after saving
    document.getElementById("productName").value = '';
    document.getElementById("productCategory").value = '';
    document.getElementById("productPrice").value = '';
    document.getElementById("productCostPrice").value = '';
    document.getElementById("productQty").value = '';
    
    alert("Inventory Updated!");
}

// --- PART 2: RAW MATERIALS & EXPIRY ---

function addRawDelivery() {
    const name = document.getElementById("rawMaterialName").value.trim();
    const delivered = document.getElementById("deliveryDate").value;
    const expiry = document.getElementById("expiryDate").value;
    const qty = document.getElementById("rawQty").value.trim(); // Reads the text like "50kg"

    if (!name || !expiry || !qty) return alert("Please enter name, expiry date, and quantity");

    logActivity("Raw Delivery", `Received ${qty} of ${name}`);

    rawMaterials.push({
        id: Date.now(),
        name: name,
        delivered: delivered,
        expiry: expiry,
        qty: qty // This is now a string (e.g., "50kg")
    });

    saveAll();
    renderRawMaterials();
    
    // Clear inputs
    document.getElementById("rawMaterialName").value = '';
    document.getElementById("rawQty").value = '';
    document.getElementById("deliveryDate").value = '';
    document.getElementById("expiryDate").value = '';
}

function renderRawMaterials() {
    const list = document.getElementById("rawMaterialsList");
    if (!list) return;
    list.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    rawMaterials.forEach((item, index) => {
        const expDate = new Date(item.expiry);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        let statusHtml = '';
        let rowStyle = "";

        if (diffDays < 0) {
            statusHtml = `<span style="color: white; background: #d32f2f; padding: 2px 8px; border-radius: 4px; font-weight: bold;">EXPIRED</span>`;
            rowStyle = "background-color: #ffebee;";
        } else if (diffDays <= 3) {
            statusHtml = `<span style="color: #000; background: #ffeb3b; padding: 2px 8px; border-radius: 4px; font-weight: bold;">EXPIRING SOON</span>`;
        } else {
            statusHtml = `<span style="color: green;">Fresh</span>`;
        }

        // Updated this line to display the qty string (e.g., "50kg")
        list.innerHTML += `<tr style="border-bottom: 1px solid #eee; ${rowStyle}">
                <td style="padding: 10px;">${item.name} <br><small style="color:#666;">Qty: ${item.qty}</small></td>
                <td style="padding: 10px;">${item.expiry}</td>
                <td style="padding: 10px;">${statusHtml}</td>
                <td style="padding: 10px;"><button class="btn" onclick="deleteRaw(${index})">Delete</button></td>
            </tr>`;
    });
}

function deleteRaw(index) {
    if(confirm("Remove this log?")) {
        rawMaterials.splice(index, 1);
        saveAll();
        renderRawMaterials();
    }
}

function sortRawMaterials(key) {
    rawSortDirection = !rawSortDirection;
    rawMaterials.sort((a, b) => {
        let valA = a[key].toLowerCase();
        let valB = b[key].toLowerCase();
        return rawSortDirection ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    renderRawMaterials();
}

function sortProducts(key) {
    productSortDirection = !productSortDirection;
    
    products.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle string comparison (names/categories)
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
            return productSortDirection ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        // Handle number comparison (price/qty)
        return productSortDirection ? valA - valB : valB - valA;
    });

    renderInventory();
}

function removeProduct(productId) {
    if (confirm("Are you sure you want to delete this product? This cannot be undone.")) {
        // 1. Find the actual index in the master products array using the ID
        // This ensures the correct item is deleted even if you have searched or filtered categories.
        const masterIndex = products.findIndex(p => p.id === productId);
        
        if (masterIndex === -1) {
            console.error("Product not found");
            return;
        }

        // Get product details before deleting so we can log them
        const p = products[masterIndex];
        const deletedProductCategory = p.category;

        // 2. LOG THE ACTIVITY (Capture who did it and what was removed)
        logActivity("Deleted", `Removed ${p.name} from inventory`);

        // 3. Remove the item from the master array
        products.splice(masterIndex, 1);
        
        // 4. Save the updated array to localStorage/database.js
        saveAll();

        // 5. SMART CATEGORY CHECK: 
        // If the category we just deleted from is now empty, 
        // and it was the one we were looking at, reset the view to 'all'
        const categoryStillExists = products.some(prod => prod.category === deletedProductCategory);
        if (!categoryStillExists && currentCategory === deletedProductCategory) {
            currentCategory = 'all';
        }

        // 6. Refresh the Table, Tabs, and Log
        renderInventory();
    }
}

function editProduct(index) {
    const p = products[index];

    // Fill the form fields with the product data
    document.getElementById("productName").value = p.name;
    document.getElementById("productCategory").value = p.category || "";
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productCostPrice").value = p.cost || 0;
    document.getElementById("productQty").value = p.qty;

    // Optional: Scroll the user to the top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus on the Name field so they can start typing
    document.getElementById("productName").focus();
}

// --- PART 3: AUDIT LOGGING ---

function renderInventoryLog() {
    const list = document.getElementById("inventoryLogList");
    if (!list) return;
    
    // Check if logs exist
    if (typeof inventoryLogs === 'undefined' || inventoryLogs.length === 0) {
        list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">No activity recorded yet.</td></tr>`;
        return;
    }

    const startVal = document.getElementById("logDateStart").value;
    const endVal = document.getElementById("logDateEnd").value;

    let filteredLogs = inventoryLogs.filter(log => {
        // Convert the log's timestamp to a simple YYYY-MM-DD string
        const logDateObj = new Date(log.timestamp);
        const logDateStr = logDateObj.getFullYear() + '-' + 
                           String(logDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(logDateObj.getDate()).padStart(2, '0');
        
        // If start date is picked, check if log is >= start
        if (startVal && logDateStr < startVal) return false;
        
        // If end date is picked, check if log is <= end
        if (endVal && logDateStr > endVal) return false;

        return true;
    });

    if (filteredLogs.length === 0) {
        list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">No logs found for selected dates.</td></tr>`;
        return;
    }

    // Sort logs so newest is at the top
    list.innerHTML = filteredLogs.slice().reverse().map(log => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #666; font-size: 0.8rem;">
                ${new Date(log.timestamp).toLocaleString([], {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
            </td>
            <td style="padding: 10px;"><strong>${log.action}</strong>: ${log.details}</td>
            <td style="padding: 10px;"><span class="user-badge">${log.user}</span></td>
        </tr>
    `).join('');
}

// Add this helper function to clear filters easily
function clearLogFilters() {
    document.getElementById("logDateStart").value = "";
    document.getElementById("logDateEnd").value = "";
    renderInventoryLog();
}

function logActivity(action, details) {
    if (typeof inventoryLogs === 'undefined') window.inventoryLogs = [];
    
    // Get the name of the logged-in user (from login session)
    const currentUser = sessionStorage.getItem("userName") || "System";
    
    inventoryLogs.push({
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        user: currentUser
    });
    
    saveAll(); 
    renderInventoryLog();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    renderInventory();
    renderRawMaterials();
    renderInventoryLog();
});

