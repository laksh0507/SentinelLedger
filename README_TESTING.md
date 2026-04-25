# 🧪 SentinelLedger Testing Guide

This project uses **Jest** for unit testing and custom scripts for integration testing.

## 1. Running Unit Tests (In-Memory/Mocked)
These tests verify individual logic blocks (Middleware, Utilities, Models) without needing a database.

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode (updates as you save):**
```bash
npm test -- --watch
```

**Run a specific test file:**
```bash
npx jest tests/auth_middleware.test.js
```

---

## 2. Running Integration Tests (Real Database)
The `money_logic_test.js` script performs a full end-to-end "Alice to Bob" transfer audit.

**Prerequisites:**
1. Ensure your `.env` has a valid `MONGO_URI`.
2. Your IP must be whitelisted on MongoDB Atlas.
3. Start the server: `npm run dev`

**Run the audit:**
```bash
node money_logic_test.js
```

---

## 3. Test Coverage
To see how much of your code is covered by tests:
```bash
npx jest --coverage
```

## 4. Current Test Suite
- `tests/api_error.test.js`: Validates custom error formatting.
- `tests/api_response.test.js`: Validates standard API responses.
- `tests/auth_middleware.test.js`: Validates JWT verification and blacklisting logic.
- `money_logic_test.js`: Validates the actual banking math and deadlock prevention.
