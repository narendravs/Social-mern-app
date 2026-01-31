import { createContext, useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (user && token) {
      console.log("Attempting to connect socket with user:", user._id);
      // Only connect if no socket exists
      const newSocket = io(
        import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
        {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
        },
      );

      newSocket.on("connect", () => {
        console.log("Socket connected successfully. ID:", newSocket.id);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
    // Cleanup if user logs out
    if (!user && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => {
  return useContext(SocketContext);
};
