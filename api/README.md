# Narensocial - Backend API

## 1. Installation & Setup

### 1.1. Clone Repository

Download the project source code:

```bash
git clone https://github.com/narendravs/Social-mern-app.git
cd Social-mern-app
```

### 1.2. Install Dependencies

Navigate to the server directory and install the backend packages:

```bash
cd api
npm install
```

### 1.3. Environment Configuration

Create a `.env` file in the api root and configure your `MONGO_URL`, `JWT_SECRET`, and `CLOUDINARY` credentials.

### 1.4. Start Server

Run the server using nodemon for development:

```bash
npm start
```

## 2. Tech Stack (Backend)

- **Node.js & Express:** The core runtime and framework for building the RESTful API and handling middleware.
- **MongoDB & Mongoose:** NoSQL database used for storing user profiles, posts, and relationships with Mongoose for schema modeling.
- **Cloudinary & Multer:** Used for handling multipart/form-data and uploading media files directly to the cloud.
- **JWT (JSON Web Tokens):** Implemented for secure, stateless user authentication and authorization.
- **Socket.io:** Enables real-time, bi-directional communication for notifications and chat features.

## 3. Core Libraries & Middleware

- **Security (Helmet & Bcrypt):** Bcrypt is used for password hashing, while Helmet secures Express apps by setting various HTTP headers.
- **Validation (Zod & Express-Validator):** Ensures incoming request data matches the required schema before processing.
- **Utilities (Cookie Parser & CORS):** Cookie-parser for handling JWTs in cookies and CORS for managing cross-origin requests from the React frontend.
- **Documentation (Swagger):** Integrated swagger-ui-express to provide an interactive API playground for testing endpoints.

## 4. API Features

- **Authentication Flow:** Secure signup, login, and token refresh logic.
- **Cloudinary Stream:** Images are received via Multer and immediately streamed to Cloudinary.
- **URL Persistence:** The server only stores the resulting Cloudinary Secure URL string in the MongoDB document, ensuring the database remains lightweight and fast.
- **Rate Limiting:** express-rate-limit implemented to prevent brute-force attacks and API abuse.
- **Real-time Events:** Server-side event emitters for "User Online" status and instant notifications.
