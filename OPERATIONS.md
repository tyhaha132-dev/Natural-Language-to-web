# Vận hành Web Coding Agent

Tài liệu cho người giao việc cho agent (operator), không phải cho agent tự đọc.

## 1. Yêu cầu trước khi chạy

- Node.js >= 20, đã `npm install` trong `D:\project\web-coding-agent`.
- OpenCode CLI đã đăng nhập (`opencode` chạy được, model free còn quota).
- PostgreSQL chạy và khớp `.env` (`POSTGRES_HOST/PORT/USER/PASSWORD/DB`).
  File `.env` đã có mẫu tại `.env.example` và không được commit.

## 2. Giao việc

```powershell
npm run agent -- --id <ten-viec> --prompt "<yeu cau bang ngon ngu tu nhien>" [--port <cong-test>]
```

- `--id`: chữ, số, gạch ngang/gạch dưới. Mỗi id là một workspace riêng
  (`workspaces/<id>/`) và một thư mục report (`artifacts/pipelines/<id>/`).
  Chạy lại cùng id = phát triển tiếp trên code cũ (yêu cầu mở rộng).
- `--port`: cổng HTTP dùng khi kiểm thử app (mặc định `APPLICATION_PORT`
  trong `.env`, hiện tại 43130). Đổi cổng khi cổng mặc định bận.
- Mã thoát: `0` = COMPLETED, `1` = FAILED, `2` = sai tham số.

## 3. Nghiệm thu một run

1. Lệnh thoát mã `0`.
2. File `artifacts/pipelines/<id>/run-report.json` có `"status": "COMPLETED"`.
   Trường `retryFeedbackUsed: true` nghĩa là run đã phải tự sửa (iteration > 0).
3. App trong `workspaces/<id>/` khởi động được bằng lệnh start của nó
   (ví dụ `npm start` với `PORT` trỏ cổng trống) và trang/API chính trả 200.

## 4. Giới hạn vận hành (bắt buộc đọc)

- **Một job tại một thời điểm.** Cổng kiểm thử dùng chung; chạy song song
  gây tranh cổng và fail oan.
- Một run tốn **2–20 phút** (model free đôi khi chậm: planner từng mất 8 phút).
  Không chạy lại khi log vẫn tiến triển.
- Tối đa 5 iteration; coder/reviewer mỗi lượt tối đa 10 phút rồi retry.
- Model free có quota: hết quota giữa chừng = run FAILED, chờ rồi chạy lại.

## 5. Sự cố thường gặp

| Hiện tượng | Xử lý |
|---|---|
| Cổng test bận (`EADDRINUSE`) | `netstat -ano \| Select-String '<port>'` tìm PID, `taskkill /PID <pid> /T /F`. **Không bao giờ** kill theo tên (`Stop-Process -Name node`, `taskkill /IM`) vì sẽ giết luôn tiến trình pipeline. |
| Process node mồ côi sau run | Cùng cách trên: kill đúng PID đã start, kèm `/T` để dọn cả cây con. |
| `FAILED: Reviewer execution failed` hết iteration | Reviewer timeout liên tục ở app lớn: chia nhỏ yêu cầu, giao lại từng phần. |
| `FAILED` ở iteration 0 lúc coding | Đọc `failureReason` trong report; thường do yêu cầu quá lớn cho một lượt coder — tách nhỏ. |
| Vitest của repo chạy lẫn test của app sinh ra | Đã chặn `workspaces/**` trong script `test`. Không chạy vitest trong workspace bằng tay với config repo. |

## 6. Không đụng vào

- `workspaces/<id>/.git`: checkpoint nội bộ của pipeline.
- `.env`, `node_modules`, `artifacts/` (log/report chỉ đọc).
