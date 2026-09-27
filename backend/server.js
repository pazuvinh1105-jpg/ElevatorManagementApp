const express = require("express");
const db = require("./database/database");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./middleware/auth");
const JWT_SECRET = "elevator-management-secret";
const app = express();
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "Elevator Management API đang hoạt động"
    });
});
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get(
        "SELECT id, username, role, employeeId, elevatorId FROM users WHERE username = ? AND password = ?",
        [username, password],
        (err, user) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Sai tài khoản hoặc mật khẩu"
                });
            }

            const token = jwt.sign(
              {
                   id: user.id,
                   username: user.username,
                   role: user.role,
                   employeeId: user.employeeId,
                   elevatorId: user.elevatorId
              },
              JWT_SECRET,
               {
                 expiresIn: "2h"
                }
            );

             res.json({
                 message: "Đăng nhập thành công",
                 token: token,
                 user: user
            });
        }
    );
});
app.post("/users", (req, res) => {
    const {
        username,
        password,
        role,
        employeeId,
        elevatorId
    } = req.body;

    db.run(
        `INSERT INTO users
        (
            username,
            password,
            role,
            employeeId,
            elevatorId
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            username,
            password,
            role,
            employeeId || null,
            elevatorId || null
        ],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({
                        message: "Username đã tồn tại"
                    });
                }

                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.status(201).json({
                message: "Đã tạo tài khoản",
                id: this.lastID
            });
        }
    );
});
app.get("/elevators", authenticateToken, (req, res) => {
    if (req.user.role === "owner") {
                db.get(
            "SELECT * FROM elevators WHERE elevatorId = ?",
            [req.user.elevatorId],
            (err, elevator) => {
                if (err) {
                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!elevator) {
                    return res.status(404).json({
                        message: "Không tìm thấy thang máy"
                    });
                }

                res.json([elevator]);
            }
        );

        return;
    }
    db.all(
        "SELECT * FROM elevators",
        (err, elevators) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.json(elevators);
        }
    );
});
app.get("/elevators/:elevatorId", (req, res) => {
    const { elevatorId } = req.params;

    db.get(
        "SELECT * FROM elevators WHERE elevatorId = ?",
        [elevatorId],
        (err, elevator) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            if (!elevator) {
                return res.status(404).json({
                    message: "Không tìm thấy thang máy"
                });
            }

            res.json(elevator);
        }
    );
});
app.get("/elevators/:elevatorId/inspections", authenticateToken, (req, res) => {
    const { elevatorId } = req.params;

    db.all(
        "SELECT * FROM inspections WHERE elevatorId = ? ORDER BY inspectionDate DESC",
        [elevatorId],
        (err, inspections) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.json(inspections);
        }
    );
});
app.post("/elevators/:elevatorId/inspections", authenticateToken, (req, res) => {
    if (req.user.role !== "technician") {
        return res.status(403).json({
            message: "Chỉ Technician mới được thêm lần kiểm định"
        });
    }
    const { elevatorId } = req.params;
    const {
        inspectionDate,
        inspectionUnit,
        result,
        description
    } = req.body;

    db.run(
        `INSERT INTO inspections
        (
            elevatorId,
            inspectionDate,
            inspectionUnit,
            result,
            description
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            elevatorId,
            inspectionDate,
            inspectionUnit,
            result,
            description
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.status(201).json({
                message: "Đã thêm lần kiểm định",
                id: this.lastID
            });
        }
    );
});
app.get("/elevators/:elevatorId/services", authenticateToken, (req, res) => {
    const { elevatorId } = req.params;

    db.all(
        "SELECT * FROM service_history WHERE elevatorId = ? ORDER BY date DESC",
        [elevatorId],
        (err, services) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.json(services);
        }
    );
});
app.post("/elevators/:elevatorId/services", authenticateToken, (req, res) => {
    if (req.user.role !== "technician") {
        return res.status(403).json({
            message: "Chỉ Technician mới được thêm lịch sử dịch vụ"
        });
    }
    const { elevatorId } = req.params;
    const { type, date, description } = req.body;

    db.run(
        `INSERT INTO service_history
        (elevatorId, technicianId, type, date, description)
        VALUES (?, ?, ?, ?, ?)`,
        [elevatorId, req.user.employeeId , type, date, description],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.status(201).json({
                message: "Đã thêm lịch sử dịch vụ",
                id: this.lastID
            });
        }
    );
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});