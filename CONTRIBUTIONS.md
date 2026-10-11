# Project Contributions Record

This document provides a detailed, evidence-based record of contributions to the **Expense Tracker** project ([`devashish10079/Expense_Tracker-Assignment-4`](https://github.com/devashish10079/Expense_Tracker-Assignment-4)). Attribution is derived directly from the verified Git commit history, pull request records, merge commits, and code artifacts available in the repository.

---

## 1. Contributors Summary Table

| Contributor | Role / Area | Main Contributions | Relevant PRs & Branches |
|---|---|---|---|
| **Devashish Kumar**<br>(`@devashish10079`) |  Project Lead | • Project structure setup & configuration<br>• PR #8 merge conflict resolution<br>• Issue #3: Expense CRUD REST API & Unit Tests<br>• Issue #6: Admin Expense Management & Unit Tests<br>• MongoDB Expense ID handling bug fix<br>• Frontend SaaS UI Modernization (CSS)<br>• Comprehensive project documentation | • [PR #1](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/1) *(Merged)*<br>• [PR #12](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/12) *(Merged)*<br>• [PR #13](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/13) *(Merged)*<br>• Branch `fix/expense-id-handling`<br>• Branch `style/expense-tracker-ui` |
| **Rahim Gehlot**<br>(`@rahimuddin140` / `@rahimgehlot`) | Backend & Auth Engineer | • Backend JWT authentication & authorization<br>• User model & bcrypt password hashing<br>• Auth middleware (`protect`, `admin`)<br>• Frontend auth integration & protected routes<br>• Reviewer & merger of PR #12 and PR #13 | • [PR #8](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/8) *(Merged)*<br>• [PR #11](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/11) *(Merged)* |
| **Shubham Rai**<br>(`@shubhamrai9122-creator`) | Frontend Engineer | • Expense Form component & client validation<br>• Frontend API client (`expenseApi.js`)<br>• Expense List component & dashboard view<br>• Currency formatting & delete confirmation | • [PR #9](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/9) *(Merged)*<br>• [PR #10](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/10) *(Merged)* |

---

## 2. Detailed Individual Contributions

### Devashish Kumar (`@devashish10079`)

**Role**: Project Architecture & Integration

#### Features & Modules Implemented
1. **Initial Project Architecture & Setup**:
   - Initialized root project configuration, separating frontend (React/Vite) and backend (Express).
   - Set up root repository structure, environment templates (`.env.example`), and `.gitignore` rules.
   - Associated PR: [Pull Request #1: chore/project-setup](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/1) *(Merged)*.
   - Commits: `70a55d9`, `2b4d2a9`, `244c26a`.

2. **Authentication Merge Conflict Resolution (PR #8)**:
   - Resolved merge conflicts arising between `origin/main` and `feature/authentication`.
   - Unified `backend/package.json` dependencies and resolved duplicate database connection logic in `server.js`.
   - Commit: `aa3a68e` (`merge: resolve main conflicts in authentication`).
   - Merged PR #8 into `main` (`458589f`).

3. **Issue #3: Expense CRUD REST API (PR #12)**:
   - Created the Mongoose `Expense` model schema (`backend/src/models/Expense.js`) with required fields, title/category trimming, positive amount validation, default timestamp dates, and reference to the `User` model.
   - Implemented `backend/src/controllers/expenseController.js` supporting `createExpense`, `getExpenses`, `getExpenseById`, `updateExpense`, and `deleteExpense`.
   - Enforced strict ownership isolation: every single query checks `{ user: req.user._id }`.
   - Built comprehensive automated unit tests in `backend/test/expense.test.js` validating input checks, missing fields, malformed ObjectIds, ownership enforcement, and database error handling.
   - Associated PR: [Pull Request #12: feature/expense-crud-api](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/12) *(Merged into main as `00855ff`)*.
   - Commit: `42612cb` (`feat(expenses): implement expense CRUD API`).

4. **Issue #6: Admin Expense Management (PR #13)**:
   - Developed administrative expense controllers in `backend/src/controllers/adminController.js`:
     - `adminGetAllExpenses`: Retrieve expenses from all users across the platform.
     - `adminGetExpenseById`: Inspect any user's expense by ObjectId.
     - `adminUpdateExpense`: Update any expense record across users.
     - `adminDeleteExpense`: Delete any expense record across users.
   - Defined admin routes in `backend/src/routes/adminRoutes.js` using `protect` and `admin` middleware.
   - Mounted routes at `/api/admin` in `backend/src/server.js`.
   - Created extensive unit tests in `backend/test/admin.test.js` covering admin access, non-admin 403 blocks, unauthenticated 401 blocks, invalid IDs, missing expenses, and database error masking.
   - Associated PR: [Pull Request #13: feature/admin-expense-management](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/13) *(Merged into main as `f2507eb`)*.
   - Commit: `848cb51` (`feat(admin): add admin expense management`).

5. **MongoDB Expense ID Handling Bug Fix**:
   - Investigated and resolved the runtime issue where clicking **Edit** and **Update** failed with `PUT /api/expenses/undefined 400 (Bad Request)`.
   - Identified that Mongoose returns documents with `_id`, while the frontend code was expecting `id`.
   - Updated `frontend/src/App.jsx` and `frontend/src/components/ExpenseList.jsx` to support `expense._id || expense.id`.
   - Added validation guards in `frontend/src/api/expenseApi.js` ensuring requests with falsy or undefined IDs are rejected before network transmission.
   - Resolved the React missing `key` warning in `ExpenseList.jsx`.
   - Commit: `9dbd069` (`fix(expenses): handle MongoDB expense IDs correctly`), pushed to branch `origin/fix/expense-id-handling`.

6. **Frontend UI Modernization (CSS Only)**:
   - Redesigned the entire frontend interface into a modern fintech SaaS dashboard using pure CSS in `frontend/src/index.css`.
   - Introduced a unified design system with `Plus Jakarta Sans` typography, deep navy headings, indigo accent colors, soft radial background glow, 2-column responsive grid forms, elevated expense cards, and micro-interaction animations.
   - Preserved all React components, IDs, class names, and JavaScript functionality.
   - Commits: `2420fd8` (branch `fix/expense-id-handling`), `fbdb324` (branch `style/expense-tracker-ui`, pushed to `origin/style/expense-tracker-ui`).

7. **Project Documentation**:
   - Authored complete, production-grade `README.md` and `CONTRIBUTIONS.md` documentation based on verified implementation.

---

### Rahim Gehlot (`@rahimuddin140` / `@rahimgehlot`)

**Role**: Backend Authentication & Middleware Specialist

#### Features & Modules Implemented
1. **Backend Authentication & Authorization (PR #8)**:
   - Designed the `User` schema in `backend/src/models/User.js` with password hashing and role specification (`user` or `admin`).
   - Implemented JWT token generation and authentication controllers in `backend/src/controllers/authController.js` (`registerUser`, `loginUser`, `getMe`).
   - Created security middleware in `backend/src/middleware/authMiddleware.js`:
     - `protect`: Verifies JWT Bearer token and extracts user context.
     - `admin`: Enforces administrative role authorization.
   - Configured authentication endpoints in `backend/src/routes/authRoutes.js`.
   - Added automated authentication tests in `backend/test/auth.test.js`.
   - Associated PR: [Pull Request #8: feature/authentication](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/8) *(Merged)*.
   - Commits: `6b30e99`, `a033232`.

2. **Frontend Authentication & Protected Routes (PR #11)**:
   - Built client-side authentication management in `frontend/src/App.jsx`.
   - Implemented `getStoredUser`, `getStoredToken`, `saveAuth`, and `clearAuth` using browser `localStorage`.
   - Created the `ProtectedRoute` component to prevent unauthorized access to private views.
   - Developed `AuthPage` supporting dynamic switching between Registration and Login modes.
   - Developed `DashboardPage` displaying user information and logout functionality.
   - Associated PR: [Pull Request #11: feature/frontend-auth](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/11) *(Merged)*.
   - Commits: `1a2dc6b`, `03565d8`.

3. **Code Reviews and Pull Request Merges**:
   - Reviewed and merged [Pull Request #12](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/12) (`00855ff`).
   - Reviewed and merged [Pull Request #13](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/13) (`f2507eb`).

---

### Shubham Rai (`@shubhamrai9122-creator`)

**Role**: Frontend UI & Expense Form Specialist

#### Features & Modules Implemented
1. **Expense Form & API Client Integration (PR #9)**:
   - Created `frontend/src/components/ExpenseForm.jsx` with input controls for Title, Amount (₹), Category select dropdown, Date, and Description.
   - Implemented client-side input validation and error notifications.
   - Developed `frontend/src/api/expenseApi.js` providing fetch helper methods (`getExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`).
   - Closes Issue #7.
   - Associated PR: [Pull Request #9: feature/expense-form-api](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/9) *(Merged)*.
   - Commits: `771a85d`, `7dd1047`.

2. **Expense List UI & Dashboard View (PR #10)**:
   - Created `frontend/src/components/ExpenseList.jsx` rendering transaction items with title, amount, category tag, and date.
   - Implemented Indian Rupee (`en-IN`) currency formatting utility.
   - Added interactive Edit and Delete trigger buttons with browser deletion confirmation.
   - Closes Issue #4.
   - Associated PR: [Pull Request #10: feature/expense-dashboard](https://github.com/devashish10079/Expense_Tracker-Assignment-4/pull/10) *(Merged)*.
   - Commits: `19c1434`, `eec9a0d`.

---

## 3. Collaborative Work & Shared Attribution

Throughout the project lifecycle, the team collaborated across pull request reviews, branch integrations, and merge conflict resolutions:

1. **Project Setup & Base Integration**:
   - Devashish Kumar initialized the core project structure (PR #1) which served as the foundation for both backend authentication and frontend development.
2. **Merge Conflict Resolution & Pipeline Alignment**:
   - When merging `origin/main` into the authentication branch (PR #8) and subsequent feature branches (PR #9, PR #10), Devashish Kumar and Shubham Rai resolved dependency conflicts in `package.json` and synchronized route registrations in `server.js`.
3. **Peer Review & Merges**:
   - Devashish Kumar reviewed and merged PR #1, PR #8, PR #9, PR #10, and PR #11 into `main`.
   - Rahim Gehlot reviewed and merged PR #12 and PR #13 into `main`.
4. **End-to-End Bug Fixing**:
   - The integration of MongoDB with the frontend exposed an ID naming mismatch (`_id` vs `id`). Devashish Kumar resolved this end-to-end in `fix/expense-id-handling`, bridging the frontend components authored by Shubham Rai with the Mongoose models authored by Rahim Gehlot and Devashish Kumar.

---

## 4. Verification & Commit Status

All contributions listed in this document have been cross-referenced against the repository's active Git history:

- **Merged Pull Requests into `main`**:
  - `PR #1`: `e3fad2c` (Chore: project setup)
  - `PR #8`: `458589f` (Feat: backend authentication & authorization)
  - `PR #9`: `75fa471` (Feat: expense form & API integration)
  - `PR #10`: `d643d86` (Feat: expense dashboard & list UI)
  - `PR #11`: `e192a60` (Feat: frontend authentication & protected routes)
  - `PR #12`: `00855ff` (Feat: expense CRUD REST API)
  - `PR #13`: `f2507eb` (Feat: admin expense management)

- **Dedicated Fix and Enhancement Branches**:
  - `origin/fix/expense-id-handling`: Commit `9dbd069` *(Pushed to remote)*
  - `origin/style/expense-tracker-ui`: Commit `fbdb324` *(Pushed to remote)*
