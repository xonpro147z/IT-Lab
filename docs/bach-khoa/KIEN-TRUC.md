# Bách khoa TinHocLab – Kiến trúc AI Editorial (Giai đoạn B)

Tài liệu này là bản thiết kế. Giai đoạn B **không sửa code ứng dụng**, chỉ thêm:
- `content/wiki/schema/article.schema.json`: Article Schema v2;
- `content/wiki/schema/manifest.schema.json`: manifest gói nội dung v2;
- `content/wiki/categories.json`: chuyên mục và cấp lớp, tách khỏi code;
- `editorial/editorial.config.json`, `editorial/sources.json`: cấu hình pipeline;
- `docs/bach-khoa/examples/mat-khau-manh.json`: bài mẫu đã kiểm tra hợp lệ với schema.

## 1. Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Nơi chạy AI | **GitHub Actions** của kho `xonpro147z/IT-Lab`, chạy theo lịch và chạy tay khi cần |
| Mô hình AI | **Gemini API**, khoá lưu trong GitHub Secret `GEMINI_API_KEY`. Tên model đặt trong `editorial.config.json`, không ghi cứng vào code |
| Hình ảnh | **Ưu tiên ảnh có sẵn trên Internet có giấy phép tái sử dụng**: Wikimedia Commons, sau đó Openverse. Không có thì vẽ sơ đồ SVG. Không dùng ảnh AI (`images.aiGenerated = false`) |
| Cấp lớp | Lấy từ **lớp học sinh nhập khi đăng nhập IC3** |
| Chế độ xuất bản mặc định | `review`: giáo viên duyệt trước khi xuất bản. Đổi được sang `auto` hoặc `draft` |
| Module | Nâng cấp **chính `src/wiki/`**, không tạo module Bách khoa thứ hai |

## 2. Hai lưu ý về điều khoản Gemini API (đã đọc tại ai.google.dev/gemini-api/terms, 28/11/2026)

1. **Không dùng "Grounding with Google Search" để tạo nội dung bài.** Điều khoản cấm lưu (cache), phân phối lại (syndicate) hay chỉnh sửa *Grounded Results*. Kết quả grounding chỉ được hiển thị cho đúng người gửi câu hỏi, kèm *Search Suggestions*. Đăng thành bài cho học sinh là vi phạm. Vì vậy pipeline **tự tải nguồn** từ danh sách `sources.json` (RSS, API, trang chính thức), rồi đưa văn bản nguồn vào Gemini để viết. Trong cấu hình đặt `useGoogleSearchGrounding: false`.
2. **Giới hạn độ tuổi.** Điều khoản ghi người dùng API phải từ 18 tuổi, và không dùng API trong *ứng dụng hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập*. Trong thiết kế này:
   - chỉ có máy chủ GitHub Actions do giáo viên quản lý gọi API;
   - học sinh không bao giờ gọi API và chỉ đọc bài **đã được giáo viên duyệt**;
   - ứng dụng học sinh không chứa khoá API.

   Dù vậy, đây là vùng chưa rõ ràng về pháp lý. Giáo viên nên tự đọc lại điều khoản. Nếu cần chắc chắn, có thể chuyển sang Gemini trên Google Cloud (Vertex AI), vốn có điều khoản riêng. Pipeline được thiết kế theo kiểu "adapter" nên đổi nhà cung cấp chỉ phải sửa một tệp.

## 3. Tổng quan luồng xử lý

```
 [Lịch chạy / giáo viên bấm "Tạo bài"]
        │
 1 Discover   ─ đọc RSS/API trong sources.json + hàng chờ chủ đề của giáo viên
        │       → loại chủ đề trùng (so embedding với các bài đã có)
 2 Research   ─ tải trang nguồn (fetch thật), trích văn bản, ghi URL/tiêu đề/tác giả/ngày, chấm độ tin cậy
        │       → research.json (mỗi đoạn trích kèm mã băm SHA-256)
 3 Write      ─ Gemini viết bài dạng JSON theo schema (structured output) cho từng cấp lớp,
        │       mọi câu có số liệu phải gắn [^rN] trỏ về nguồn trong research.json
 4 Fact-check ─ Gemini liệt kê các khẳng định quan trọng + câu trích làm bằng chứng;
        │       CODE kiểm tra câu trích có THẬT SỰ nằm trong văn bản nguồn (so khớp chuỗi)
 5 Visual     ─ tìm ảnh Wikimedia Commons → Openverse; kiểm giấy phép; tải về, nén WebP;
        │       thiếu ảnh thì dùng block diagram/infographic (SVG vẽ từ dữ liệu)
 6 Editorial  ─ kiểm tra schema, độ dễ đọc, trùng lặp, sao chép nguyên văn; chọn chuyên mục, cấp lớp;
        │       đề xuất trạng thái
 7 Publish    ─ mở Pull Request "Bách khoa: <tên bài>" → giáo viên duyệt (review) / tự gộp (auto) / để nháp (draft)
        │
   Gộp PR → workflow build-pack tạo lại manifest (SHA-256) → máy học sinh tải trong vòng 3 giờ
```

**Nguyên tắc cứng:** bài nào chưa đạt đủ 7 mục kiểm tra (`review.checks`) thì workflow publish **từ chối gộp**, kể cả ở chế độ `auto`.

## 4. Bố cục kho GitHub

```
content/wiki/                  ← ỨNG DỤNG CHỈ ĐỌC THƯ MỤC NÀY (chỉ bài đã xuất bản)
  manifest.json                  format 2 + giữ "articles" (.md) cho bản app cũ ≤ 1.21
  categories.json                chuyên mục + cấp lớp
  articles/<id>.json             bài viết v2
  assets/<id>/<ảnh>.webp|svg     ảnh của từng bài (đã kiểm giấy phép)
  *.md                           bài kiểu cũ (vẫn đọc được)
  schema/                        JSON Schema
editorial/                     ← PIPELINE (app không tải)
  editorial.config.json          chế độ xuất bản, lịch, giới hạn, model
  sources.json                   nguồn được phép
  state/index.json               danh sách chủ đề đã có + embedding (chống trùng)
  state/runs/<yyyy-mm>.jsonl     nhật ký mỗi lần chạy (AI làm gì, gọi bao nhiêu lần, lỗi)
  research/<id>/                 văn bản nguồn đã trích (để fact-check / rà lại)
tools/editorial/               ← mã pipeline (Node 20, không cần thư viện nặng)
  run.mjs  discover.mjs  research.mjs  write.mjs  factcheck.mjs  visual.mjs  editorial.mjs
  gemini.mjs (adapter + retry)  fetch.mjs  images.mjs  pack.mjs  validate.mjs
.github/workflows/
  bach-khoa-news.yml   (hằng ngày)   bach-khoa-weekly.yml (hằng tuần)
  bach-khoa-refresh.yml (hằng tháng) bach-khoa-pack.yml (khi gộp vào main)
```

Bài nháp **không nằm trên nhánh `main`**. Mỗi bài nháp là một nhánh `bk/<id>` kèm một Pull Request:
- lịch sử phiên bản đầy đủ nằm trong Git;
- giáo viên xem được chính xác bài thay đổi gì;
- máy học sinh không bao giờ nhận bài chưa duyệt.

## 5. Vòng đời của một bài

`discovered → researching → drafted → in_review → approved → published`, cùng các nhánh rẽ:
- `rejected`: giáo viên từ chối;
- `needs_update`: quá hạn hoặc nguồn đã thay đổi;
- `archived`: ẩn khỏi ứng dụng nhưng vẫn giữ lại.

Tin tức (`kind = news`) bắt buộc có `eventDate`, `publishedAt`, `updatedAt` và `expiresAt`. Ứng dụng hiện "Đăng ngày … · Cập nhật ngày …".

## 6. Chi tiết từng agent

| Agent | Đầu vào | Gemini làm gì | Code kiểm tra gì |
|---|---|---|---|
| Discover | RSS/API, hàng chờ giáo viên | Tóm tắt, đề xuất chủ đề phù hợp học sinh | Embedding so với `state/index.json` (độ giống ≥ 0,88 thì bỏ). Giới hạn số bài mỗi ngày |
| Research | chủ đề | Gợi ý trang nào trong `sources.json` cần đọc | Tải trang thật (HTTP 200), trích văn bản, lưu SHA-256, phân loại độ tin cậy. Cần ≥ 2 nguồn, trong đó ≥ 1 nguồn chính thức hoặc tiêu chuẩn |
| Write | research.json | Viết JSON theo schema cho từng cấp lớp; gắn nhãn `fact/opinion/prediction`; tạo quiz | Kiểm tra hợp lệ với schema bằng Ajv; mọi `[^rN]` phải tồn tại trong `references` |
| Fact-check | bài nháp + văn bản nguồn | Liệt kê khẳng định quan trọng + câu trích làm bằng chứng | **Câu trích phải có thật trong nguồn** (so khớp sau khi chuẩn hoá). Khẳng định nào không có bằng chứng thì `factcheck = fail` |
| Visual | bài nháp | Viết từ khoá tìm ảnh, alt, chú thích | Gọi Wikimedia/Openverse; chỉ nhận CC0, PD, CC BY, CC BY-SA; ghi tác giả và giấy phép; nén WebP ≤ 600 KB; lưu SHA-256 |
| Editorial | bài hoàn chỉnh | Nhận xét độ dễ đọc theo cấp lớp, đề xuất chuyên mục | Không câu nào trùng nguyên văn ≥ 12 từ liên tiếp với nguồn; độ dài câu, số thuật ngữ; trùng lặp; đủ 7 mục kiểm tra |

**Chống bịa nguồn:** Gemini **không được tự tạo URL**. Danh sách `references` do code ghi từ các trang đã tải thành công; Gemini chỉ được trỏ tới mã `r1, r2…` có sẵn.

**Gọi API:**
- dùng structured output (JSON Schema) để kết quả luôn đúng cấu trúc;
- thử lại khi gặp lỗi 429 hoặc 5xx (tối đa 4 lần, chờ tăng dần, có cộng ngẫu nhiên);
- giới hạn `maxCallsPerRun`;
- mọi lời gọi được ghi vào `state/runs/*.jsonl` (thời gian, model, số token, kết quả, lỗi).

## 7. Hình ảnh

Thứ tự tìm ảnh: **Wikimedia Commons → Openverse → ảnh báo chí chính thức của hãng** (chỉ khi trang ghi rõ được phép dùng) → **sơ đồ hoặc infographic SVG** vẽ từ dữ liệu.
- Ảnh luôn được **tải về và đóng gói cùng bài**, không tải trực tiếp từ web khi học sinh đọc. Lý do: máy không mạng vẫn xem được, giấy phép không đổi, và quy tắc bảo mật CSP của trang vẫn chặn ảnh từ ngoài.
- Mỗi ảnh có `kind` (photo, illustration, diagram, infographic, screenshot, logo, ai-generated) để phân biệt ảnh chụp thật với hình vẽ. Dưới ảnh luôn có dòng ghi công.
- Ảnh có giấy phép không rõ hoặc không cho tái sử dụng thì bị loại, mục kiểm tra `images` bị đánh `fail`.

## 8. Lịch chạy (GitHub Actions)

| Workflow | Lịch (giờ Việt Nam) | Việc |
|---|---|---|
| `bach-khoa-news.yml` | 06:17 hằng ngày | Quét tin công nghệ, tối đa 3 bài tin mỗi ngày |
| `bach-khoa-weekly.yml` | 08:41 thứ Bảy | Bài bách khoa mới từ hàng chờ và chủ đề đề xuất, tối đa 2 bài mỗi ngày |
| `bach-khoa-refresh.yml` | ngày 1 hằng tháng | Tìm bài quá hạn (`expiresAt`, `staleAfterDays`) hoặc có nguồn đã đổi (SHA-256 khác), mở PR cập nhật |
| `bach-khoa-pack.yml` | khi gộp vào `main` | Kiểm tra lại schema, tạo `manifest.json` (SHA-256, dung lượng), đóng gói |

- Mọi workflow có `workflow_dispatch`, nên giáo viên chạy tay được, kể cả từ Dashboard.
- `concurrency` đảm bảo không có hai lần chạy chồng nhau.
- **Cron của GitHub không đúng giờ tuyệt đối**: có thể trễ vài phút, và chạy theo giờ UTC.
- **Kho công khai không có hoạt động trong 60 ngày thì GitHub tự tắt workflow chạy theo lịch.** Mỗi lần chạy, pipeline ghi một dòng vào `editorial/state` để kho luôn có hoạt động. Dashboard cũng báo khi workflow bị tắt.
- GitHub Actions miễn phí cho kho công khai. Chi phí thật chỉ là Gemini API, được giới hạn bằng `limits` và `maxCallsPerRun`.

## 9. Ba chế độ xuất bản

| `publishMode` | Hành vi |
|---|---|
| `review` (mặc định) | Mở Pull Request thường. Giáo viên Duyệt (gộp) / Sửa / Từ chối (đóng PR, ghi lý do vào `state`) |
| `auto` | Đủ 7 mục kiểm tra `pass` thì tự gộp. Còn mục `warn` hoặc `fail` thì chuyển sang chờ duyệt |
| `draft` | Mở PR dạng nháp, không thông báo; dùng để thử pipeline |

## 10. Thay đổi phía ứng dụng (Giai đoạn C, E, F)

- **Updater** (`updater.js`):
  - đọc manifest `format: 2`, chỉ tải tệp có SHA-256 thay đổi, kiểm tra mã băm và dung lượng;
  - ghi vào thư mục tạm rồi mới thay thế (lỗi giữa chừng vẫn giữ bản cũ);
  - bỏ giới hạn chỉ tải `.md`;
  - bản app cũ ≤ 1.21 vẫn đọc mảng `articles` (.md) như trước.
- **Article Renderer** (trong `src/wiki/`, không tạo module mới):
  - tách `wiki.js` thành `wiki.js` (trang và điều hướng), `blocks.js` (hiển thị từng loại block), `inline.js` (đánh dấu rút gọn, luôn lọc mã HTML), `legacy.js` (bộ đọc cú pháp cũ, chính là hàm `render` hiện có);
  - block `markdown` dùng `legacy.js`, nên 18 bài cũ hiển thị y như hiện tại;
  - giữ nguyên tìm kiếm không dấu, quiz, tiến độ đọc, ảnh lightbox, giao diện tạp chí, bổ sung responsive.
- **Chọn cấp lớp:**
  - lấy lớp của học sinh đang đăng nhập IC3 (`sessionStorage['thl.ic3.me']` trỏ tới `localStorage['thl.ic3.profiles']`);
  - nếu không có, lấy hồ sơ đăng nhập gần nhất trên máy;
  - tách số đầu tiên của lớp (`7A` thành 7): lớp 3–5 là `g3-5`, 6–8 là `g6-8`, từ 9 trở lên là `g9+`;
  - chưa đăng nhập thì hỏi một lần "Em học lớp mấy?" (lưu `thl.wiki.grade`) và có nút đổi;
  - bài không có phiên bản đúng cấp lớp thì hiện phiên bản gần nhất, kèm nhãn "Bài dành cho lớp …".
- **Chuyên mục** đọc từ `categories.json` thay vì viết cứng trong code. Mục "Bạn có biết?" lấy từ các block `callout: didyouknow` của bài đã xuất bản.
- **Thông tin hiển thị thêm trong mỗi bài:** nguồn tham khảo, giấy phép ảnh, dòng công khai AI ("Bài viết được AI hỗ trợ soạn và giáo viên … duyệt ngày …"), ngày đăng / cập nhật, nhãn *Ý kiến* / *Dự đoán* trên các đoạn tương ứng.

## 11. Dashboard giáo viên (Giai đoạn F)

- Nằm ngay trong Bách khoa, tại `#/quan-tri`, dùng **chung mật khẩu giáo viên của IC3**.
- Thao tác lên kho bằng **GitHub fine-grained token** của giáo viên:
  - chỉ cấp quyền cho kho `IT-Lab`, gồm Contents, Pull requests, Actions;
  - token lưu ở máy giáo viên, mã hoá bằng `safeStorage` của Electron;
  - mọi lời gọi GitHub API chạy ở tiến trình chính, không đưa token vào trang.
- Số liệu hiển thị:
  - tổng số bài, bài mới phát hiện, đang nghiên cứu, chờ duyệt (PR mở), đã xuất bản;
  - nguồn dữ liệu, lịch chạy và lần chạy gần nhất (từ Actions API), lịch sử hoạt động AI (`state/runs`).
- Thao tác:
  - **Duyệt / Xuất bản** (gộp PR), **Từ chối** (đóng PR kèm lý do), **Sửa** (trình sửa block, lưu thành commit vào nhánh PR), **Tạo bài theo chủ đề** (chạy workflow kèm chủ đề);
  - đổi `publishMode`, bật/tắt lịch, quản lý chuyên mục và cấp lớp.
- Máy học sinh không có token, nên không hiện Dashboard.

## 12. Bảo mật

- Khoá Gemini chỉ nằm trong GitHub Secrets; workflow từ PR của người ngoài (fork) không được đọc secret.
- Pipeline chỉ tải trang từ các tên miền trong `sources.json`, giới hạn dung lượng và thời gian chờ, không chạy JavaScript của trang.
- Nội dung bài là dữ liệu JSON, **không có HTML**. Renderer lọc mã mọi chuỗi; liên kết ngoài chỉ nhận `https`; video chỉ qua `youtube-nocookie` và cần bấm mới tải.
- Ứng dụng kiểm tra SHA-256 từng tệp và giới hạn dung lượng gói (`maxPackBytes`).

## 13. Danh sách tệp theo giai đoạn

| Giai đoạn | Tạo mới | Sửa |
|---|---|---|
| C – Renderer | `src/wiki/blocks.js`, `inline.js`, `legacy.js`, `grade.js`, `tools/wiki-migrate.mjs` (chuyển 18 bài cũ sang v2 bằng block `markdown`) | `src/wiki/wiki.js`, `wiki.css`, `wiki.html` |
| D – Agents | `tools/editorial/*.mjs` | `package.json` (thêm lệnh `editorial:*`, thư viện `ajv`) |
| E – Lịch + gói | `.github/workflows/bach-khoa-*.yml`, `tools/editorial/pack.mjs` | `updater.js`, `content/wiki/manifest.json` |
| F – Dashboard | `wikiadmin.js` (IPC GitHub API), giao diện quản trị trong `src/wiki/` | `main.js` (1 dòng khởi động), `preload.js` |
| G – Thử nghiệm | 10 bài mẫu Tin học/IC3 qua đủ pipeline | – |

## 14. Rủi ro và cách giảm

| Rủi ro | Cách giảm |
|---|---|
| AI bịa thông tin | Fact-check bằng câu trích có thật trong nguồn; mặc định `review`; giáo viên duyệt |
| Sao chép nguyên văn | So câu với nguồn (≤ 11 từ liên tiếp); viết lại theo cấp lớp |
| Chi phí API tăng | Giới hạn bài mỗi ngày và `maxCallsPerRun`; theo dõi số token trong nhật ký |
| Tên model Gemini thay đổi hoặc ngừng hỗ trợ | Model đặt trong cấu hình; dùng bí danh `gemini-flash-latest`; adapter riêng |
| Gói nội dung quá nặng | Nén WebP, ≤ 8 ảnh mỗi bài, giới hạn tổng gói; app chỉ tải tệp đổi |
| Workflow bị GitHub tắt do không có hoạt động | Ghi trạng thái mỗi lần chạy; Dashboard cảnh báo |
| Nguồn đổi cấu trúc, RSS hỏng | `sources.json` có `verified`; nguồn lỗi tự tắt và ghi nhật ký; không phụ thuộc một website |
