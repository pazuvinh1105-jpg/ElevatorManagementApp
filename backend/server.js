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
const requireAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Chỉ Admin được thực hiện thao tác này"
        });
    }

    next();
};

app.get("/users", authenticateToken, requireAdmin, (req, res) => {
    db.all(
        "SELECT id, username, role, employeeId, elevatorId FROM users ORDER BY id DESC",
        (err, users) => {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.json(users);
        }
    );
});

app.post("/users", authenticateToken, requireAdmin, (req, res) => {
    const {
        username,
        password,
        role,
        employeeId,
        elevatorId
    } = req.body;

    if (
        !username?.trim() ||
        !password ||
        !["technician", "owner"].includes(role) ||
        (role === "technician" && !employeeId?.trim()) ||
        (role === "owner" && !elevatorId?.trim())
    ) {
        return res.status(400).json({
            message: "Thông tin tài khoản không hợp lệ"
        });
    }

    const createUser = () => {
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
                username.trim(),
                password,
                role,
                role === "technician" ? employeeId.trim() : null,
                role === "owner" ? elevatorId.trim() : null
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
    };

    if (role === "owner") {
        db.get(
            "SELECT elevatorId FROM elevators WHERE elevatorId = ?",
            [elevatorId.trim()],
            (err, elevator) => {
                if (err) {
                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!elevator) {
                    return res.status(400).json({
                        message: "Thang máy không tồn tại"
                    });
                }

                createUser();
            }
        );
    } else {
        createUser();
    }
});

app.patch("/users/:id", authenticateToken, requireAdmin, (req, res) => {
    const {
        role,
        employeeId,
        elevatorId
    } = req.body;

    if (
        !["technician", "owner"].includes(role) ||
        (role === "technician" && !employeeId?.trim()) ||
        (role === "owner" && !elevatorId?.trim())
    ) {
        return res.status(400).json({
            message: "Thông tin phân quyền không hợp lệ"
        });
    }

    const update = () => {
        db.run(
            `UPDATE users
             SET role = ?, employeeId = ?, elevatorId = ?
             WHERE id = ? AND role != 'admin'`,
            [
                role,
                role === "technician" ? employeeId.trim() : null,
                role === "owner" ? elevatorId.trim() : null,
                req.params.id
            ],
            function (err) {
                if (err) {
                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!this.changes) {
                    return res.status(404).json({
                        message: "Không tìm thấy tài khoản có thể phân quyền"
                    });
                }

                res.json({
                    message: "Đã cập nhật phân quyền"
                });
            }
        );
    };

    if (role === "owner") {
        db.get(
            "SELECT elevatorId FROM elevators WHERE elevatorId = ?",
            [elevatorId.trim()],
            (err, elevator) => {
                if (err) {
                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!elevator) {
                    return res.status(400).json({
                        message: "Thang máy không tồn tại"
                    });
                }

                update();
            }
        );
    } else {
        update();
    }
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
const elevatorFields = [
    "elevatorId",
    "owner",
    "location",
    "city",
    "manufacturer",
    "installationDate",
    "type",
    "capacity",
    "status",
    "numberOfStops",
    "speed",
    "pitDepth",
    "overheadHeight",
    "driveType"
];

const elevatorValues = body =>
    elevatorFields.map(field => {
        const value = body[field];
        return value === "" || value === undefined ? null : value;
    });

app.post("/elevators", authenticateToken, requireAdmin, (req, res) => {
    if (
        !["elevatorId", "owner", "location", "city"].every(field =>
            String(req.body[field] || "").trim()
        )
    ) {
        return res.status(400).json({
            message: "Vui lòng nhập mã, chủ sở hữu, địa điểm và thành phố"
        });
    }

    db.run(
        `INSERT INTO elevators (${elevatorFields.join(", ")})
         VALUES (${elevatorFields.map(() => "?").join(", ")})`,
        elevatorValues(req.body),
        function (err) {
            if (err?.message.includes("UNIQUE")) {
                return res.status(400).json({
                    message: "Mã thang máy đã tồn tại"
                });
            }

            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.status(201).json({
                message: "Đã thêm thang máy"
            });
        }
    );
});

app.put("/elevators/:elevatorId", authenticateToken, requireAdmin, (req, res) => {
    if (
        !["owner", "location", "city"].every(field =>
            String(req.body[field] || "").trim()
        )
    ) {
        return res.status(400).json({
            message: "Vui lòng nhập chủ sở hữu, địa điểm và thành phố"
        });
    }

    const editableFields = elevatorFields.slice(1);

    db.run(
        `UPDATE elevators
         SET ${editableFields.map(field => `${field} = ?`).join(", ")}
         WHERE elevatorId = ?`,
        [
            ...elevatorValues(req.body).slice(1),
            req.params.elevatorId
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            if (!this.changes) {
                return res.status(404).json({
                    message: "Không tìm thấy thang máy"
                });
            }

            res.json({
                message: "Đã cập nhật thang máy"
            });
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