// js/admin.js

// 1. AUTOMATIC UNLOCK LOGIC
window.addEventListener("DOMContentLoaded", () => {
    const role = (sessionStorage.getItem("userRole") || "").toLowerCase();

    if (role === "admin") {
        if (document.getElementById("adminGate")) {
            document.getElementById("adminGate").style.display = 'none';
        }
        if (document.getElementById("adminContent")) {
            document.getElementById("adminContent").style.display = 'block';
        }
        
        if (document.getElementById('taxRate')) {
            document.getElementById('taxRate').value = config.taxRate;
            document.getElementById('lowStockThreshold').value = config.lowStockThreshold;
        }
        renderEmployees(); 
    }
});

// 2. UPDATE ADMIN PIN FUNCTION
function setAdminPassword() {
    const newPin = document.getElementById("setAdminPass").value.trim();
    if (newPin.length !== 4) return alert("Please enter a 4-digit PIN.");
    
    const adminUser = employees.find(e => e.id === 1001);
    if (adminUser) {
        adminUser.pin = newPin;
        saveAll();
        renderEmployees();
        alert("Admin PIN updated to: " + newPin);
        document.getElementById("setAdminPass").value = '';
    }
}

// 3. UPDATED ADD EMPLOYEE FUNCTION
function addEmployee() {
    const name = document.getElementById("employeeName").value.trim();
    const pin = document.getElementById("employeePin").value.trim();
    const role = document.getElementById("employeeRole").value; 

    if (!name || pin.length !== 4) return alert("Enter a valid name and 4-digit PIN.");
    if (employees.some(e => e.pin === pin)) return alert("PIN already in use.");

    const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1002;

    employees.push({ id: newId, name: name, pin: pin, role: role });
    
    saveAll();
    renderEmployees();
    
    document.getElementById("employeeName").value = '';
    document.getElementById("employeePin").value = '';
    alert(`Success! ${name} added as ${role}.`);
}

// 4. RENDER LIST
function renderEmployees() {
    const list = document.getElementById("employeeList");
    if (!list) return;
    list.innerHTML = '';

    employees.forEach(emp => {
        const div = document.createElement("div");
        div.className = "employee-item";
        div.style = "display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; align-items: center;";
        div.innerHTML = `
            <span><strong>${emp.name}</strong> (${emp.role || 'employee'})</span>
            <span>PIN: ${emp.pin} 
                <button class="btn" onclick="removeEmployee(${emp.id})" 
                ${emp.id === 1001 ? 'disabled' : ''}>Remove</button>
            </span>
        `;
        list.appendChild(div);
    });
}

function removeEmployee(id) {
    if (id === 1001) return alert("Cannot remove the default Admin.");
    if (confirm("Remove this user?")) {
        employees = employees.filter(e => e.id !== id);
        saveAll();
        renderEmployees();
    }
}

function setSystemConfig() {
    config.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    config.lowStockThreshold = parseInt(document.getElementById('lowStockThreshold').value) || 5;
    saveAll();
    alert("Settings Saved!");
}

function resetSystem() {
    if(confirm("Permanently wipe all data and employees?")) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
    }
}