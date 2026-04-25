# <p align="center">🛡️ SentinelLedger</p>
<p align="center"><i>A High-Integrity, ACID-Compliant Fintech Engine for Modern Financial Applications</i></p>

<p align="center">
  <img src="./sentinel_ledger_hero_1777044461784.png" width="600" alt="SentinelLedger Hero">
</p>

---

## 🔍 Problem Statement
Most modern banking applications face three critical technical failures that can lead to financial loss and user distrust:
1.  **Floating-Point Inaccuracy**: JavaScript's native number handling causes `0.1 + 0.2` to equal `0.30000000000000004`, leading to "ghost cents" that break financial audits.
2.  **Race Conditions (Double Spending)**: High-frequency concurrent requests can cause an account to be debited twice before the balance is updated, leading to negative balances.
3.  **Audit Opacity**: Without an immutable ledger, it is impossible to reconstruct a user's financial history if the stored balance is ever corrupted or questioned.

## 💡 The Sentinel Solution
**SentinelLedger** is engineered to be a "Zero-Error" environment by implementing:
- **Integer-Exclusive Math**: By treating all currency as "Paise/Cents" (integers), we achieve 100% mathematical precision.
- **ACID Atomic Sessions**: Every transfer is a "Success or Nothing" operation, preventing partial updates during server crashes.
- **Immutable Ledgering**: Every balance update is backed by an unchangeable audit trail, ensuring every cent is accounted for.

---

## 🚀 Overview
**SentinelLedger** is a production-grade fintech backend designed to handle financial transactions with extreme precision and reliability. Built on the principles of **Double-Entry Bookkeeping** and **ACID Transactions**, it ensures that financial data is immutable, accurate, and secure.

This project solves critical fintech challenges like rounding errors, race conditions, and unauthorized account access using advanced architectural patterns.

---

## 💎 Key Features

### 🔢 **Integer-Exclusive Math (Paise Logic)**
Floating-point errors can lead to "missing cents" in financial apps. SentinelLedger eliminates this by:
- Converting all currency inputs to **Integers (Paise/Cents)** immediately (e.g., `10.50 INR` -> `1050 Paise`).
- Performing all calculations as integers and only converting back to decimals for display.

### 🏛️ **Double-Entry Ledger Architecture**
The Ledger is the "Immutable Source of Truth."
- Every transaction creates a symmetric `DEBIT` and `CREDIT` record.
- **Immutability**: Ledger entries can NEVER be edited or deleted. Errors are corrected only via reversal transactions.
- **Audit Tool**: The `getBalance()` method can recalculate a user's balance from scratch by summing their entire ledger history.

### 🛡️ **Atomic & Safe Transactions**
- **MongoDB Sessions**: Multi-account updates (debiting sender and crediting receiver) are wrapped in ACID sessions. If any part fails, the entire transaction rolls back.
- **Deadlock Prevention**: Sorting Account IDs before locking prevents circular wait states during high-traffic concurrent transfers.
- **Idempotency Protected**: Uses unique keys to ensure that retried requests (due to network blips) never result in duplicate charges.

### 🔐 **Security & Performance**
- **JWT Authentication**: Secure, stateless authentication with **HttpOnly & Secure cookies** to prevent XSS/CSRF.
- **Session Blacklisting**: Provides a way to invalidate tokens upon logout, even though they are stateless.
- **Centralized Error Handling**: A global middleware that ensures consistent, professional error responses across the entire API.

---

## 📊 Project Structure

```text
├── src/
│   ├── controllers/    # Business logic (Auth, Accounts, Transactions)
│   ├── middlewares/    # Security, Validation, and Global Error Handling
│   ├── models/         # MongoDB Schemas (User, Account, Ledger, Blacklist)
│   ├── routes/         # API Route definitions
│   ├── services/       # External services (Email/Nodemailer)
│   ├── utils/          # Standardized ApiError and ApiResponse classes
│   └── app.js          # Express app configuration
├── tests/              # Comprehensive test suite
├── server.js           # Server entry point
└── README.md           # You are here!
```

---

## 📍 API Documentation

### **1. Authentication (`/api/auth`)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Create a new user and send welcome email. |
| `POST` | `/login` | Authenticate and receive a secure JWT cookie. |
| `POST` | `/logout` | Invalidate the session and clear cookies. |

### **2. Account Management (`/api/accounts`)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Open a new currency account (e.g., INR). |
| `GET` | `/` | Fetch all accounts owned by the user. |
| `GET` | `/:accountId` | Get real-time balance and status. |
| `PATCH` | `/close/:accountId` | Soft-close an account (requires zero balance). |
| `DELETE` | `/:accountId` | Permanently delete a closed account record. |

### **3. Transactions (`/api/transactions`)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Execute a P2P transfer (Idempotency Key required). |
| `POST` | `/system/initial-funds` | Admin injection of funds into an account. |
| `GET` | `/statement/:accountId` | Fetch the last 10 entries from the immutable ledger. |

---

## ⚠️ Centralized Error Handling
SentinelLedger uses a specialized `ApiError` class and a global `errorMiddleware` to ensure that every error follows a standard format:

```json
{
    "success": false,
    "statusCode": 400,
    "message": "Insufficient funds in the source account",
    "errors": [],
    "stack": "..." // Only visible in Development
}
```
**Benefits:**
- **Normalized Responses**: No more raw HTML error pages; always returns JSON.
- **Type Detection**: Automatically detects Mongoose `ValidationError` and `CastError` to return the correct HTTP codes (400, 404, etc.).

---

## 📧 Nodemailer & Email Alerts
The system sends automatic emails for registration and transaction receipts using **OAuth2** for high reliability.

### **How to Set Up:**
1.  **Get Gmail App Password**: Go to Google Account -> Security -> 2-Step Verification -> App Passwords.
2.  **Environment Variables**:
    ```env
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

---

## ⚡ Setup & Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/laksh0507/SentinelLedger.git
    cd SentinelLedger
    npm install
    ```

2.  **Environment Setup** (`.env`)
    ```env
    PORT=4444
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=a_long_random_string
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Run Integration Tests**
    ```bash
    node money_logic_test.js
    ```

---

### 🛡️ **Built by lakshmisha**
*Driving the future of secure financial engineering.*
