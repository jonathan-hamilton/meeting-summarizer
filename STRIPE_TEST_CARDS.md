# Stripe Test Cards for Development

## ✅ Successful Payment Cards

| Card Number | Brand | Description |
|-------------|-------|-------------|
| `4242424242424242` | Visa | Basic successful payment |
| `4000056655665556` | Visa (debit) | Successful debit card payment |
| `5555555555554444` | Mastercard | Basic successful payment |
| `2223003122003222` | Mastercard (2-series) | Successful payment |
| `4000002760003184` | Visa | Successful payment (3D Secure) |

## ❌ Test Failure Scenarios

| Card Number | Description |
|-------------|-------------|
| `4000000000000002` | Card declined |
| `4000000000009995` | Insufficient funds |
| `4000000000009987` | Lost card |
| `4000000000009979` | Stolen card |
| `4000000000000069` | Expired card |
| `4000000000000127` | Incorrect CVC |

## 📝 Test Details for All Cards
- **Expiry Date**: Any future date (e.g., `12/28`)
- **CVC**: Any 3-digit number (e.g., `123`)
- **ZIP**: Any 5-digit number (e.g., `12345`)
- **Name**: Any name

## 🔍 Testing Flow
1. Navigate to token purchase dialog
2. Select a token package
3. Use test card numbers above
4. Complete payment flow
5. Check Stripe dashboard for test transactions

## 📊 Stripe Dashboard (Test Mode)
- Login to Stripe Dashboard
- Ensure you're in "Test Mode" (toggle in top-left)
- View transactions in Payments section