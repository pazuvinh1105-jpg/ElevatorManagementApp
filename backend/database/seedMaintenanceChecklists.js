const db = require("./database");

const checklists = [
    // =====================================================
    // A - PHẦN CHUNG
    // =====================================================
    {
        code: "A01",
        round: 0,
        section: "A",
        content: "Thang chạy không có tiếng động bất thường."
    },
    {
        code: "A02",
        round: 0,
        section: "A",
        content: "Tốc độ, dừng tầng, chuyển tốc."
    },
    {
        code: "A03",
        round: 0,
        section: "A",
        content: "Mức cân bằng giữa sàn cabin và sàn cửa tầng khi thang về tầng."
    },
    {
        code: "A04",
        round: 0,
        section: "A",
        content: "Trạng thái đóng, mở cửa tầng."
    },
    {
        code: "A05",
        round: 0,
        section: "A",
        content: "Trạng thái đóng, mở cửa cabin."
    },
    {
        code: "A06",
        round: 0,
        section: "A",
        content: "Chế độ cứu hộ tự động khi thang mất điện."
    },
    {
        code: "A07",
        round: 0,
        section: "A",
        content: "Cứu hộ mở phanh tay (thang không phòng máy)."
    },
    {
        code: "A08",
        round: 0,
        section: "A",
        content: "Hệ thống chuông báo, điện thoại nội bộ."
    },
    {
        code: "A09",
        round: 0,
        section: "A",
        content: "Chức năng EMCALL."
    },
    {
        code: "A10",
        round: 0,
        section: "A",
        content: "Bôi dầu ray dẫn hướng."
    },
    {
        code: "A11",
        round: 0,
        section: "A",
        content: "Giới hạn hành trình khi thang vượt quá tầng trên cùng và dưới cùng."
    },
    {
        code: "A12",
        round: 0,
        section: "A",
        content: "Điện áp, nguồn cấp cho thang."
    },
    {
        code: "A13",
        round: 0,
        section: "A",
        content: "Cảm biến hồng ngoại, công tắc chống kẹt cửa an toàn khi ra vào thang."
    },
    {
        code: "A14",
        round: 0,
        section: "A",
        content: "Các khoảng cách an toàn của cabin với cửa tầng, đối trọng, khung vách hố thang."
    },
    {
        code: "A15",
        round: 0,
        section: "A",
        content: "Hành trình cáp kéo, xích bù tải, bộ hạn chế tốc độ."
    },
    {
        code: "A16",
        round: 0,
        section: "A",
        content: "Bảng gọi trong cabin và ngoài cửa tầng."
    },

    // =====================================================
    // B - BẢO TRÌ LẦN 1
    // =====================================================
    {
        code: "B01",
        round: 1,
        section: "B",
        content: "Điện áp nguồn vào, dây cấp nguồn, các thiết bị đóng ngắt, cầu đấu, điện áp rò."
    },
    {
        code: "B02",
        round: 1,
        section: "B",
        content: "Ắc quy, tủ cứu hộ tự động khi mất điện."
    },
    {
        code: "B03",
        round: 1,
        section: "B",
        content: "Ắc quy, bộ lưu điện mở phanh (thang không phòng máy)."
    },
    {
        code: "B04",
        round: 1,
        section: "B",
        content: "Tay kéo phanh mở tay (thang không phòng máy)."
    },
    {
        code: "B05",
        round: 1,
        section: "B",
        content: "Hệ thống các cầu đấu, giắc cắm, dây điện trong tủ cứu hộ và tủ điều khiển."
    },
    {
        code: "B06",
        round: 1,
        section: "B",
        content: "Các thiết bị điều khiển: bo mạch chính, bo mạch kết nối, biến tần."
    },
    {
        code: "B07",
        round: 1,
        section: "B",
        content: "Các thiết bị mạch nguồn: Máy biến áp, bộ chuyển đổi nguồn."
    },
    {
        code: "B08",
        round: 1,
        section: "B",
        content: "Thiết bị trung gian: Cầu đấu, contactor, role."
    },
    {
        code: "B09",
        round: 1,
        section: "B",
        content: "Các thiết bị bảo vệ: Aptomat, điện trở xả, cầu chì, role nhiệt."
    },
    {
        code: "B10",
        round: 1,
        section: "B",
        content: "Quạt thông gió biến tần - tủ điện."
    },
    {
        code: "B11",
        round: 1,
        section: "B",
        content: "Hệ thống bệ máy, cao su đỡ bệ máy."
    },
    {
        code: "B12",
        round: 1,
        section: "B",
        content: "Động cơ kéo."
    },
    {
        code: "B13",
        round: 1,
        section: "B",
        content: "Bộ cứu hộ điện bằng tay."
    },
    {
        code: "B14",
        round: 1,
        section: "B",
        content: "Tay mở phanh cơ và vô lăng quay động cơ."
    },
    {
        code: "B15",
        round: 1,
        section: "B",
        content: "Hệ thống phanh của động cơ."
    },
    {
        code: "B16",
        round: 1,
        section: "B",
        content: "Hộp số và dầu hộp số."
    },
    {
        code: "B17",
        round: 1,
        section: "B",
        content: "Cổ trục hộp số - động cơ."
    },
    {
        code: "B18",
        round: 1,
        section: "B",
        content: "Đo tốc độ vòng quay động cơ (Encoder)."
    },
    {
        code: "B19",
        round: 1,
        section: "B",
        content: "Puli chính."
    },
    {
        code: "B20",
        round: 1,
        section: "B",
        content: "Puli dẫn động."
    },
    {
        code: "B21",
        round: 1,
        section: "B",
        content: "Bộ hạn chế tốc độ (Governor)."
    },
    {
        code: "B22",
        round: 1,
        section: "B",
        content: "Khóa cửa phòng máy (thang có phòng máy)."
    },

    // =====================================================
    // C - BẢO TRÌ LẦN 2
    // =====================================================
    {
        code: "C01",
        round: 2,
        section: "C",
        content: "Hộp domino, các thiết bị trong hộp domino, tiếp địa, cách điện trên cabin."
    },
    {
        code: "C02",
        round: 2,
        section: "C",
        content: "Màn hình, nút bấm và giắc cắm bảng gọi trong cabin."
    },
    {
        code: "C03",
        round: 2,
        section: "C",
        content: "Màn hình, nút bấm và giắc cắm bảng gọi ngoài cửa tầng."
    },
    {
        code: "C04",
        round: 2,
        section: "C",
        content: "Giá treo cửa cabin."
    },
    {
        code: "C05",
        round: 2,
        section: "C",
        content: "Ray dẫn hướng cánh cửa cabin."
    },
    {
        code: "C06",
        round: 2,
        section: "C",
        content: "Tiếp điểm điện cửa cabin."
    },
    {
        code: "C07",
        round: 2,
        section: "C",
        content: "Con lăn dẫn hướng, bánh xe xuyên tâm cánh cửa cabin."
    },
    {
        code: "C08",
        round: 2,
        section: "C",
        content: "Kiếm cửa cabin."
    },
    {
        code: "C09",
        round: 2,
        section: "C",
        content: "Shoe dẫn hướng cánh cửa cabin."
    },
    {
        code: "C10",
        round: 2,
        section: "C",
        content: "Sill cửa cabin."
    },
    {
        code: "C11",
        round: 2,
        section: "C",
        content: "Cánh cửa cabin."
    },
    {
        code: "C12",
        round: 2,
        section: "C",
        content: "Cảm biến cửa cabin."
    },
    {
        code: "C13",
        round: 2,
        section: "C",
        content: "Bộ điều khiển, động cơ cửa cabin."
    },
    {
        code: "C14",
        round: 2,
        section: "C",
        content: "Dây cáp, dây curoa kéo động cơ cửa và cánh cửa."
    },
    {
        code: "C15",
        round: 2,
        section: "C",
        content: "Khung, vách cabin."
    },
    {
        code: "C16",
        round: 2,
        section: "C",
        content: "Các công tắc chuyển tốc và hạn chế hành trình."
    },
    {
        code: "C17",
        round: 2,
        section: "C",
        content: "Cảm biến nhận biết tầng và cờ bằng tầng."
    },
    {
        code: "C18",
        round: 2,
        section: "C",
        content: "Bộ shoe dẫn hướng của cabin."
    },
    {
        code: "C19",
        round: 2,
        section: "C",
        content: "Bộ shoe dẫn hướng trên đối trọng."
    },
    {
        code: "C20",
        round: 2,
        section: "C",
        content: "Các đệm cao su chống rung, lắc cabin."
    },
    {
        code: "C21",
        round: 2,
        section: "C",
        content: "Quạt thông gió đặt trên nóc cabin."
    },
    {
        code: "C22",
        round: 2,
        section: "C",
        content: "Hệ thống cửa thoát hiểm trên nóc cabin."
    },
    {
        code: "C23",
        round: 2,
        section: "C",
        content: "Đèn chiếu sáng trong cabin."
    },
    {
        code: "C24",
        round: 2,
        section: "C",
        content: "Đèn chiếu sáng dọc giếng thang."
    },
    {
        code: "C25",
        round: 2,
        section: "C",
        content: "Cáp điện dọc hành trình hố thang."
    },
    {
        code: "C26",
        round: 2,
        section: "C",
        content: "Kiểm tra sự làm việc của má phanh cơ khi ở dưới cabin."
    },
    {
        code: "C27",
        round: 2,
        section: "C",
        content: "Cáp dẹp (cáp cọc đồng)."
    },
    {
        code: "C28",
        round: 2,
        section: "C",
        content: "Khung bảo vệ, các công tắc, nút bấm an toàn trên cabin."
    },
    {
        code: "C29",
        round: 2,
        section: "C",
        content: "Bộ dẫn động cáp governor dưới hố pit."
    },
    {
        code: "C30",
        round: 2,
        section: "C",
        content: "Hộp Stop, đèn chiếu sáng hố pit."
    },
    {
        code: "C31",
        round: 2,
        section: "C",
        content: "Công tắc bộ giảm chấn."
    },
    {
        code: "C32",
        round: 2,
        section: "C",
        content: "Công tắc, cảm biến quá tải."
    },
    {
        code: "C33",
        round: 2,
        section: "C",
        content: "Công tắc, ổ cắm, đèn ở đáy giếng thang."
    },
    {
        code: "C34",
        round: 2,
        section: "C",
        content: "Hộp báo cháy."
    },
    {
        code: "C35",
        round: 2,
        section: "C",
        content: "Xích bù tải."
    },

    // =====================================================
    // D - BẢO TRÌ LẦN 3
    // =====================================================
    {
        code: "D01",
        round: 3,
        section: "D",
        content: "Ray dẫn hướng cabin."
    },
    {
        code: "D02",
        round: 3,
        section: "D",
        content: "Ray dẫn hướng đối trọng."
    },
    {
        code: "D03",
        round: 3,
        section: "D",
        content: "Hộp dầu ray cabin."
    },
    {
        code: "D04",
        round: 3,
        section: "D",
        content: "Hộp dầu ray đối trọng."
    },
    {
        code: "D05",
        round: 3,
        section: "D",
        content: "Bản mã nối ray, giá đỡ ray (bracket)."
    },
    {
        code: "D06",
        round: 3,
        section: "D",
        content: "Cáp tải."
    },
    {
        code: "D07",
        round: 3,
        section: "D",
        content: "Bộ tì cáp, khóa cáp."
    },
    {
        code: "D08",
        round: 3,
        section: "D",
        content: "Puli dẫn động cáp tải."
    },
    {
        code: "D09",
        round: 3,
        section: "D",
        content: "Giá treo cánh cửa tầng."
    },
    {
        code: "D10",
        round: 3,
        section: "D",
        content: "Ray dẫn hướng cánh cửa tầng."
    },
    {
        code: "D11",
        round: 3,
        section: "D",
        content: "Cáp kéo cửa tầng."
    },
    {
        code: "D12",
        round: 3,
        section: "D",
        content: "Bánh xe truyền động (Zulo) cửa tầng."
    },
    {
        code: "D13",
        round: 3,
        section: "D",
        content: "Khóa cửa tầng."
    },
    {
        code: "D14",
        round: 3,
        section: "D",
        content: "Tiếp điểm điện cửa tầng."
    },
    {
        code: "D15",
        round: 3,
        section: "D",
        content: "Con lăn dẫn hướng, bánh xe sai tâm."
    },
    {
        code: "D16",
        round: 3,
        section: "D",
        content: "Shoe dẫn hướng cánh cửa."
    },
    {
        code: "D17",
        round: 3,
        section: "D",
        content: "Đà dưới (Sill) cửa tầng."
    },
    {
        code: "D18",
        round: 3,
        section: "D",
        content: "Cánh cửa và khung bao cửa tầng."
    },
    {
        code: "D19",
        round: 3,
        section: "D",
        content: "Bo kéo cửa, cáp treo bo kéo cửa."
    },
    {
        code: "D20",
        round: 3,
        section: "D",
        content: "Lò xo kéo cửa."
    },
    {
        code: "D21",
        round: 3,
        section: "D",
        content: "Độ thẳng đứng và khe hở cánh cửa tầng."
    },
    {
        code: "D22",
        round: 3,
        section: "D",
        content: "Tâm cánh cửa."
    },
    {
        code: "D23",
        round: 3,
        section: "D",
        content: "Cách điện cửa tầng, khung bao cửa tầng."
    },
    {
        code: "D24",
        round: 3,
        section: "D",
        content: "Vệ sinh trong cabin, cửa tầng."
    }
];

console.log(`Số checklist chuẩn bị seed: ${checklists.length}`);

db.serialize(() => {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO maintenance_checklists
        (code, round, section, content)
        VALUES (?, ?, ?, ?)
    `);

    checklists.forEach(item => {
        stmt.run(
            item.code,
            item.round,
            item.section,
            item.content
        );
    });

    stmt.finalize((err) => {
        if (err) {
            console.error("Lỗi seed checklist:", err.message);
            return;
        }

        db.all(
            `
            SELECT id, code, round, section, content
            FROM maintenance_checklists
            ORDER BY id
            `,
            (err, rows) => {
                if (err) {
                    console.error("Lỗi kiểm tra checklist:", err.message);
                    return;
                }

                console.log(
                    `Đã seed thành công. Tổng số checklist trong database: ${rows.length}`
                );

                console.table(rows);
            }
        );
    });
});