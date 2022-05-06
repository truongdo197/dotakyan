# base-api

## Mở đầu

1. Language typescript, nodejs-express.
2. Database typeorm, mysql

```sql
-- Create example database
CREATE DATABASE dotachan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Insert user admin. password: truong12345
INSERT INTO dotachan.`user` (username,password,full_name,email,mobile,status,role_id)
VALUES('admin','$2a$10$rxeRaHhOpQBsgjPh.ajbX.nkC3H9caOIJbCR/PqowDzrW6pveOeyC','Nguyễn Duy Trường','truongezgg@gmail.com','0335309793',1,1);

```

_1. Script_

```powershell
# Install package
$ npm install

# Chỉ build
$ npm run build

# Chạy server
$ npm run server

# Xóa out dir của typescript, build lại và chạy server. Restart server mỗi lần ấn Ctrl + S.
$ npm start

# Xóa out dir, chạy server
$ npm run dev
```

# CMS cần làm:

CMS quản lí config trial days. Key = TRIAL_DAYS

# Notification type.

1: data = {
type: 1,
senderId: number,
conversationId: number
}
