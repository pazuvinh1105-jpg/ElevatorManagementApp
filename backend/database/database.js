const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "elevator.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Lỗi kết nối database:", err.message);
    } else {
        console.log("Đã kết nối SQLite thành công.");
    }
});

// Tạo bảng users
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        employeeId TEXT,
        elevatorId TEXT
    )
`);

// Tạo bảng elevators
db.run(`
    CREATE TABLE IF NOT EXISTS elevators (
        elevatorId TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        location TEXT NOT NULL,
        city TEXT NOT NULL,
        manufacturer TEXT,
        installationDate TEXT,
        type TEXT,
        capacity TEXT,
        status TEXT,
        numberOfStops INTEGER,
        speed REAL,
        pitDepth INTEGER,
        overheadHeight INTEGER,
        driveType TEXT
    )
`);

// Tạo bảng inspections
db.run(`
    CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elevatorId TEXT NOT NULL,
        inspectionDate TEXT NOT NULL,
        inspectionUnit TEXT,
        result TEXT,
        description TEXT
    )
`);

// Tạo bảng service_history
db.run(`
    CREATE TABLE IF NOT EXISTS service_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elevatorId TEXT NOT NULL,
        technicianId TEXT,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT
    )
`);

// =====================================================
// BẢNG MASTER CHECKLIST BẢO TRÌ
// =====================================================

db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_checklists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        round INTEGER NOT NULL,
        section TEXT NOT NULL,
        content TEXT NOT NULL
    )
`);

// =====================================================
// BẢNG KẾT QUẢ CHECKLIST CỦA TỪNG LẦN BẢO TRÌ
// =====================================================

db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_checklist_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serviceId INTEGER NOT NULL,
        checklistId INTEGER NOT NULL,
        result TEXT NOT NULL
    )
`);

module.exports = db;