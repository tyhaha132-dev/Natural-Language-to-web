# Web Coding Agent

[![CI](https://github.com/tyhaha132-dev/Natural-Language-to-web/actions/workflows/ci.yml/badge.svg)](https://github.com/tyhaha132-dev/Natural-Language-to-web/actions/workflows/ci.yml)

Agent tự động biến **yêu cầu ngôn ngữ tự nhiên thành ứng dụng web chạy được**:
nhận yêu cầu → phân tích → lập kế hoạch → viết code → kiểm thử → review →
tự sửa (tối đa 5 iteration) cho đến khi đạt yêu cầu hoặc thất bại rõ lý do.

Đã chứng minh live: yêu cầu tiếng Việt (trang đặt lịch barber) → app Express
chạy thật, `POST` booking 201, SĐT sai 400, 50/50 tests xanh, pipeline `COMPLETED`.

## Yêu cầu môi trường

- Node.js >= 20 (khuyên 22), Windows + PowerShell.
- PostgreSQL local (theo `.env`, copy từ `.env.example`).
- OpenCode CLI đã đăng nhập — chỉ cần khi chạy benchmark AI thật
  (`npm run agent`, `npm run test:ai`); `npm run check` không cần.

CI (`.github/workflows/ci.yml`) chạy `npm run check` trên Windows mỗi
push/PR vào `main`, kèm PostgreSQL cài tự động.

## Giao việc

```powershell
npm install
# cấu hình .env theo .env.example (PostgreSQL, cổng, timeout)

npm run agent -- --id cong-viec-1 --prompt "Mô tả web bạn muốn"
```

- `--id`: tên việc (chữ/số/`-`/`_`). Mỗi id là một workspace riêng
  (`workspaces/<id>/`). Chạy lại cùng id = mở rộng việc cũ.
- `--port`: cổng HTTP dùng khi kiểm thử (mặc định `APPLICATION_PORT`).
- Mã thoát: `0` COMPLETED · `1` FAILED · `2` sai tham số.
- Kết quả mỗi run: `artifacts/pipelines/<id>/run-report.json`.

Chi tiết vận hành (nghiệm thu, giới hạn, sự cố): xem [OPERATIONS.md](OPERATIONS.md).

## Cách hệ thống hoạt động

### Pipeline 10 trạng thái

```
STARTING → ANALYZING → ENVIRONMENT_SETUP → PLANNING → PLAN_VALIDATING
  → CODING → DATABASE_SETUP → TESTING → REVIEWING → DECIDING
```

`DECIDING` có 4 hướng: `COMPLETE` → COMPLETED · `RETRY` → code lại ·
`RETRY_REVIEW` → review lại · `FAIL` → FAILED.

### 3 agent — 3 model (`src/config/models.ts`)

| Agent | Việc | Model |
|---|---|---|
| Planner | Phân tích yêu cầu, xuất plan + giả định + acceptance criteria | `nemotron-3-ultra-free` |
| Coder | Viết app trong workspace riêng (frontend/backend/DB/tests) | `muse-spark-1.3-contributor-free` |
| Reviewer | Soát workspace với yêu cầu gốc, checklist PASS/FAIL từng mục | `mimo-v2.6-flash-free` |

Planner chạy 1 lần; coder và reviewer chạy lại mỗi iteration. Không agent nào
được hỏi ngược người dùng — chỗ mơ hồ phải ghi thành giả định explicit.

### Tự sửa (retry)

- Test fail hoặc review `CHANGES_REQUIRED` → coder nhận đúng log lỗi +
  nhận xét reviewer trong prompt lần sau (không retry mù).
- Reviewer crash/timeout → chỉ chạy lại bước review, giữ nguyên code và
  kết quả test.
- Coder crash/timeout → code lại với feedback lỗi.
- Hết 5 iteration → `FAIL` kèm lý do trong report.

### Kiểm thử theo tầng

1. Nhận diện runtime `STATIC` (`index.html`) / `NODE` (`package.json`).
2. Start app thật, HTTP smoke test, stop sạch.
3. Chạy `npm test` của chính app sinh ra nếu nó khai báo test script
   (app minimal không có test thì bỏ qua).

### Quy tắc an toàn cho agent code

- Cổng server đọc từ `process.env.PORT`, cấm hard-code.
- Lệnh tương thích Windows PowerShell; cấm kill process theo tên
  (`Stop-Process` không `-Id`, `taskkill /IM`, `pkill`) — từng giết chết
  chính pipeline, giờ đã cấm trong prompt.
- App sinh ra không bao giờ sửa source của agent.

## Cấu trúc repo

```
src/
  orchestrator/   pipeline, các bước state, decision engine, retry
  agents/         planner / coder / reviewer + factory qua OpenCode CLI
  planner/        validator cho implementation plan
  runtime/        process, server, phát hiện NODE/STATIC, cổng
  testing/        smoke test, chạy test sinh ra
  infrastructure/ PostgreSQL, môi trường, migration
  workspace/      workspace riêng cho từng pipeline
  git/            checkpoint workspace
  artifacts/      ghi run-report.json sau mỗi run
  benchmark/      kịch bản kiểm chứng (smoke, node, booking-vi/admin)
  config/         .env, models, paths
tests/            ~80 files unit test (mock), 1 integration test (AI thật)
workspaces/       output (gitignored) — mỗi pipeline một thư mục
artifacts/        report (gitignored)
```

## Phát triển

```powershell
npm run check   # typecheck + toàn bộ unit test, phải xanh trước khi push
```

Mọi tính năng làm trên branch mới, verify local (`check` xanh + chạy thử
pipeline `COMPLETED`) rồi mới merge `main`. Secret trong `.env`, không commit.
