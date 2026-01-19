// js/login.js
function login() {
  const enteredPin = document.getElementById("adminPassword").value.trim();
  
  // Find user by PIN from the employees array in database.js
  const user = employees.find(e => e.pin === enteredPin);
  
  if (user) {
    sessionStorage.setItem("userLogged", "yes");
    sessionStorage.setItem("userRole", user.role.toLowerCase()); 
    sessionStorage.setItem("userName", user.name);
    sessionStorage.setItem("shiftStart", new Date().toISOString());
    window.location.href = "dashboard.html";
  } else {
    alert("Incorrect PIN. Please try again.");
  }
}

function showRecoveryModal() {
    document.getElementById("recoveryModal").style.display = "flex";
}

function hideRecoveryModal() {
    document.getElementById("recoveryModal").style.display = "none";
}

function verifyRecovery() {
    const masterInput = document.getElementById("recoveryMasterPin").value;
    
    // Check if the input matches the Admin's PIN (ID 1001 from database.js)
    const masterAdmin = employees.find(e => e.id === 1001);
    
    if (masterInput === masterAdmin.pin) {
        // Find the names of users to help identify whose PIN to show
        const userList = employees.map(e => `${e.name}: ${e.pin}`).join('\n');
        alert("Access Granted. Current PINs:\n\n" + userList);
        hideRecoveryModal();
    } else {
        alert("Invalid Master Admin PIN.");
    }
}