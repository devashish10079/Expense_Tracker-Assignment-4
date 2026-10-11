# Expense Tracker

A full-stack, responsive personal finance and expense tracking application built with a modern React frontend and a Node.js/Express REST API backed by MongoDB. Designed as a clean SaaS dashboard, Expense Tracker enables individuals to monitor their spending, organize transactions by category, track dates and descriptions, and enforce strict authentication and ownership controls. In addition, an administrative management subsystem allows authorized administrators to audit and manage expenses across the platform.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation and Local Setup](#installation-and-local-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Authentication and Security](#authentication-and-security)
- [Testing & Quality Verification](#testing--quality-verification)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)
- [Future Improvements](#future-improvements)

---

## Features

### 1. User Authentication & Authorization
- **User Registration & Login**: Account creation with secure password hashing via `bcryptjs` and JSON Web Token (JWT) session generation.
- **Client-Side Protected Routes**: Unauthenticated users trying to access `/dashboard` or `/expenses` are automatically redirected to `/login`, with return-route preservation.
- **Role-Based Access Control**: Supports standard `user` and `admin` roles. Route middleware enforces strict isolation between standard user capabilities and administrative controls.

### 2. Expense Management (CRUD)
- **Create Expenses**: Log expenses with title, positive monetary amount (₹), predefined category, transaction date, and optional description.
- **View Personal Expenses**: Real-time list of expenses belonging strictly to the authenticated user, automatically sorted in reverse-chronological order.
- **Update Expenses**: Edit existing expenses inline using a synchronized edit form that pre-populates previous transaction values.
- **Delete Expenses**: Remove transactions with browser-native confirmation prompts to prevent accidental deletions.
- **Strict Data Validation**: Server-side and client-side guards reject missing titles, blank categories, non-positive or non-finite amounts, invalid calendar dates, and malformed MongoDB ObjectIds.

### 3. Admin Expense Management
- **Platform-Wide Visibility**: Dedicated administrative endpoints (`/api/admin/expenses`) allowing administrators to view expenses recorded across all users.
- **Cross-User Record Modification**: Administrators can inspect, update, or remove any expense regardless of which user created it.
- **Access Restrictions**: Non-admin users attempting to invoke administrative endpoints receive an immediate `403 Forbidden` response (`Access denied. Admin only.`).

### 4. Modern Fintech UI & UX
- **Fintech SaaS Dashboard**: Modern aesthetics inspired by modern financial apps, featuring a cohesive deep navy (`#0f172a`), indigo accent (`#4f46e5`), and soft radial glow background.
- **Responsive Grid**: 2-column input grid on desktop and tablet that gracefully collapses into a single-column layout on mobile viewports.
- **Micro-Interactions**: Subtle button elevation, smooth hover cards, input focus rings, and animated feedback banners for errors and successes.
- **Accessibility**: Includes `@media (prefers-reduced-motion: reduce)` rules to respect user motion preferences.

### Status of Features
| Feature | Implementation Status | Notes |
|---|---|---|
| JWT Authentication & Registration | Implemented | Tested with unit test suite |
| Client-Side Protected Routing | Implemented | React Router v6 |
| User Expense CRUD | Implemented | Enforces per-user data ownership |
| Admin Expense Oversight | Implemented | Requires `role: "admin"` |
| Responsive SaaS Interface | Implemented | Pure CSS with mobile breakpoints |
| Data Analytics & Category Charts | *Not Implemented* | Reserved for future improvement |
| CSV / Excel Export | *Not Implemented* | Reserved for future improvement |

---

## Screenshots

> *Note: Screenshot media files are not stored directly in this Git repository. You can launch the application locally by following the [Installation and Local Setup](#installation-and-local-setup) instructions below.*

- **Authentication (`/login`, `/register`)**: Centered card layout with form validation and account switching.
- **Dashboard (`/dashboard`)**: Greeting banner displaying current user profile and navigation shortcuts.
- **Expense Studio (`/expenses`)**: Comprehensive view containing the add/edit expense card, transaction status banners, and elevated interactive expense cards.

---

## Technology Stack

### Frontend
- **Framework**: React 19 (`react` v19.2.8, `react-dom` v19.2.8)
- **Build Tool / Bundler**: Vite 8 (`vite` v8.3.0)
- **Routing**: React Router DOM v6 (`react-router-dom` v6.28.0)
- **Styling**: Pure Modern CSS with CSS Custom Properties, CSS Grid, and Flexbox
- **Typography**: Google Fonts (`Plus Jakarta Sans` & `Inter`)
- **Linting**: ESLint 10 (`eslint` v10.10.0)

### Backend
- **Runtime**: Node.js (v18+ / v20+ recommended, tested on Node v26)
- **Framework**: Express 4 (`express` v4.19.2)
- **Database ODM**: Mongoose 8 (`mongoose` v8.6.1)
- **Security & Tokens**: JSON Web Token (`jsonwebtoken` v9.0.2), `bcryptjs` v2.4.3
- **CORS & Environment**: `cors` v2.8.6, `dotenv` v16.4.5
- **Development Tooling**: Nodemon (`nodemon` v3.1.14)
- **Testing Runner**: Node.js Native Test Runner (`node --test`)

### Database
- **Engine**: MongoDB (local MongoDB instance on port 27017 or MongoDB Atlas Cloud Cluster)

---

## Project Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite)"]
        UI["User Interface (App.jsx)"]
        Form["ExpenseForm.jsx"]
        List["ExpenseList.jsx"]
        API["expenseApi.js (Fetch Wrapper)"]
        Storage[("localStorage (JWT Token & User)")]
    end

    subgraph Server["Backend API (Express 4)"]
        Router["Express Router (/api)"]
        AuthMW["authMiddleware.js (protect, admin)"]
        AuthCtrl["authController.js"]
        ExpCtrl["expenseController.js"]
        AdminCtrl["adminController.js"]
    end

    subgraph Database["Database Tier (MongoDB)"]
        UserCol[("Users Collection")]
        ExpCol[("Expenses Collection")]
    end

    UI --> Form
    UI --> List
    Form --> API
    List --> API
    API <--> Storage
    API -- "HTTP Requests (Bearer JWT)" --> Router

    Router --> AuthMW
    AuthMW --> AuthCtrl
    AuthMW --> ExpCtrl
    AuthMW --> AdminCtrl

    AuthCtrl <--> UserCol
    ExpCtrl <--> ExpCol
    AdminCtrl <--> ExpCol
```

### Architectural Principles
1. **Separation of Concerns**: The frontend is a standalone Single Page Application (SPA), while the backend is a stateless RESTful JSON API.
2. **Stateless Authentication**: Users receive a signed JWT upon login/registration. The client includes this token in the `Authorization: Bearer <token>` header for all authenticated requests.
3. **Data Ownership Isolation**: All individual user queries filter by `{ user: req.user._id }`, preventing users from reading or mutating other accounts' expenses.
4. **Administrative Tiering**: Admin endpoints reside under the `/api/admin` namespace and enforce both token validity (`protect`) and role verification (`admin`).

---

## Folder Structure

```
expense-tracker-crud/
├── README.md                           # Project documentation and developer guide
├── CONTRIBUTIONS.md                    # Detailed attribution of team contributions
├── .gitignore                          # Root Git ignore rules (node_modules, .env, dist)
│
├── backend/
│   ├── .env.example                    # Sample backend environment configuration
│   ├── package.json                    # Backend dependencies and test scripts
│   ├── package-lock.json               # Backend dependency lockfile
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js      # Admin cross-user expense operations
│   │   │   ├── authController.js       # Register, login, and profile controllers
│   │   │   └── expenseController.js    # User-scoped expense CRUD operations
│   │   ├── middleware/
│   │   │   └── authMiddleware.js       # JWT verification (protect) and role check (admin)
│   │   ├── models/
│   │   │   ├── Expense.js              # Expense Mongoose model schema
│   │   │   └── User.js                 # User Mongoose model schema
│   │   ├── routes/
│   │   │   ├── adminRoutes.js          # Routes for /api/admin/expenses
│   │   │   ├── authRoutes.js           # Routes for /api/auth
│   │   │   └── expenseRoutes.js        # Routes for /api/expenses
│   │   └── server.js                   # Express app configuration & DB connection
│   └── test/
│       ├── admin.test.js               # Unit tests for admin expense endpoints
│       ├── auth.test.js                # Unit tests for registration, login, and auth
│       └── expense.test.js             # Unit tests for user expense CRUD & ownership
│
└── frontend/
    ├── .env.example                    # Sample frontend environment configuration
    ├── eslint.config.js                # ESLint configuration
    ├── index.html                      # Single-page HTML entry template
    ├── package.json                    # Frontend dependencies and Vite build scripts
    ├── package-lock.json               # Frontend dependency lockfile
    ├── vite.config.js                  # Vite bundler configuration
    ├── public/
    │   ├── favicon.svg                 # Application favicon
    │   └── icons.svg                   # SVG icon assets
    └── src/
        ├── App.jsx                     # Core application routing & page components
        ├── index.css                   # Fintech design system and styling
        ├── main.jsx                    # React entry root mounting
        ├── api/
        │   └── expenseApi.js           # Fetch-based API client with auth injection
        └── components/
            ├── ExpenseForm.jsx         # Controlled form component with field validation
            └── ExpenseList.jsx         # Card list component for expense records
```

---

## Prerequisites

Before running this project locally, ensure you have installed:
- **Node.js**: Version 18.0.0 or higher (`node -v`)
- **npm**: Version 9.0.0 or higher (`npm -v`)
- **MongoDB**: Either a local instance running on `mongodb://127.0.0.1:27017` or a free cloud cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

---

## Installation and Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/devashish10079/Expense_Tracker-Assignment-4.git
cd Expense_Tracker-Assignment-4
```

### 2. Configure Backend

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your settings (e.g. your MongoDB Atlas URI and a strong JWT secret):
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start listening at `http://localhost:5001`.*

### 3. Configure Frontend

1. Open a new terminal tab, navigate to `frontend`, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create your frontend environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Set the API URL to match your backend port:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   *Vite will print the local server URL (typically `http://localhost:5173`). Open that URL in your browser.*

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `PORT` | Optional | Port on which Express listens | `5001` (defaults to `5000` if omitted) |
| `MONGO_URI` | **Required** | MongoDB connection string (local or Atlas) | `mongodb://127.0.0.1:27017/expense_tracker` |
| `MONGODB_URI` | Optional | Alias for `MONGO_URI` supported by `server.js` | `mongodb+srv://user:pass@cluster.mongodb.net/expense_tracker` |
| `JWT_SECRET` | **Required** | Secret key used to sign and verify JWT tokens | `super_secret_jwt_key_2026` |

> [!IMPORTANT]
> Never commit `.env` files to Git. Both root and child `.gitignore` rules prevent environment files from being tracked.

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `VITE_API_URL` | **Required** | Base URL path for backend API endpoints | `http://localhost:5001/api` |

---

## API Documentation

### Base URL
All API endpoints are prefixed with `/api`.

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body | Response Status |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account | `{ "name": "Alice", "email": "alice@example.com", "password": "password123" }` | `201 Created` / `400 Bad Request` |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive token | `{ "email": "alice@example.com", "password": "password123" }` | `200 OK` / `401 Unauthorized` |
| `GET` | `/api/auth/me` | Protected | Fetch currently authenticated user profile | *None* (Header: `Authorization: Bearer <token>`) | `200 OK` / `401 Unauthorized` |

#### Sample Login Response
```json
{
  "_id": "67096e2bb193a02e604f8101",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Expense Endpoints (`/api/expenses`)

All expense endpoints require an `Authorization: Bearer <token>` header. Operations are automatically scoped to the authenticated user's account.

| Method | Endpoint | Access | Description | Request Body | Response Status |
|---|---|---|---|---|---|
| `GET` | `/api/expenses` | User | Get all expenses belonging to user | *None* | `200 OK` |
| `POST` | `/api/expenses` | User | Create a new expense | `{ "title": "Coffee", "amount": 150, "category": "Food", "date": "2026-10-11", "description": "Coffee with friends" }` | `201 Created` / `400 Bad Request` |
| `GET` | `/api/expenses/:id` | User | Get single expense by ID (must be owned) | *None* | `200 OK` / `404 Not Found` |
| `PUT` | `/api/expenses/:id` | User | Update an expense by ID (must be owned) | `{ "title": "Lunch", "amount": 350 }` | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/api/expenses/:id` | User | Delete an expense by ID (must be owned) | *None* | `200 OK` / `404 Not Found` |

#### Sample Expense Record Response
```json
{
  "_id": "67097c3aa140ef82c7a0129f",
  "title": "Grocery Shopping",
  "amount": 2450.75,
  "category": "Food",
  "date": "2026-10-11T00:00:00.000Z",
  "description": "Weekly essentials",
  "user": "67096e2bb193a02e604f8101",
  "createdAt": "2026-10-11T19:40:00.123Z",
  "updatedAt": "2026-10-11T19:40:00.123Z"
}
```

---

### 3. Admin Expense Endpoints (`/api/admin/expenses`)

Requires both `Authorization: Bearer <token>` and `role: "admin"`. Non-admin tokens receive `403 Forbidden`.

| Method | Endpoint | Access | Description | Response Status |
|---|---|---|---|---|
| `GET` | `/api/admin/expenses` | Admin Only | List all expenses from every user | `200 OK` |
| `GET` | `/api/admin/expenses/:id` | Admin Only | Get any single expense across all users | `200 OK` / `404 Not Found` |
| `PUT` | `/api/admin/expenses/:id` | Admin Only | Update any expense across all users | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/api/admin/expenses/:id` | Admin Only | Delete any expense across all users | `200 OK` / `404 Not Found` |

---

## Authentication and Security

1. **Password Hashing**: Passwords are encrypted before database insertion using `bcryptjs` with salt round cost 10. Raw passwords are never stored.
2. **JWT Token Signing**: Tokens are signed with a 30-day expiration period using `jsonwebtoken`, containing the user ID and role claims.
3. **Password Masking in Responses**: Mongoose `.select('-password')` guarantees password hashes are excluded from profile queries and user lookups.
4. **Data Ownership Verification**: Every individual expense read, update, or delete checks `{ _id: req.params.id, user: req.user._id }`. Requesting an ID owned by another user yields `404 Not Found`, giving zero information about records belonging to others.
5. **Database Credential Masking in Logs**: A custom sanitization utility (`sanitizeDbError`) filters connection errors before logging, ensuring MongoDB connection URIs containing credentials (`mongodb+srv://user:pass@...`) are masked as `***@`.

---

## Testing & Quality Verification

The backend utilizes Node.js's native test runner (`node --test`), eliminating heavy testing framework overhead and providing fast, reproducible test runs.

### Running Backend Unit Tests

```bash
cd backend
npm test
```

### Verified Test Results
```text
✔ admin middleware: blocks non-admin user with 403
✔ admin middleware: allows admin user and calls next
✔ adminGetAllExpenses: returns all expenses regardless of owner
✔ adminGetAllExpenses: returns 500 on database error
✔ adminGetExpenseById: rejects invalid ObjectId
✔ adminGetExpenseById: returns 404 when expense does not exist
✔ adminGetExpenseById: returns expense owned by a different user
✔ adminGetExpenseById: returns 500 on database error
✔ adminUpdateExpense: rejects non-object body
✔ adminUpdateExpense: rejects invalid ObjectId
✔ adminUpdateExpense: rejects blank title
✔ adminUpdateExpense: rejects non-positive amount
✔ adminUpdateExpense: rejects blank category
✔ adminUpdateExpense: returns 404 when expense does not exist
✔ adminUpdateExpense: updates expense owned by another user
✔ adminUpdateExpense: returns 500 on database error
✔ adminDeleteExpense: rejects invalid ObjectId
✔ adminDeleteExpense: returns 404 when expense does not exist
✔ adminDeleteExpense: deletes expense owned by another user and returns success
✔ adminDeleteExpense: returns 500 on database error
✔ normal user is blocked from admin routes via admin middleware
✔ unauthenticated user is blocked from admin routes with 401 via protect middleware
✔ registerUser should return validation error when required fields are missing
✔ registerUser should handle duplicate email errors from MongoDB
✔ generateToken should prefer the configured JWT secret
✔ loginUser should reject invalid password
✔ protect should reject invalid or expired tokens
✔ admin should block non-admin users
✔ createExpense: rejects missing title
✔ createExpense: rejects blank title
✔ createExpense: rejects missing amount
✔ createExpense: rejects zero amount
✔ createExpense: rejects negative amount
✔ createExpense: rejects missing category
✔ createExpense: rejects non-object body
✔ createExpense: creates expense and returns 201
✔ getExpenses: returns array of user expenses
✔ getExpenseById: rejects invalid ObjectId
✔ getExpenseById: returns 404 when expense not found
✔ getExpenseById: returns expense when found and owned
✔ getExpenseById: ownership enforced — another user gets 404
✔ updateExpense: rejects invalid ObjectId
✔ updateExpense: rejects blank title
✔ updateExpense: rejects non-positive amount
✔ updateExpense: returns 404 when expense not found
✔ updateExpense: updates and returns the expense
✔ deleteExpense: rejects invalid ObjectId
✔ deleteExpense: returns 404 when expense not found
✔ deleteExpense: deletes and returns success message
✔ deleteExpense: ownership enforced — another user gets 404

ℹ tests 50 | pass 50 | fail 0
```

### Running Frontend Linter and Build Verification

```bash
cd frontend
npm run lint    # ESLint validation (0 errors, 0 warnings)
npm run build   # Production bundle validation (built in <100ms)
```

---

## Troubleshooting

### 1. `Could not reach the server. Please check your connection and try again.`
- **Cause**: The frontend is attempting to query a backend port that is not running, or `VITE_API_URL` is configured incorrectly.
- **Solution**: Verify what port the backend logged during startup (`Server is running on port 5001`). In `frontend/.env`, make sure `VITE_API_URL=http://localhost:5001/api`.

### 2. MongoDB Atlas Connection Timeout or ServerSelectionError
- **Cause**: IP Whitelisting restrictions in MongoDB Atlas, incorrect credentials, or missing database name.
- **Solution**: Ensure your current IP is added to the MongoDB Atlas Network Access whitelist (`0.0.0.0/0` for development). Verify `MONGO_URI` includes your database name, e.g. `mongodb+srv://<user>:<pass>@cluster.mongodb.net/expense_tracker?retryWrites=true&w=majority`.

### 3. `Invalid expense ID`
- **Cause**: Passing `undefined` or a malformed ID string instead of a valid 24-character hexadecimal MongoDB ObjectId.
- **Solution**: The application uses `expense._id` returned by Mongoose. Ensure the client passes `selectedExpense._id || selectedExpense.id`.

### 4. `EADDRINUSE: address already in use :::5000`
- **Cause**: Another service or process is already occupying port 5000 (such as macOS AirPlay Receiver).
- **Solution**: Change `PORT=5001` in `backend/.env` and adjust `VITE_API_URL` accordingly in `frontend/.env`.

---

## Contributors

Contributions, roles, pull requests, and commit records for all project team members are documented in [CONTRIBUTIONS.md](CONTRIBUTIONS.md).

---

## License

No license file is currently provided in this repository. All rights are reserved by the original authors and project contributors.

---

## Future Improvements

The following items are potential enhancements identified for future development:
1. **Interactive Analytics & Charts**: Visual expense breakdowns by category using Chart.js or Recharts.
2. **Export Capabilities**: Export user expense reports to CSV, Excel, or PDF.
3. **Filtering & Pagination**: Add query parameters (`?category=Food&page=1&limit=10`) on `/api/expenses` for large datasets.
4. **Theme Switcher**: Provide a toggle for Dark / Light mode preference with persistent state.
5. **Monthly Budgets & Alerts**: Allow users to set category budget caps with visual warning thresholds.
