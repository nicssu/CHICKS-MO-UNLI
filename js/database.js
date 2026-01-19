// database.js
let products = JSON.parse(localStorage.getItem("products") || "[]");
let sales = JSON.parse(localStorage.getItem("sales") || "[]");
let rawMaterials = JSON.parse(localStorage.getItem("rawMaterials") || "[]");
let inventoryLogs = JSON.parse(localStorage.getItem("inventoryLogs")) || [];

let config = JSON.parse(localStorage.getItem("config")) || {
    taxRate: 0,
    lowStockThreshold: 5,
    currencySymbol: '₱'
};

let employees = JSON.parse(localStorage.getItem("employees")) || [
    { id: 1001, name: "Admin", pin: "0000", role: "admin" } 
];

function saveAll() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("sales", JSON.stringify(sales));
    localStorage.setItem("config", JSON.stringify(config));
    localStorage.setItem("employees", JSON.stringify(employees));
    localStorage.setItem("rawMaterials", JSON.stringify(rawMaterials));
    localStorage.setItem("inventoryLogs", JSON.stringify(inventoryLogs));
}