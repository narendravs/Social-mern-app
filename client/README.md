# Narensocial - MERN Stack Social Media Platform

A full-featured social networking application built with the MERN stack, featuring real-time notifications, secure JWT authentication, and Cloudinary media integration.

## 1. Installation & Setup

### 1.1. Download the Project

Clone the project from the following repository:

```bash
git clone https://github.com/narendravs/Social-mern-app.git
cd Social-mern-app
```

### 1.2. Install Dependencies

Navigate to the client directory and install the necessary packages:

```bash
cd client
npm install
```

### 1.3. Start the Application

Launch the development server:

```bash
npm start
```

## 2. Tech Stack (Client-Side)

- **React:** The core library used for building the component-based User Interface.
- **Axios:** Used for handling all asynchronous API requests and implementing interceptors for token management.
- **React Router & DOM:** Used for navigating the pages across the application and managing URL synchronization.
- **Context API:** Used to maintain the global state of the application, such as user authentication and theme settings.

## 3. Key Features

- **Login & Register:** Fully functional authentication system allowing users to create accounts and securely access the platform.
- **JWT Authentication:** Secure user sessions using JSON Web Tokens with implemented silent refresh logic and protected routing.
- **Cloudinary Integration:** High-performance image uploads and storage, saving secure image URLs directly in the database to keep the server lightweight.
- **Real-time Interaction:** Live notifications and typing indicators powered by Socket.io and Redis for instant user feedback.
- **Dynamic Feed:** A live wall where users can post updates, share images, and engage with content from their network.
- **Social Graph:** Advanced user profile management including follow/unfollow mechanics and real-time status updates.
