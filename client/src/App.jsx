import React, { Suspense, lazy, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { CircularProgress, Box } from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Lazy load components for better performance
const Login = lazy(() => import("./pages/login/login"));
const Home = lazy(() => import("./pages/home/home"));
const Register = lazy(() => import("./pages/register/register"));
const Profile = lazy(() => import("./pages/profile/profile"));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      bgcolor: "#f0f2f5",
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
