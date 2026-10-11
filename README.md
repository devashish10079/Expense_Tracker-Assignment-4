# Expense Tracker

A full-stack expense management application that allows users to track their expenses, manage financial records, and monitor spending. It also includes an administrator dashboard for managing expenses across user accounts.

**Live application:** https://expense-tracker-assignment-4.vercel.app

**Backend API:** https://expense-tracker-assignment-4.onrender.com

## Features

### User features
- User registration and login.
- JWT-based authentication.
- Create, view, update, and delete personal expenses.
- Expense ownership and access control.
- Input validation and error handling.

### Administrator features
- Role-based admin authorization.
- Dashboard with cross-user expense statistics.
- View and search expenses across user accounts.
- View, edit, and delete expenses.
- Admin-only navigation and protected routes.

### Security
- Password hashing using bcrypt.
- Server-side authorization for protected operations.
- Public registration cannot assign the administrator role.
- Environment-based JWT and database configuration.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| Frontend deployment | Vercel |
| Backend deployment | Render |

## Project Structure

```text
expense-tracker-crud/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   └── server.js
│   ├── test/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   └── components/
│   ├── test/
│   └── package.json
├── README.md
└── CONTRIBUTING.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or an accessible MongoDB instance
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/devashish10079/Expense_Tracker-Assignment-4.git
cd Expense_Tracker-Assignment-4
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

Use your own MongoDB connection string and a strong, randomly generated JWT secret. Never commit `.env` files or expose credentials in source code.

### 3. Start the backend

```bash
npm run dev
```

The API should be available at `http://localhost:5000` unless you configure a different port.

The root health endpoint is:

```text
GET /
```

### 4. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend listening port |
| `NODE_ENV` | Runtime environment |
| `MONGO_URI` | MongoDB connection string; `MONGODB_URI` is also supported by the backend |
| `JWT_SECRET` | Secret used to sign and verify authentication tokens |
| `CLIENT_ORIGIN` | Allowed frontend origin |
| `VITE_API_URL` | Frontend API base URL |

Set production environment variables in your deployment provider's settings. Do not use real credentials in example files.

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Run frontend tests:

```bash
cd frontend
npm test
npm run lint
npm run build
```

Automated tests cover authentication, expense operations, role-based access, and frontend behavior. Mocked integration tests do not replace testing against a live MongoDB deployment.

## Administrator Access

Administrator privileges are assigned server-side, not through the public registration or login form.

An authorized operator can promote an existing account using the backend's trusted CLI:

```bash
cd backend
npm run promote-admin -- your-registered-email@example.com
```

Ensure the correct database configuration is loaded before running this command. Only promote accounts that should have administrator privileges.

## Deployment

The project uses:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Configure `VITE_API_URL` to point to the deployed backend API with the `/api` suffix. Configure the backend's database connection, JWT secret, and allowed frontend origin in the backend deployment environment.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, coding expectations, testing, and pull-request process.

## License

No license has been specified yet. Unless a license is added to this repository, don't assume that the project is available for unrestricted reuse or redistribution.