// FULL REPLACEMENT for js/sales.js

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("startDatePicker").value = today;
    document.getElementById("endDatePicker").value = today;
    renderFullDashboard();
});

let currentDayExpenses = []; // Local array for the current session

function renderFullDashboard() {
    const startVal = document.getElementById("startDatePicker").value;
    const endVal = document.getElementById("endDatePicker").value;
    if (!startVal || !endVal) return;

    let startDate, endDate;

    // --- SHIFT LOGIC START ---
    // Identify if the user is viewing "Today"
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = (startVal === todayStr && endVal === todayStr);

    if (isToday) {
        // Retrieve the login timestamp we saved in login.js
        const shiftStart = sessionStorage.getItem("shiftStart");
        
        // If they logged in at 9 PM, the report starts at 9 PM.
        // Failsafe: if no session found, default to 12:00 AM today.
        startDate = shiftStart ? new Date(shiftStart) : new Date(startVal);
        if (!shiftStart) startDate.setHours(0, 0, 0, 0);

        // End date is "Now" to catch the very last sale made.
        endDate = new Date(); 
    } else {
        // Standard historical lookup (Full Calendar Day)
        startDate = new Date(startVal);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(endVal);
        endDate.setHours(23, 59, 59, 999);
    }
    // --- SHIFT LOGIC END ---

    const label = document.getElementById("selectedDateLabel");
    label.innerText = (startVal === endVal) 
        ? startDate.toLocaleString() 
        : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Filter using the dynamic startDate
    const filteredSales = sales.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= startDate && sDate <= endDate;
    });

    let totalRev = 0, totalProf = 0, totalTax = 0, itemCounts = {};
    let totalCash = 0, totalEWallet = 0; 

    filteredSales.forEach(s => {
        const saleAmt = parseFloat(s.total) || 0;
        totalRev += saleAmt;
        totalProf += parseFloat(s.profit) || 0;
        totalTax += parseFloat(s.tax) || 0; 
        
        if (s.paymentMethod === "E-Wallet") {
            totalEWallet += saleAmt;
        } else {
            totalCash += saleAmt;
        }

        s.items.forEach(item => {
            const qty = item.count || item.qty || 0;
            itemCounts[item.name] = (itemCounts[item.name] || 0) + qty;
        });
    });

    let totalExpensesSum = 0;
    currentDayExpenses.forEach(exp => {
        totalExpensesSum += parseFloat(exp.amt) || 0;
    });

    // Update Top Summary Boxes
    document.getElementById("boxDailyTotal").innerText = "₱" + totalRev.toFixed(2);
    document.getElementById("boxDailyProfit").innerText = "₱" + totalProf.toFixed(2);
    document.getElementById("boxTotalCash").innerText = "₱" + totalCash.toFixed(2);
    document.getElementById("boxTotalEWallet").innerText = "₱" + totalEWallet.toFixed(2);

    // Update Audit Table rows
    document.getElementById("auditTotalCash").innerText = "₱" + totalCash.toFixed(2);
    document.getElementById("auditTotalEWallet").innerText = "₱" + totalEWallet.toFixed(2);

    // Call your supporting UI functions
    updateTopSellersList(itemCounts);
    updateHistoryTable(filteredSales);
    calculateReconciliation(); 
}

// EXPENSE BREAKDOWN LOGIC
function addExpenseItem() {
    const desc = document.getElementById("expDesc").value;
    const amt = parseFloat(document.getElementById("expAmt").value);
    
    if (desc && amt > 0) {
        currentDayExpenses.push({ desc, amt });
        document.getElementById("expDesc").value = '';
        document.getElementById("expAmt").value = '';
        renderExpenses();
    } else {
        alert("Please enter both description and amount.");
    }
}

function removeExpense(idx) {
    currentDayExpenses.splice(idx, 1);
    renderExpenses();
}

function renderExpenses() {
    const body = document.getElementById("expenseListBody");
    body.innerHTML = currentDayExpenses.map((ex, idx) => `
        <tr style="border-bottom: 1px solid #f9f9f9;">
            <td style="padding: 8px 5px;">${ex.desc}</td>
            <td style="padding: 8px 5px; text-align: right;">₱${ex.amt.toFixed(2)}</td>
            <td style="padding: 8px 5px; text-align: center;">
                <button onclick="removeExpense(${idx})" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold;">&times;</button>
            </td>
        </tr>
    `).join('');
    calculateReconciliation();
}

// RECONCILIATION MATH
function calculateReconciliation() {
    // 1. Get current values from the dashboard
    const gross = parseFloat(document.getElementById("boxDailyTotal").innerText.replace('₱','')) || 0;
    const totalEWallet = parseFloat(document.getElementById("boxTotalEWallet").innerText.replace('₱','')) || 0;
    const starting = parseFloat(document.getElementById("inputStartingCash").value) || 0;
    const actualCashInHand = parseFloat(document.getElementById("inputActualCash").value) || 0;

    // 2. Build the Expense list and calculate total expenses
    const auditExpenseBody = document.getElementById("auditExpenseRows");
    auditExpenseBody.innerHTML = "";
    let totalExpensesSum = 0;

    if (currentDayExpenses.length === 0) {
        auditExpenseBody.innerHTML = `<tr><td class="label">Less: Daily Expenses</td><td class="value">- ₱0.00</td></tr>`;
    } else {
        currentDayExpenses.forEach(item => {
            totalExpensesSum += item.amt;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="label" style="padding-left: 25px; color: #d32f2f; font-size: 0.85rem;">Less: ${item.desc}</td>
                <td class="value" style="font-size: 0.85rem; color: #d32f2f;">- ₱${item.amt.toFixed(2)}</td>`;
            auditExpenseBody.appendChild(row);
        });
    }

    // --- THE NEW FORMULA ---
    // Expected Cash = (Gross Sales - E-Wallet) - Expenses + Starting Float
    const expectedPhysicalCash = (gross - totalEWallet) - totalExpensesSum + starting;
    
    // Discrepancy = What you actually have vs What the math says you should have
    const variance = actualCashInHand - expectedPhysicalCash;

    // 3. Update UI
    document.getElementById("calcGross").innerText = "₱" + gross.toFixed(2);
    document.getElementById("calcExpected").innerText = "₱" + expectedPhysicalCash.toFixed(2);
    
    const varEl = document.getElementById("calcVariance");
    if (variance === 0) {
        varEl.innerText = "₱0.00 (Balanced)";
        varEl.style.color = "#2e7d32";
    } else {
        const status = variance > 0 ? " (Over)" : " (Short)";
        varEl.innerText = (variance >= 0 ? "₱" : "- ₱") + Math.abs(variance).toFixed(2) + status;
        varEl.style.color = variance < 0 ? "#d32f2f" : "#ff9800";
    }
}


// TRANSACTION LOG & VOID
// TRANSACTION LOG & VOID
function updateHistoryTable(filteredData) {
    const tbody = document.getElementById("salesHistory");
    if (!tbody) return;

    const displayData = [...filteredData].reverse();
    
    tbody.innerHTML = displayData.map(s => {
        // Format the items list
        const itemsSummary = s.items ? s.items.map(item => 
            `${item.count || item.qty}x ${item.name}`
        ).join(", ") : "No details";

        // --- UPDATED DATE & TIME FORMAT ---
        const dateObj = new Date(s.date);
        const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <tr style="border-bottom: 1px solid #f2f2f2;">
                <td style="padding: 12px 5px; font-size: 0.8rem; color:#666;">
                    <div style="font-weight: bold; color: #333;">
                        ${formattedDate}, ${formattedTime}
                    </div>
                    <small>By: ${s.cashier || 'System'}</small>
                </td>
                
                <td style="padding: 12px 5px; font-size: 0.85rem;">
                    <div style="max-width: 180px; color: #444; line-height: 1.2;">
                        ${itemsSummary}
                    </div>
                </td>

                <td style="padding: 12px 5px; text-align: right;">
                    <div style="font-weight: bold; color: var(--primary-color);">₱${parseFloat(s.total).toFixed(2)}</div>
                    <button onclick="voidTransaction(${s.id})" style="font-size: 10px; color: red; border: 1px solid red; background:transparent; padding: 2px 5px; border-radius: 4px; cursor: pointer; margin-top: 4px;">Void</button>
                </td>

                <td style="padding: 12px 5px; text-align: center;">
                    <span style="font-size: 0.75rem; background: #f0f0f0; padding: 3px 8px; border-radius: 12px; border: 1px solid #ddd; white-space: nowrap;">
                        ${s.paymentMethod === 'E-Wallet' ? '📱 E-Wallet' : '💵 Cash'}
                    </span>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px;">No records.</td></tr>';
}

function voidTransaction(id) {
    if (!confirm("Are you sure you want to VOID this receipt? Items will be returned to inventory stock.")) return;

    const saleIndex = sales.findIndex(s => s.id === id);
    if (saleIndex > -1) {
        const sale = sales[saleIndex];

        // Return items to stock
        sale.items.forEach(item => {
            const product = products.find(p => p.id == (item.id || item.productId));
            if (product) {
                product.qty += (item.count || item.qty);
            }
        });

        sales.splice(saleIndex, 1);
        saveAll();
        renderFullDashboard();
        alert("Transaction Voided Successfully!");
    }
}

// HELPER FUNCTIONS
function updateTopSellersList(counts) {
    const container = document.getElementById("topSellers");
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    container.innerHTML = sorted.map(([name, qty]) => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span>${name}</span><strong>${qty} sold</strong>
        </div>`).join('') || '<p style="color:#999; text-align:center;">No data.</p>';
}

function setQuickDate(range) {
    const startInput = document.getElementById("startDatePicker");
    const endInput = document.getElementById("endDatePicker");
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
    } else if (range === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    startInput.value = start.toISOString().split('T')[0];
    endInput.value = end.toISOString().split('T')[0];
    renderFullDashboard();
}

function printSection(sectionName) {
    // 1. Add the specific class (printing-audit or printing-log)
    const className = sectionName === 'audit' ? 'printing-audit' : 'printing-log';
    document.body.classList.add(className);

    // 2. Trigger the print dialog
    window.print();

    // 3. Remove the class after the print dialog closes so the screen goes back to normal
    document.body.classList.remove(className);
}
