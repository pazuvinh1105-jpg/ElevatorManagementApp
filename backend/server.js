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
// =====================================================
// MAINTENANCE CHECKLIST API
// =====================================================

// Lấy checklist theo lần bảo trì
app.get("/maintenance/checklists/:round", authenticateToken, (req, res) => {
    const round = Number(req.params.round);

    // Chỉ chấp nhận lần bảo trì 1, 2 hoặc 3
    if (![1, 2, 3].includes(round)) {
        return res.status(400).json({
            message: "Lần bảo trì không hợp lệ. Chỉ chấp nhận 1, 2 hoặc 3."
        });
    }

    db.all(
        `
        SELECT
            id,
            code,
            round,
            section,
            content
        FROM maintenance_checklists
        WHERE round = 0 OR round = ?
        ORDER BY id ASC
        `,
        [round],
        (err, checklists) => {
            if (err) {
                console.error("Lỗi lấy checklist:", err.message);

                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            res.json({
                round,
                total: checklists.length,
                checklists
            });
        }
    );
});
// =====================================================
// TẠO LẦN BẢO TRÌ + LƯU KẾT QUẢ CHECKLIST
// =====================================================

app.post("/elevators/:elevatorId/maintenance", authenticateToken, (req, res) => {
    // Chỉ Technician mới được tạo phiếu bảo trì
    if (req.user.role !== "technician") {
        return res.status(403).json({
            message: "Chỉ Technician mới được tạo phiếu bảo trì"
        });
    }

    const { elevatorId } = req.params;
    const { round, date, description, results } = req.body;

    // ---------------------------------------------
    // 1. Kiểm tra lần bảo trì
    // ---------------------------------------------
    const maintenanceRound = Number(round);

    if (![1, 2, 3].includes(maintenanceRound)) {
        return res.status(400).json({
            message: "Lần bảo trì không hợp lệ. Chỉ chấp nhận lần 1, 2 hoặc 3."
        });
    }

    // ---------------------------------------------
    // 2. Kiểm tra ngày bảo trì
    // ---------------------------------------------
    if (!date) {
        return res.status(400).json({
            message: "Thiếu ngày bảo trì"
        });
    }

    // ---------------------------------------------
    // 3. Kiểm tra danh sách kết quả
    // ---------------------------------------------
    if (!Array.isArray(results)) {
        return res.status(400).json({
            message: "Danh sách kết quả checklist không hợp lệ"
        });
    }

    // Số checklist cần có:
    // Lần 1 = A + B = 16 + 22 = 38
    // Lần 2 = A + C = 16 + 35 = 51
    // Lần 3 = A + D = 16 + 24 = 40

    const expectedCounts = {
        1: 38,
        2: 51,
        3: 40
    };

    const expectedCount = expectedCounts[maintenanceRound];

    if (results.length !== expectedCount) {
        return res.status(400).json({
            message: `Lần bảo trì ${maintenanceRound} yêu cầu đúng ${expectedCount} checklist`
        });
    }

    // ---------------------------------------------
    // 4. Kiểm tra từng kết quả
    // ---------------------------------------------
    for (const item of results) {
        if (
            !item ||
            item.checklistId === undefined ||
            !["pass", "fail"].includes(item.result)
        ) {
            return res.status(400).json({
                message: "Mỗi checklist phải có checklistId và kết quả pass/fail"
            });
        }
    }

    // ---------------------------------------------
    // 5. Kiểm tra thang máy tồn tại
    // ---------------------------------------------
    db.get(
        "SELECT elevatorId FROM elevators WHERE elevatorId = ?",
        [elevatorId],
        (err, elevator) => {
            if (err) {
                console.error("Lỗi kiểm tra thang máy:", err.message);

                return res.status(500).json({
                    message: "Lỗi database"
                });
            }

            if (!elevator) {
                return res.status(404).json({
                    message: "Không tìm thấy thang máy"
                });
            }

            // ---------------------------------------------
            // 6. Kiểm tra checklist có đúng với lần bảo trì
            // ---------------------------------------------
            const checklistIds = results.map(
                item => Number(item.checklistId)
            );

            // Không cho phép checklist bị trùng
            const uniqueIds = new Set(checklistIds);

            if (uniqueIds.size !== results.length) {
                return res.status(400).json({
                    message: "Danh sách checklist không được chứa ID trùng nhau"
                });
            }

            const placeholders = checklistIds.map(() => "?").join(",");

            db.all(
                `
                SELECT id
                FROM maintenance_checklists
                WHERE id IN (${placeholders})
                  AND (round = 0 OR round = ?)
                `,
                [...checklistIds, maintenanceRound],
                (err, validChecklists) => {
                    if (err) {
                        console.error(
                            "Lỗi kiểm tra checklist:",
                            err.message
                        );

                        return res.status(500).json({
                            message: "Lỗi database"
                        });
                    }

                    if (validChecklists.length !== results.length) {
                        return res.status(400).json({
                            message:
                                "Có checklist không thuộc lần bảo trì đã chọn"
                        });
                    }

                    // ---------------------------------------------
                    // 7. Bắt đầu transaction
                    // ---------------------------------------------
                    db.run("BEGIN TRANSACTION", (err) => {
                        if (err) {
                            console.error(
                                "Lỗi bắt đầu transaction:",
                                err.message
                            );

                            return res.status(500).json({
                                message: "Không thể bắt đầu giao dịch"
                            });
                        }

                        // ---------------------------------------------
                        // 8. Tạo service_history
                        // ---------------------------------------------
                        db.run(
                            `
                            INSERT INTO service_history
                            (elevatorId, technicianId, type, date, description)
                            VALUES (?, ?, ?, ?, ?)
                            `,
                            [
                                elevatorId,
                                req.user.employeeId,
                                "maintenance",
                                date,
                                description || null
                            ],
                            function (err) {
                                if (err) {
                                    return db.run(
                                        "ROLLBACK",
                                        () => {
                                            console.error(
                                                "Lỗi tạo lịch sử bảo trì:",
                                                err.message
                                            );

                                            res.status(500).json({
                                                message: "Lỗi database"
                                            });
                                        }
                                    );
                                }

                                const serviceId = this.lastID;

                                // ---------------------------------------------
                                // 9. Lưu từng kết quả checklist
                                // ---------------------------------------------
                                const insertResult = db.prepare(
                                    `
                                    INSERT INTO maintenance_checklist_results
                                    (serviceId, checklistId, result)
                                    VALUES (?, ?, ?)
                                    `
                                );

                                let hasError = false;

                                for (const item of results) {
                                    insertResult.run(
                                        [
                                            serviceId,
                                            Number(item.checklistId),
                                            item.result
                                        ],
                                        (err) => {
                                            if (err && !hasError) {
                                                hasError = true;

                                                insertResult.finalize(() => {
                                                    db.run(
                                                        "ROLLBACK",
                                                        () => {
                                                            console.error(
                                                                "Lỗi lưu kết quả checklist:",
                                                                err.message
                                                            );

                                                            res.status(500).json({
                                                                message:
                                                                    "Lỗi lưu kết quả checklist"
                                                            });
                                                        }
                                                    );
                                                });
                                            }
                                        }
                                    );
                                }

                                if (hasError) {
                                    return;
                                }

                                insertResult.finalize((err) => {
                                    if (err) {
                                        return db.run(
                                            "ROLLBACK",
                                            () => {
                                                console.error(
                                                    "Lỗi hoàn tất checklist:",
                                                    err.message
                                                );

                                                res.status(500).json({
                                                    message: "Lỗi database"
                                                });
                                            }
                                        );
                                    }

                                    // ---------------------------------------------
                                    // 10. Commit
                                    // ---------------------------------------------
                                    db.run("COMMIT", (err) => {
                                        if (err) {
                                            return db.run(
                                                "ROLLBACK",
                                                () => {
                                                    console.error(
                                                        "Lỗi commit:",
                                                        err.message
                                                    );

                                                    res.status(500).json({
                                                        message:
                                                            "Không thể lưu phiếu bảo trì"
                                                    });
                                                }
                                            );
                                        }

                                        res.status(201).json({
                                            message:
                                                "Đã tạo phiếu bảo trì thành công",
                                            serviceId,
                                            round: maintenanceRound,
                                            total: results.length
                                        });
                                    });
                                });
                            }
                        );
                    });
                }
            );
        }
    );
});
// =====================================================
// LẤY CHI TIẾT MỘT PHIẾU BẢO TRÌ
// =====================================================

app.get(
    "/elevators/:elevatorId/maintenance/:serviceId",
    authenticateToken,
    (req, res) => {
        const { elevatorId, serviceId } = req.params;

        // ---------------------------------------------
        // 1. Lấy thông tin phiếu bảo trì
        // ---------------------------------------------
        db.get(
            `
            SELECT
                sh.id,
                sh.elevatorId,
                sh.technicianId,
                sh.type,
                sh.date,
                sh.description
            FROM service_history sh
            WHERE sh.id = ?
              AND sh.elevatorId = ?
              AND sh.type = 'maintenance'
            `,
            [serviceId, elevatorId],
            (err, service) => {
                if (err) {
                    console.error(
                        "Lỗi lấy phiếu bảo trì:",
                        err.message
                    );

                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!service) {
                    return res.status(404).json({
                        message: "Không tìm thấy phiếu bảo trì"
                    });
                }

                // ---------------------------------------------
                // 2. Lấy danh sách checklist + kết quả
                // ---------------------------------------------
                db.all(
                    `
                    SELECT
                        mc.id AS checklistId,
                        mc.code,
                        mc.round,
                        mc.section,
                        mc.content,
                        mcr.result
                    FROM maintenance_checklist_results mcr
                    JOIN maintenance_checklists mc
                        ON mc.id = mcr.checklistId
                    WHERE mcr.serviceId = ?
                    ORDER BY mc.id ASC
                    `,
                    [serviceId],
                    (err, results) => {
                        if (err) {
                            console.error(
                                "Lỗi lấy kết quả checklist:",
                                err.message
                            );

                            return res.status(500).json({
                                message: "Lỗi database"
                            });
                        }

                        // ---------------------------------------------
                        // 3. Xác định lần bảo trì
                        // ---------------------------------------------
                        const roundItems = results.filter(
                            item => item.round !== 0
                        );

                        let round = null;

                        if (roundItems.length > 0) {
                            round = roundItems[0].round;
                        }

                        // ---------------------------------------------
                        // 4. Trả dữ liệu
                        // ---------------------------------------------
                        res.json({
                            service: {
                                id: service.id,
                                elevatorId: service.elevatorId,
                                technicianId: service.technicianId,
                                type: service.type,
                                date: service.date,
                                description: service.description,
                                round
                            },
                            results
                        });
                    }
                );
            }
        );
    }
);
// =====================================================
// CẬP NHẬT MỘT PHIẾU BẢO TRÌ
// Technician + Admin được phép sửa
// Owner không được phép sửa
// =====================================================

// =====================================================
// CẬP NHẬT MỘT PHIẾU BẢO TRÌ
// Technician + Admin được phép sửa
// Owner không được phép sửa
// =====================================================

app.put(
    "/elevators/:elevatorId/maintenance/:serviceId",
    authenticateToken,
    (req, res) => {
        // -------------------------------------------------
        // 1. Kiểm tra quyền
        // -------------------------------------------------

        if (!["technician", "admin"].includes(req.user.role)) {
            return res.status(403).json({
                message: "Chỉ Technician hoặc Admin được sửa phiếu bảo trì"
            });
        }

        const { elevatorId, serviceId } = req.params;
        const { date, description, results } = req.body;

        // -------------------------------------------------
        // 2. Kiểm tra dữ liệu đầu vào
        // -------------------------------------------------

        if (!date) {
            return res.status(400).json({
                message: "Thiếu ngày bảo trì"
            });
        }

        if (!Array.isArray(results)) {
            return res.status(400).json({
                message: "Danh sách kết quả checklist không hợp lệ"
            });
        }

        if (results.length === 0) {
            return res.status(400).json({
                message: "Phiếu bảo trì phải có checklist"
            });
        }

        // -------------------------------------------------
        // 3. Kiểm tra phiếu bảo trì có tồn tại
        // -------------------------------------------------

        db.get(
            `
            SELECT id
            FROM service_history
            WHERE id = ?
              AND elevatorId = ?
              AND type = 'maintenance'
            `,
            [serviceId, elevatorId],
            (err, service) => {
                if (err) {
                    console.error(
                        "Lỗi kiểm tra phiếu bảo trì:",
                        err.message
                    );

                    return res.status(500).json({
                        message: "Lỗi database"
                    });
                }

                if (!service) {
                    return res.status(404).json({
                        message: "Không tìm thấy phiếu bảo trì"
                    });
                }

                // -------------------------------------------------
                // 4. Kiểm tra checklist hiện tại của phiếu
                //    để xác định Round
                // -------------------------------------------------

                db.all(
                    `
                    SELECT
                        mcr.checklistId,
                        mc.round
                    FROM maintenance_checklist_results mcr
                    JOIN maintenance_checklists mc
                        ON mc.id = mcr.checklistId
                    WHERE mcr.serviceId = ?
                    `,
                    [serviceId],
                    (err, currentResults) => {
                        if (err) {
                            console.error(
                                "Lỗi kiểm tra checklist hiện tại:",
                                err.message
                            );

                            return res.status(500).json({
                                message: "Lỗi database"
                            });
                        }

                        if (!currentResults || currentResults.length === 0) {
                            return res.status(400).json({
                                message:
                                    "Không xác định được Round của phiếu bảo trì"
                            });
                        }

                        // -------------------------------------------------
                        // Tìm Round bảo trì
                        // Round 0 = checklist dùng chung
                        // Round 1/2/3 = checklist riêng của từng vòng
                        // -------------------------------------------------

                        const specificRounds = [
                            ...new Set(
                                currentResults
                                    .map(item => Number(item.round))
                                    .filter(round => round !== 0)
                            )
                        ];

                        if (specificRounds.length !== 1) {
                            return res.status(400).json({
                                message:
                                    "Dữ liệu phiếu bảo trì không xác định được Round hợp lệ"
                            });
                        }

                        const maintenanceRound = specificRounds[0];

                        // -------------------------------------------------
                        // 5. Xác định số checklist bắt buộc
                        // -------------------------------------------------

                        const expectedCounts = {
                            1: 38,
                            2: 51,
                            3: 40
                        };

                        const expectedCount =
                            expectedCounts[maintenanceRound];

                        if (!expectedCount) {
                            return res.status(400).json({
                                message:
                                    "Round bảo trì không hợp lệ"
                            });
                        }

                        // -------------------------------------------------
                        // 6. Kiểm tra số lượng checklist gửi lên
                        // -------------------------------------------------

                        if (results.length !== expectedCount) {
                            return res.status(400).json({
                                message:
                                    `Round ${maintenanceRound} phải có đúng ${expectedCount} checklist`
                            });
                        }

                        // -------------------------------------------------
                        // 7. Kiểm tra từng checklist
                        // -------------------------------------------------

                        for (const item of results) {
                            const checklistId = Number(
                                item?.checklistId
                            );

                            if (
                                !Number.isInteger(checklistId) ||
                                checklistId <= 0 ||
                                !["pass", "fail"].includes(item?.result)
                            ) {
                                return res.status(400).json({
                                    message:
                                        "Mỗi checklist phải có checklistId hợp lệ và kết quả pass/fail"
                                });
                            }
                        }

                        // -------------------------------------------------
                        // 8. Kiểm tra checklist không bị trùng
                        // -------------------------------------------------

                        const checklistIds = results.map(item =>
                            Number(item.checklistId)
                        );

                        const uniqueIds = new Set(checklistIds);

                        if (uniqueIds.size !== results.length) {
                            return res.status(400).json({
                                message:
                                    "Danh sách checklist không được chứa ID trùng nhau"
                            });
                        }

                        // -------------------------------------------------
                        // 9. Lấy toàn bộ checklist bắt buộc của Round
                        //    Bao gồm:
                        //    - Round 0: checklist dùng chung
                        //    - Round hiện tại: checklist riêng
                        // -------------------------------------------------

                        db.all(
                            `
                            SELECT id
                            FROM maintenance_checklists
                            WHERE round = 0
                               OR round = ?
                            ORDER BY id
                            `,
                            [maintenanceRound],
                            (err, expectedChecklists) => {
                                if (err) {
                                    console.error(
                                        "Lỗi lấy checklist bắt buộc:",
                                        err.message
                                    );

                                    return res.status(500).json({
                                        message: "Lỗi database"
                                    });
                                }

                                // -------------------------------------------------
                                // 10. Kiểm tra database có đúng số checklist
                                //     cho Round hay không
                                // -------------------------------------------------

                                if (
                                    expectedChecklists.length !==
                                    expectedCount
                                ) {
                                    return res.status(500).json({
                                        message:
                                            `Cấu hình checklist Round ${maintenanceRound} không hợp lệ`
                                    });
                                }

                                // -------------------------------------------------
                                // 11. Tạo Set checklist bắt buộc
                                // -------------------------------------------------

                                const expectedChecklistIds =
                                    new Set(
                                        expectedChecklists.map(
                                            item => Number(item.id)
                                        )
                                    );

                                // -------------------------------------------------
                                // 12. Kiểm tra submitted checklist có đúng
                                //     toàn bộ bộ checklist hay không
                                // -------------------------------------------------

                                for (const checklistId of checklistIds) {
                                    if (
                                        !expectedChecklistIds.has(
                                            checklistId
                                        )
                                    ) {
                                        return res.status(400).json({
                                            message:
                                                `Checklist ID ${checklistId} không thuộc Round ${maintenanceRound}`
                                        });
                                    }
                                }

                                // -------------------------------------------------
                                // 13. Kiểm tra có thiếu checklist hay không
                                // -------------------------------------------------

                                for (const expectedId of expectedChecklistIds) {
                                    if (!uniqueIds.has(expectedId)) {
                                        return res.status(400).json({
                                            message:
                                                `Thiếu checklist ID ${expectedId} của Round ${maintenanceRound}`
                                        });
                                    }
                                }

                                // -------------------------------------------------
                                // 14. Bắt đầu transaction
                                // -------------------------------------------------

                                db.run(
                                    "BEGIN TRANSACTION",
                                    err => {
                                        if (err) {
                                            console.error(
                                                "Lỗi bắt đầu transaction:",
                                                err.message
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Không thể bắt đầu giao dịch"
                                            });
                                        }

                                        // -------------------------------------------------
                                        // 15. Cập nhật thông tin phiếu
                                        // -------------------------------------------------

                                        db.run(
                                            `
                                            UPDATE service_history
                                            SET date = ?,
                                                description = ?
                                            WHERE id = ?
                                              AND elevatorId = ?
                                              AND type = 'maintenance'
                                            `,
                                            [
                                                date,
                                                description || null,
                                                serviceId,
                                                elevatorId
                                            ],
                                            function (err) {
                                                if (err) {
                                                    return db.run(
                                                        "ROLLBACK",
                                                        () => {
                                                            console.error(
                                                                "Lỗi cập nhật phiếu:",
                                                                err.message
                                                            );

                                                            res.status(500).json({
                                                                message:
                                                                    "Lỗi database"
                                                            });
                                                        }
                                                    );
                                                }

                                                // -------------------------------------------------
                                                // 16. Xóa kết quả checklist cũ
                                                // -------------------------------------------------

                                                db.run(
                                                    `
                                                    DELETE FROM maintenance_checklist_results
                                                    WHERE serviceId = ?
                                                    `,
                                                    [serviceId],
                                                    err => {
                                                        if (err) {
                                                            return db.run(
                                                                "ROLLBACK",
                                                                () => {
                                                                    console.error(
                                                                        "Lỗi xóa kết quả checklist cũ:",
                                                                        err.message
                                                                    );

                                                                    res.status(500).json({
                                                                        message:
                                                                            "Lỗi database"
                                                                    });
                                                                }
                                                            );
                                                        }

                                                        // -------------------------------------------------
                                                        // 17. Thêm lại toàn bộ checklist mới
                                                        // -------------------------------------------------

                                                        const insertResult =
                                                            db.prepare(
                                                                `
                                                                INSERT INTO maintenance_checklist_results
                                                                (serviceId, checklistId, result)
                                                                VALUES (?, ?, ?)
                                                                `
                                                            );

                                                        let hasError = false;

                                                        for (const item of results) {
                                                            insertResult.run(
                                                                [
                                                                    serviceId,
                                                                    Number(
                                                                        item.checklistId
                                                                    ),
                                                                    item.result
                                                                ],
                                                                err => {
                                                                    if (
                                                                        err &&
                                                                        !hasError
                                                                    ) {
                                                                        hasError = true;

                                                                        insertResult.finalize(
                                                                            () => {
                                                                                db.run(
                                                                                    "ROLLBACK",
                                                                                    () => {
                                                                                        console.error(
                                                                                            "Lỗi lưu checklist mới:",
                                                                                            err.message
                                                                                        );

                                                                                        res.status(
                                                                                            500
                                                                                        ).json({
                                                                                            message:
                                                                                                "Lỗi lưu kết quả checklist"
                                                                                        });
                                                                                    }
                                                                                );
                                                                            }
                                                                        );
                                                                    }
                                                                }
                                                            );
                                                        }

                                                        if (hasError) {
                                                            return;
                                                        }

                                                        // -------------------------------------------------
                                                        // 18. Hoàn tất INSERT
                                                        // -------------------------------------------------

                                                        insertResult.finalize(
                                                            err => {
                                                                if (err) {
                                                                    return db.run(
                                                                        "ROLLBACK",
                                                                        () => {
                                                                            console.error(
                                                                                "Lỗi hoàn tất checklist:",
                                                                                err.message
                                                                            );

                                                                            res.status(
                                                                                500
                                                                            ).json({
                                                                                message:
                                                                                    "Lỗi database"
                                                                            });
                                                                        }
                                                                    );
                                                                }

                                                                // -------------------------------------------------
                                                                // 19. COMMIT
                                                                // -------------------------------------------------

                                                                db.run(
                                                                    "COMMIT",
                                                                    err => {
                                                                        if (err) {
                                                                            return db.run(
                                                                                "ROLLBACK",
                                                                                () => {
                                                                                    console.error(
                                                                                        "Lỗi commit:",
                                                                                        err.message
                                                                                    );

                                                                                    res.status(
                                                                                        500
                                                                                    ).json({
                                                                                        message:
                                                                                            "Không thể lưu thay đổi"
                                                                                    });
                                                                                }
                                                                            );
                                                                        }

                                                                        // -------------------------------------------------
                                                                        // 20. Thành công
                                                                        // -------------------------------------------------

                                                                        res.json({
                                                                            message:
                                                                                "Đã cập nhật phiếu bảo trì thành công",
                                                                            serviceId:
                                                                                Number(
                                                                                    serviceId
                                                                                ),
                                                                            round:
                                                                                maintenanceRound,
                                                                            total:
                                                                                results.length
                                                                        });
                                                                    }
                                                                );
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);
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