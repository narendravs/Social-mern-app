# Narensocial - Full Stack MERN Application

Narensocial is a modern social media platform built for real-time interaction, secure content sharing, and seamless user networking.

## 1. Technologies

| Layer        | Tech Stack                                           |
| ------------ | ---------------------------------------------------- |
| **Frontend** | React, Axios, React Router, Context API, Material UI |
| **Backend**  | Node.js, Express.js, Socket.io, Multer               |
| **Database** | MongoDB (Mongoose ODM), Redis (Socket Caching)       |
| **Cloud**    | Cloudinary (Image Hosting)                           |

## 2. Features

### 2.1. Application Features

- **Authentication:** Secure registration and login using JWT (JSON Web Tokens) with automated token refresh logic.
- **Dynamic Feed:** Create, view, and delete posts with cloud-hosted images.
- **Social Interactions:** Like and unlike posts to engage with content.
- **Commenting System:** Real-time discussion on shared posts.
- **Social Graph:** Follow and unfollow users to customize your personalized feed.
- **Real-time Notifications:** Instant feedback for likes, follows, and typing indicators via Socket.io.

### 2.2. API Features

- **Media Management:** Secure image uploads to Cloudinary with only URL persistence in the database.
- **Security:** Password hashing with Bcrypt, request rate limiting, and HTTP header protection via Helmet.
- **Validation:** Strict data schema enforcement using Zod and Express-Validator.

### 2.3. Client Features

- **Global State:** Centralized user and auth management using React Context API.
- **Optimized UX:** High-performance forms using useRef and responsive layouts with Material UI.

## 3. Environment Variables

To run this project, you will need to add the following variables to your `.env` files:

**API (`/api/.env`):**

```env
MONGO_URL=your_mongo_url
JWT_ACCESS_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Client (`/client/.env`):**

```env
VITE_API_URL=http://localhost:8800/api
VITE_SOCKET_URL=http://localhost:8800
VITE_PUBLIC_FOLDER=http://localhost:8800/images/
```

## 4. Installation & Setup

### 4.1. Clone the Repository

```bash
git clone https://github.com/narendravs/Social-mern-app.git
cd social-mern-app
```

### 4.2. Setup the Server (API)

```bash
cd api
npm install

# Ensure you create a .env file with your MONGO_URL and JWT secrets

npm start
```

### 4.3. Setup the Client

```bash
# Open a new terminal

cd client
npm install --legacy-peer-deps
npm start
```
