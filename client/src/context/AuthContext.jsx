import { createContext, useEffect, useReducer, useCallback } from "react";
import AuthReducer from "./AuthReducer";
import { authAPI } from "../lib/api";

const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  accessToken: localStorage.getItem("accessToken") || null,
  isFetching: false,
  error: false,
  errorMessage: null,
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");

      if (storedUser && storedToken) {
        // Verify token is still valid
        try {
          await authAPI.refreshToken();
        } catch (error) {
          // Token expired, logout
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          dispatch({ type: "LOGOUT" });
        }
      }
    };

    initAuth();
  }, []);

  // Persist user and token to localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
      if (state.accessToken) {
        localStorage.setItem("accessToken", state.accessToken);
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    }
  }, [state.user, state.accessToken]);

  // Login function with validation
  const login = useCallback(async (email, password) => {
    dispatch({ type: "LOGIN_START" });
    console.log(email, password);
    try {
      // Validate input
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await authAPI.login({ email, password });
      const { user, accessToken } = response.data;

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, accessToken },
      });

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Login failed";

      dispatch({
        type: "LOGIN_FAILURE",
        payload: message,
      });

      return { success: false, message };
    }
  }, []);

  // Register function with validation
  const register = useCallback(async (userData) => {
    dispatch({ type: "REGISTER_START" });

    try {
      // Validate input
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error("Username, email, and password are required");
      }

      if (userData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const res = await authAPI.register(userData);
      dispatch({ type: "REGISTER_SUCCESS" });
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed";

      dispatch({
        type: "REGISTER_FAILURE",
        payload: message,
      });

      return { success: false, message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: "RESET_ERROR" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        isFetching: state.isFetching,
        error: state.error,
        errorMessage: state.errorMessage,
        dispatch,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
