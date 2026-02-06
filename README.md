# Uly Dala Coffee

A coffee shop ordering platform built with Node.js, Express, and MongoDB Atlas. Users can register, log in, manage their profile, and place coffee orders with real-time status updates. Staff roles (admin/barista) can manage order status and deletes, while premium users can submit priority orders.

## Project Overview

**Core features**
- JWT authentication with secure password hashing.
- Role-based access control (admin, barista, premium user, user).
- Order management (create, list, update, delete) tied to the logged-in user.
- SMTP email integration for welcome and order status updates.
- Responsive front-end UI served from Express.

**Tech stack**
- Node.js + Express
- MongoDB Atlas + Mongoose
- Joi validation
- JWT + bcrypt
- Nodemailer (SMTP)

## Setup Instructions

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file using the template below:

```bash
cp .env.example .env
```

Update `.env` with your MongoDB Atlas connection string, SMTP credentials, and:
- `APP_URL` (public base URL used in email links).
- `PASSWORD_RESET_EXPIRES_MINUTES` (reset link lifetime, default `15`).

### 3) Run the server

```bash
npm run dev
```

The API will be available at `http://localhost:4000` and the UI at `http://localhost:4000`.

## API Documentation

### Authentication (Public)

**POST /register** (also available as `/api/auth/register`)
- Register a new user with hashed password.

Request body:
```json
{
  "username": "coffee_lover",
  "email": "coffee@example.com",
  "password": "Pass1234",
  "role": "user"
}
```

**POST /login** (also available as `/api/auth/login`)
- Authenticate and return a JWT.

Request body:
```json
{
  "email": "coffee@example.com",
  "password": "Pass1234"
}
```

**POST /forgot-password** (also available as `/api/auth/forgot-password`)
- Send a password reset link to the email if an account exists.

Request body:
```json
{
  "email": "coffee@example.com"
}
```

**POST /reset-password/:token** (also available as `/api/auth/reset-password/:token`)
- Reset password using token from email and return a new JWT.

Request body:
```json
{
  "password": "Pass1234",
  "passwordConfirm": "Pass1234"
}
```

### User Management (Private)

**GET /users/profile** (also available as `/api/users/profile`)
- Retrieve the logged-in user's profile.

**PUT /users/profile** (also available as `/api/users/profile`)
- Update username and/or email.

### Orders (Private)

**POST /orders** (also available as `/api/orders`)
- Create a new order for the logged-in user.

Request body:
```json
{
  "items": [
    { "name": "Latte", "size": "medium", "price": 4.5, "quantity": 1 }
  ],
  "notes": "Extra hot",
  "pickupTime": "2026-02-01T10:30:00.000Z",
  "priority": false
}
```

**GET /orders** (also available as `/api/orders`)
- Retrieve all orders for the logged-in user.
- Staff can use `?all=true` to view all orders.

**GET /orders/:id** (also available as `/api/orders/:id`)
- Retrieve a specific order by ID (owner or staff).

**PUT /orders/:id** (also available as `/api/orders/:id`)
- Update an order (owner can cancel, staff can update status).

**DELETE /orders/:id** (also available as `/api/orders/:id`)
- Delete an order (admin only).

## Roles & RBAC

- **User**: Create, view, and cancel their own orders.
- **Premium user**: Same as user + priority orders.
- **Moderator/Admin**: Can update status for any order, and delete orders.

## Screenshots

> Stored in `docs/screenshots`. Replace these with real UI screenshots after running the app.

- **Login & Registration**
  ![Login screen](docs/screenshots/login.svg)

- **Order Creation**
  ![Order creation](docs/screenshots/orders.svg)

- **Dashboard Overview**
  ![Dashboard](docs/screenshots/dashboard.svg)

## Deployment

You can deploy to Render, Railway, or Replit.

1. Push this repository to GitHub.
2. Create a new service on Render/Railway.
3. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, SMTP credentials).
4. Deploy and share the live URL.

## Project Structure

```
config/
  db.js
controllers/
  authController.js
  orderController.js
  userController.js
middleware/
  auth.js
  errorHandler.js
  roles.js
  validate.js
models/
  Order.js
  User.js
public/
  app.js
  index.html
  styles.css
routes/
  authRoutes.js
  orderRoutes.js
  userRoutes.js
services/
  emailService.js
utils/
  appError.js
  asyncHandler.js
validators/
  authValidators.js
  orderValidators.js
  userValidators.js
```

## Notes for Defence

- Explain why JWT is used for stateless auth and how bcrypt protects stored passwords.
- Walk through RBAC decisions for order status updates.
- Highlight MongoDB Atlas usage and environment variable security.
