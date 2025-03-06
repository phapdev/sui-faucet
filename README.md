# SUI Faucet Manager

Công cụ quản lý và tự động hóa việc yêu cầu SUI Gas và USDC từ các faucet testnet.

## Tính năng

- Yêu cầu SUI Gas từ faucet testnet chính thức
- Yêu cầu USDC từ Circle faucet
- Giao diện web đẹp mắt với gradient đen tím huyền bí
- Thống kê số lần thành công/thất bại
- Hiển thị logs chi tiết
- Thông báo toast khi có sự kiện quan trọng
- Đếm thời gian chạy
- Có thể dừng quá trình bất cứ lúc nào mà không bị crash

## Cài đặt

```bash
# Clone repository
git clone https://github.com/yourusername/faucet-sui.git
cd faucet-sui

# Cài đặt dependencies
pnpm install
```

## Sử dụng

### Cách 1: Chạy trực tiếp từ trình duyệt (Không cần server)

Chỉ cần mở file `index.html` trực tiếp trong trình duyệt:

1. Mở thư mục dự án
2. Double-click vào file `index.html`
3. Hoặc kéo file `index.html` vào trình duyệt

### Cách 2: Chạy với server Express

```bash
pnpm start
```

Sau đó mở trình duyệt và truy cập: http://localhost:3000

### Cách 3: Chạy từ dòng lệnh (không có giao diện)

```bash
pnpm cli
```

## Cấu hình

Trong giao diện web, bạn có thể cấu hình:

- Địa chỉ ví SUI
- Số lần chạy (mặc định: 1000)
- Thời gian chờ giữa các lần chạy (mặc định: 10 giây)

## Xử lý lỗi CORS

Nếu bạn gặp lỗi CORS khi chạy trực tiếp từ trình duyệt, bạn có thể:

1. Sử dụng extension như "CORS Unblock" cho Chrome
2. Hoặc chạy với server Express (Cách 2)
3. Hoặc chạy từ dòng lệnh (Cách 3)

## Lưu ý

- Các faucet thường có giới hạn tần suất yêu cầu, vì vậy hãy đảm bảo thời gian chờ đủ dài
- Địa chỉ ví phải là địa chỉ SUI hợp lệ
- Nếu gặp lỗi liên tục, hãy tăng thời gian chờ lên

## Giấy phép

ISC 