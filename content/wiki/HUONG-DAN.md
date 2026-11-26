# Hướng dẫn thêm bài cho Bách khoa Tin học

Máy học sinh tự tải kiến thức mới từ thư mục này trên GitHub khi mở phần mềm, khi bấm **Cập nhật**, và tự kiểm tra lại mỗi 3 giờ. Không cần đóng gói lại phần mềm.

## Thêm một bài mới
1. Trên GitHub, vào thư mục `content/wiki`, chọn **Add file → Create new file**.
2. Đặt tên tệp không dấu, ví dụ `phim-tat-windows.md`, rồi chép mẫu bên dưới vào và sửa nội dung.
3. Mở `manifest.json`, thêm tên tệp vào danh sách `articles` và tăng số `version` lên 1.
4. Bấm **Commit changes**. Khoảng 5 phút sau, máy học sinh sẽ nhận được bài mới.

## Mẫu một bài
```
---
id: phim-tat-windows
title: Phím tắt Windows cần biết
cat: he-thong
icon: ⌨️
summary: Một câu tóm tắt nội dung bài.
aliases: từ khoá 1, từ khoá 2
related: he-dieu-hanh, loi-may-tinh
boxTitle: Thông tin nhanh
box: Sao chép | Ctrl + C
box: Dán | Ctrl + V
---
Đoạn mở đầu. **Chữ đậm**, *chữ nghiêng*, `mã`, [[he-dieu-hanh|liên kết tới bài khác]].

## Tiêu đề mục
- Gạch đầu dòng
1. Danh sách đánh số

| Cột 1 | Cột 2 |
| Ô | Ô |

> Mẹo: dòng bắt đầu bằng "> Mẹo:" thành ô mẹo xanh lá; "> Cẩn thận:" thành ô cảnh báo đỏ.

## Kiểm tra nhanh
? Câu hỏi?
- Đáp án sai
+ Đáp án đúng (dấu +)
- Đáp án sai
= Lời giải thích.
```

## Mã chủ đề (cat)
`he-thong` (Máy tính & hệ điều hành) · `internet` (Internet & đám mây) · `cong-dan-so` (Công dân số) · `an-toan` (An toàn thông tin) · `du-lieu` (Dữ liệu & biểu đồ) · `ai` (Trí tuệ nhân tạo)

## Sửa bài có sẵn
Tạo tệp `.md` có **cùng `id`** với bài có sẵn (xem id ở thanh địa chỉ, ví dụ `#/a/trinh-duyet`). Bài trong gói sẽ thay thế bài cũ và được gắn nhãn "Vừa cập nhật".
