import { runPipelineBenchmark } from "./pipeline-benchmark.js";

const result = await runPipelineBenchmark({
  id: "nl-booking-vi",
  prompt: `
Xây dựng trang đặt lịch cho tiệm barber.

Khách hàng chọn dịch vụ cắt tóc, chọn ngày và giờ hẹn, rồi để lại số điện thoại.
Toàn bộ giao diện hiển thị bằng tiếng Việt.

Yêu cầu:
- Kiểm tra dữ liệu đầu vào (số điện thoại Việt Nam, ngày giờ hợp lệ).
- Có automated tests cho ứng dụng.
- Ứng dụng chạy được bằng một lệnh start duy nhất.
- Đọc cổng server từ biến môi trường PORT.

Do not ask for clarification.
Make reasonable implementation decisions and complete the application.
`,
});

console.log(JSON.stringify(result, null, 2));
