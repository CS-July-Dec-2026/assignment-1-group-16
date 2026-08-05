# Classmate Hub — Secure Encrypted Messaging (Lab 1 Part B)

## Overview

Classmate Hub is a simple Node.js and Express web application where students can log in, post a personal message on their page, and manage their passwords. This project (Part B) enhances the original application by implementing **client-side AES-GCM encryption**. Messages are securely encrypted in the browser before submission, ensuring that only ciphertext and an Initialization Vector (IV) are stored in the database. The server never has access to the plaintext message or the user's password.

## Installation & Execution

### Prerequisites
- Node.js 
- npm

### Steps to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CS-July-Dec-2026/assignment-1-group-16.git
   cd assignment-1-group-16
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Default Test Accounts

| Username | Password |
|----------|----------|
| arjun | Football123 |
| meera | SummerFun2024 |
| kabir | ChessMaster9 |
| zara | RainbowUnicorn |

---

## Part B — Changes Made

### Files Modified
| File | Change |
|------|--------|
| `db.js` | Added the `message_iv` TEXT column to the `accounts` table to store the encryption IV. |
| `routes/message.js` | Updated the "Set My Message" form to require a password. Implemented client-side AES-GCM encryption before the form is submitted. The server now only receives and stores the Base64 ciphertext and IV. |
| `routes/account.js` | Modified the account page to display a locked state by default. The message is decrypted entirely client-side using JavaScript when the user provides their password. |

### File Created
| File | Purpose |
|------|---------|
| `public/crypto.js` | A single, centralized file serving as a thin wrapper around the browser's native Web Crypto API. It handles all hashing, encryption, and decryption logic. |

### Files NOT Touched (As per requirements)
- `server.js` — Main server entry point
- `views.js` — Shared HTML page template
- `routes/login.js` — User login logic
- `routes/password.js` — Password change logic

---

## Verification Checklist

- [x] **Locked account page**: Navigating to the account page after setting a message shows a locked state requiring a password.
- [x] **Unlocked/decrypted page**: Entering the correct password reveals the plaintext immediately, without reloading the page.
- [x] **Database shows ciphertext**: Checking the `classmates.db` database directly reveals unreadable Base64 ciphertext in the `message` column, not plaintext.
- [x] **Network tab on Save**: Inspecting the POST request to `/set-message` shows only the `ciphertext` and `iv` being transmitted.
- [x] **Network tab on Unlock**: Clicking "Unlock" generates zero network requests, verifying that decryption is 100% client-side.

---

## How It Works

### Encryption Flow (`/set-message` page)
1. The user enters their message and password on the Set Message page.
2. When the user clicks "Encrypt & Save", JavaScript intercepts the submission (`e.preventDefault()`).
3. The password is hashed using SHA-256 (`crypto.subtle.digest`) to generate a 32-byte hash.
4. This hash is imported as a 256-bit AES-GCM key (`crypto.subtle.importKey`).
5. A fresh, random 12-byte IV is generated (`crypto.getRandomValues`).
6. The plaintext message is encrypted using AES-GCM (`crypto.subtle.encrypt`).
7. The resulting ciphertext and IV are converted to Base64 strings and placed into a dynamically generated hidden form.
8. The form is submitted to the server containing **only** the ciphertext and IV. The plaintext and password never leave the browser.
9. The server saves the ciphertext into the `message` column and the IV into the `message_iv` column in the database.

### Decryption Flow (`/account` page)
1. When the account page loads, if an encrypted message exists, the UI shows a locked state (🔒).
2. The ciphertext and IV are embedded directly into the HTML page as JavaScript variables when the page is rendered by the server.
3. The user enters their password and clicks "Unlock".
4. The `decryptMessage` function in `public/crypto.js` derives the AES key from the password, decodes the Base64 ciphertext and IV, and decrypts the message (`crypto.subtle.decrypt`).
5. This decryption happens **entirely in the browser** without making any new network requests.
6. If the password is correct, the plaintext is revealed. If incorrect, AES-GCM's built-in authentication tag check fails, and an error is displayed.

---

## `public/crypto.js` Functions Explained

| Function | Description | Underlying Web Crypto API Call |
|----------|-------------|--------------------------------|
| `hashPasswordToKey(password)` | Hashes the password with SHA-256 and imports the 32-byte result as an AES-GCM CryptoKey. | `crypto.subtle.digest("SHA-256", ...)` <br> `crypto.subtle.importKey("raw", ...)` |
| `encryptMessage(password, plaintext)` | Generates a random IV, encrypts the plaintext using the derived key, and returns Base64 ciphertext and IV. | `crypto.getRandomValues(...)` <br> `crypto.subtle.encrypt({name:"AES-GCM", ...}, ...)` |
| `decryptMessage(password, ciphertextB64, ivB64)` | Rebuilds the key, decodes the Base64 strings, and decrypts the ciphertext. Throws an error on wrong password. | `crypto.subtle.decrypt({name:"AES-GCM", ...}, ...)` |
| `bufferToBase64(buffer)` | Helper function to convert binary ArrayBuffer to a Base64 string for safe storage. | *(No crypto API)* |
| `base64ToBuffer(base64)` | Helper function to convert a Base64 string back to binary ArrayBuffer for decryption. | *(No crypto API)* |

---
