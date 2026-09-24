import { runPipelineBenchmark } from "./pipeline-benchmark.js";

const result = await runPipelineBenchmark({
  id: "nl-booking-vi",
  prompt: `
Trang dat lich tiem barber hien tai da co: khach chon dich vu, ngay, gio, de lai
so dien thoai; giao dien tieng Viet; kiem tra du lieu; automated tests.

Mo rong them trang admin:
- Trang /admin hien thi tat ca booking dang bang (dich vu, ngay, gio, so dien thoai).
- Tim kiem booking theo so dien thoai.
- Xoa booking (co xac nhan), tra ve 404 khi booking khong ton tai.
- Giao dien trang admin cung bang tieng Viet.
- Bo sung automated tests cho cac API moi.
- Giu nguyen toan bo chuc nang cu van chay tot.

Do not ask for clarification.
Make reasonable implementation decisions and complete the application.
`,
});

console.log(JSON.stringify(result, null, 2));
