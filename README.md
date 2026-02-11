# Uly Dala Coffee

Uly Dala Coffee is a full-stack coffee ordering platform built with Node.js, Express, MongoDB, and a responsive vanilla JS frontend.

Users can register, log in, browse products, place orders, and track order status. Role-based access control is implemented for `user`, `premium`, `barista`, and `admin`.

## Links

- Repository: `https://github.com/commedeschamps/Uly-Dala-Coffee`
- Live App: `https://coffee-shop.commedeschamps.dev`

## Features

- JWT authentication with bcrypt password hashing
- Role-based access control (RBAC)
- Product catalog and admin product CRUD
- Order lifecycle management
- Password reset via email token flow
- SMTP email notifications (welcome, password reset, order status updates)
- Responsive frontend served by Express

## Tech Stack

- Node.js
- Express 5
- MongoDB Atlas + Mongoose
- Joi validation
- JWT (`jsonwebtoken`)
- bcrypt
- Nodemailer (SMTP)
- HTML/CSS/Vanilla JavaScript

## Repository Structure

```text
config/
  db.js
controllers/
  authController.js
  orderController.js
  productController.js
  userController.js
middleware/
  auth.js
  errorHandler.js
  roles.js
  validate.js
models/
  Order.js
  Product.js
  User.js
public/
  *.html
  app.js
  css/
  js/
routes/
  authRoutes.js
  orderRoutes.js
  productRoutes.js
  userRoutes.js
scripts/
  seedProducts.js
  updateProductImages.js
services/
  emailService.js
utils/
  appError.js
  asyncHandler.js
validators/
  authValidators.js
  orderValidators.js
  productValidators.js
  userValidators.js
server.js
```

## Architecture Overview

Request flow:

1. Route receives request (`routes/*`).
2. Middlewares run (auth, roles, validation).
3. Controller executes business logic.
4. Models persist/read data from MongoDB.
5. Errors are normalized by global `errorHandler`.

Key layers:

- `routes/*`: endpoint definitions
- `middleware/auth.js`: JWT verification and `req.user`
- `middleware/roles.js`: role checks
- `middleware/validate.js`: Joi request body validation
- `controllers/*`: domain logic
- `models/*`: Mongoose schemas
- `services/emailService.js`: SMTP integration

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Set values in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | App port, default `4000` |
| `MONGODB_URI` | MongoDB Atlas URI |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT TTL, example `7d` |
| `APP_URL` | Public app URL used in emails |
| `PASSWORD_RESET_EXPIRES_MINUTES` | Reset token lifetime |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | `true/false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password/app password |
| `SMTP_FROM` | Sender name/email |

### 3. Run the app

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Local URLs:

- App: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

### 4. Optional seed scripts

```bash
npm run seed
npm run seed:images
```

## NPM Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start server with nodemon |
| `npm start` | Start server with node |
| `npm run seed` | Seed product catalog |
| `npm run seed:images` | Update product image URLs |

## Authentication and Authorization

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

Roles:

- `user`
- `premium`
- `barista`
- `admin`

Role summary:

- `user`: own profile, own orders, can cancel own pending orders
- `premium`: `user` permissions + can set `priority` on orders
- `barista`: can view all orders and update order `status` only
- `admin`: full product management and full order control

## API Reference

Base URL:

`/api`

Note:

Compatibility aliases without `/api` are mounted too, but `/api` should be preferred.

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

Register body example:

```json
{
  "username": "coffee_lover",
  "email": "coffee@example.com",
  "password": "Pass1234",
  "role": "user"
}
```

Login body example:

```json
{
  "email": "coffee@example.com",
  "password": "Pass1234"
}
```

Reset body example:

```json
{
  "password": "Pass1234",
  "passwordConfirm": "Pass1234"
}
```

### Users

- `GET /api/users/profile` (Bearer)
- `PUT /api/users/profile` (Bearer)

Update profile body example:

```json
{
  "username": "new_name",
  "email": "new@email.com"
}
```

### Products

- `GET /api/products` (public)
- `GET /api/products/:id` (public)
- `POST /api/products` (`admin`)
- `PUT /api/products/:id` (`admin`)
- `DELETE /api/products/:id` (`admin`)

Create product body example:

```json
{
  "name": "Latte",
  "category": "Beverage",
  "description": "Smooth espresso with milk",
  "imageUrl": "/images/latte.jpeg",
  "isAvailable": true,
  "sizes": [
    { "label": "small", "price": 1800 },
    { "label": "medium", "price": 2100 },
    { "label": "large", "price": 2400 }
  ]
}
```

### Orders

- `POST /api/orders` (Bearer)
- `GET /api/orders` (Bearer)
- `GET /api/orders/all` (`admin`, `barista`)
- `GET /api/orders/:id` (Bearer)
- `PUT /api/orders/:id` (Bearer)
- `DELETE /api/orders/:id` (Bearer)

Create order body example:

```json
{
  "items": [
    { "product": "64f0b2d26a7f4b6a9f001234", "size": "medium", "quantity": 1 }
  ],
  "notes": "Extra hot",
  "pickupTime": "2026-02-20T10:30:00.000Z",
  "priority": false
}
```

Order behavior highlights:

- `priority: true` allowed for `premium` and staff
- `barista` can update only `status`
- `user/premium` can cancel only own pending orders
- `admin` can update/delete any order

## Validation and Error Handling

- Joi schemas in `validators/*`
- Validation middleware in `middleware/validate.js`
- Global error middleware in `middleware/errorHandler.js`

Typical statuses:

- `400` bad request or validation errors
- `401` missing/invalid/expired token
- `403` forbidden by role or ownership rules
- `404` resource not found
- `500` internal server error

## Password Reset Flow

1. Client sends `POST /api/auth/forgot-password`.
2. Backend generates a one-time reset token and stores only its hash in DB.
3. User receives email with reset link.
4. Client sends `POST /api/auth/reset-password/:token`.
5. Backend validates token expiry, updates password, issues new JWT.

## Frontend Routes

- `/` Home
- `/auth.html` Auth (register/login/forgot/reset)
- `/products.html` Menu
- `/checkout.html` Cart and checkout
- `/dashboard.html` Orders
- `/account.html` Profile
- `/admin.html` Admin dashboard
- `/barista.html` Barista station

## Postman Quick Test Flow

1. Register a user.
2. Login and save JWT.
3. Call `GET /api/users/profile` with and without token.
4. Create order as user.
5. Verify role-based access (`403` for restricted endpoints).
6. Promote a user in DB to `admin`/`barista`, login again, retest.


## Deployment Notes

You can deploy on Render, Railway, or Replit or whatever else you like.

Basic steps:

1. Push repository to GitHub.
2. Create web service.
3. Set environment variables from `.env.example`.
4. Verify `/api/health`.

## Screenshots

### Home

![Home](docs/screenshots/home_page.png)

### Checkout

![Checkout](docs/screenshots/checkout.png)

### Barista

![Barista](docs/screenshots/barista.png)

### Menu

![Menu](docs/screenshots/menu.png)
