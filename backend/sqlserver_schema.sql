-- =========================================================================
-- QNU DocFlow - Hệ thống Quản lý Công văn (Trường Đại học Quy Nhơn)
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER CHUẨN DOANH NGHIỆP
-- Collation: Vietnamese_CI_AS (Hỗ trợ tìm kiếm tiếng Việt có dấu/không dấu)
-- =========================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QNU_DocFlow')
BEGIN
    CREATE DATABASE QNU_DocFlow COLLATE Vietnamese_CI_AS;
END
GO

USE QNU_DocFlow;
GO

-- 1. Bảng Đơn vị / Phòng ban (Departments)
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Departments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code VARCHAR(50) NOT NULL UNIQUE,
        Name NVARCHAR(255) NOT NULL,
        Phone VARCHAR(50) NULL,
        Email VARCHAR(100) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END
GO

-- 2. Bảng Người dùng (Users) - Cấp độc quyền từ Admin
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        PasswordHash VARCHAR(255) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        Email VARCHAR(100) NULL,
        Phone VARCHAR(50) NULL,
        DepartmentId INT NULL,
        Role VARCHAR(50) NOT NULL CHECK (Role IN ('ADMIN', 'VAN_THU', 'LANH_DAO', 'CHUYEN_VIEN')),
        Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'LOCKED')),
        IsFirstLogin BIT NOT NULL DEFAULT 1,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Users_Department FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(Id) ON DELETE SET NULL
    );
END
GO

-- 3. Bảng Công văn (Documents) - Văn bản đến và Văn bản đi
IF OBJECT_ID(N'dbo.Documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Documents (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DocType VARCHAR(20) NOT NULL CHECK (DocType IN ('INCOMING', 'OUTGOING')),
        DocNumber VARCHAR(100) NOT NULL,
        IssuedDate DATE NOT NULL,
        ReceivedDate DATE NULL,
        Title NVARCHAR(1000) NOT NULL,
        Signer NVARCHAR(150) NULL,
        IssuingUnit NVARCHAR(255) NOT NULL,
        ReceivingUnitId INT NULL,
        UrgencyLevel VARCHAR(20) NOT NULL DEFAULT 'THUONG' CHECK (UrgencyLevel IN ('THUONG', 'KHAN', 'HOA_TOC')),
        SecurityLevel VARCHAR(20) NOT NULL DEFAULT 'BINH_THUONG' CHECK (SecurityLevel IN ('BINH_THUONG', 'MAT', 'TUYET_MAT')),
        Status VARCHAR(30) NOT NULL DEFAULT 'CHO_TIEP_NHAN' CHECK (Status IN ('CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_HOAN_THANH', 'LUU_TRU')),
        Notes NVARCHAR(MAX) NULL,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Documents_ReceivingUnit FOREIGN KEY (ReceivingUnitId) REFERENCES dbo.Departments(Id) ON DELETE SET NULL,
        CONSTRAINT FK_Documents_Creator FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id) ON DELETE SET NULL
    );

    CREATE NONCLUSTERED INDEX IX_Documents_DocType ON dbo.Documents(DocType);
    CREATE NONCLUSTERED INDEX IX_Documents_Status ON dbo.Documents(Status);
    CREATE NONCLUSTERED INDEX IX_Documents_IssuedDate ON dbo.Documents(IssuedDate);
END
GO

-- 4. Bảng Tệp đính kèm (Document_Attachments)
IF OBJECT_ID(N'dbo.DocumentAttachments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DocumentAttachments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DocumentId INT NOT NULL,
        OriginalName NVARCHAR(255) NOT NULL,
        FilePath VARCHAR(500) NOT NULL,
        FileSize BIGINT NULL,
        MimeType VARCHAR(100) NULL,
        UploadedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Attachments_Document FOREIGN KEY (DocumentId) REFERENCES dbo.Documents(Id) ON DELETE CASCADE
    );
END
GO

-- 5. Bảng Quy trình Luân chuyển & Xử lý (Document_Processing)
IF OBJECT_ID(N'dbo.DocumentProcessing', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DocumentProcessing (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DocumentId INT NOT NULL,
        AssignedFromId INT NOT NULL,
        AssignedToId INT NOT NULL,
        Instructions NVARCHAR(1000) NULL,
        Deadline DATETIME2 NULL,
        ProgressStatus VARCHAR(30) NOT NULL DEFAULT 'CHUA_XU_LY' CHECK (ProgressStatus IN ('CHUA_XU_LY', 'DANG_XU_LY', 'DA_HOAN_THANH', 'TRA_LAI')),
        ResultNote NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CompletedAt DATETIME2 NULL,
        CONSTRAINT FK_Processing_Document FOREIGN KEY (DocumentId) REFERENCES dbo.Documents(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Processing_FromUser FOREIGN KEY (AssignedFromId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Processing_ToUser FOREIGN KEY (AssignedToId) REFERENCES dbo.Users(Id)
    );
END
GO

-- 6. Bảng Nhật ký Thao tác (Audit_Logs) - Không thể sửa/xóa
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NULL,
        Username VARCHAR(50) NOT NULL,
        Action VARCHAR(100) NOT NULL,
        EntityType VARCHAR(50) NOT NULL,
        EntityId VARCHAR(100) NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress VARCHAR(50) NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_AuditLogs_UserId ON dbo.AuditLogs(UserId);
    CREATE NONCLUSTERED INDEX IX_AuditLogs_Action ON dbo.AuditLogs(Action);
    CREATE NONCLUSTERED INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt);
END
GO

PRINT N'Khởi tạo Cơ sở Dữ liệu QNU_DocFlow trên Microsoft SQL Server thành công!';
