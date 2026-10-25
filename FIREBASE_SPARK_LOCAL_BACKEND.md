# Firebase Spark + backend chạy local

Kiến trúc hiện tại:

```text
React Native -> Express local (port 3000) -> Firebase Auth + Firestore
```

Không dùng Cloud Functions production và không dùng Firebase Storage. Vì vậy database và Authentication có thể dùng Firebase Spark trong hạn mức miễn phí. Máy chạy backend vẫn phải được bật và app phải kết nối được tới máy đó.

## 1. Chuẩn bị Firebase

1. Tạo Firebase project trên gói Spark.
2. Bật **Authentication > Sign-in method > Email/Password**.
3. Tạo **Firestore Database** ở Production mode.
4. Trong **Project settings > General**, sao chép **Web API Key**.
5. Trong **Project settings > Service accounts**, tạo private key JSON và lưu bên ngoài repository.

## 2. Cấu hình backend local

Sao chép file mẫu:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Sửa `backend/.env`:

```dotenv
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_WEB_API_KEY=your-web-api-key
GOOGLE_APPLICATION_CREDENTIALS=C:\secure\firebase-service-account.json
```

Không commit `.env` hoặc service-account JSON.

## 3. Deploy Firestore rules

Từ thư mục gốc:

```powershell
firebase login
firebase use --add
firebase deploy --only firestore
```

Rules hiện chặn mobile truy cập Firestore trực tiếp. Backend local dùng Admin SDK nên vẫn hoạt động.

## 4. Chạy backend

```powershell
cd .\backend
npm start
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/
```

## 5. Cấu hình URL cho app

Sửa `src/config/firebase.ts` tùy môi trường:

- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://127.0.0.1:3000`
- Thiết bị thật cùng Wi-Fi: `http://IP_LAN_CUA_MAY_TINH:3000`

Mở port 3000 trong Windows Firewall nếu dùng thiết bị thật. `127.0.0.1` trên điện thoại là chính điện thoại, không phải máy tính chạy backend.

## Giới hạn của mô hình này

- Backend chưa global; máy tính chạy backend phải luôn bật.
- Attachment chỉ lưu metadata/URI thiết bị trong Firestore, không upload nội dung file.
- Không chạy `firebase deploy --only functions` và không bật Storage trên Spark.
