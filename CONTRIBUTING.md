# Contributing

Luật làm việc duy nhất cần nhớ nằm ở [AGENT.md](AGENT.md):
branch mới cho mọi thay đổi hành vi, `npm run check` xanh, chạy thử pipeline
`COMPLETED` thật rồi mới merge `main`.

Bổ sung kỹ thuật cho repo này:

## Môi trường dev

- Node.js >= 20 (CI dùng 22), Windows + PowerShell.
- PostgreSQL local theo `.env` (copy từ `.env.example`, không commit `.env`).
- OpenCode CLI đã đăng nhập (chỉ cần cho benchmark AI thật và
  `npm run test:ai`, không cần cho `npm run check`).

## Lệnh

```powershell
npm run check    # typecheck (tsc) + toàn bộ unit test (vitest)
npm run test:ai  # integration test gọi OpenCode thật (tốn phút, cần quota)
npm run agent -- --id <viec> --prompt "<yeu cau>"  # giao việc cho agent
```

## Lưu ý khi sửa code

- Không hard-code cổng, đường dẫn tuyệt đối, hay tên process trong `src/`.
- Test mới không được phụ thuộc workspace có sẵn (dùng fixture tạm, xem
  `tests/runtime-static-server.test.ts`).
- Test không được để lại file/dir rác (tự dọn trong `finally`/cuối test).
- Không kill process theo tên trong prompt lẫn code (`Stop-Process` phải có
  `-Id`, `taskkill` phải có `/PID` + `/T`).
- Mọi run AI tốn phút: ưu tiên mock ở unit test, chỉ verify live khi cần.
