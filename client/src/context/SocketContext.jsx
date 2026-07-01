import {
  createContext, useContext, useEffect,
  useRef, useState, useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth.jsx";
import { useError } from "./ErrorContext.jsx";
import { tokenStore } from "../api.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const accessToken = tokenStore.access;

  useEffect(() => {
    // Only connect when there's an authenticated user
    if (!accessToken || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "", {
      auth:              { token: accessToken },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    socket.on("connect",           () => setConnected(true));
    socket.on("disconnect",        () => setConnected(false));
    socket.on("connect_error", (err) => {
      if (err.message === "AUTH_REQUIRED" || err.message === "AUTH_INVALID") {
        socket.disconnect();
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, user]);   // reconnect whenever the token rotates or user changes

  const subscribe = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const joinRoom  = useCallback((room) => {
    socketRef.current?.emit(room.startsWith("incident:")
      ? "subscribe:incident"
      : "subscribe:area",
      room.split(":")[1],
    );
  }, []);

  const leaveRoom = useCallback((room) => {
    socketRef.current?.emit(room.startsWith("incident:")
      ? "unsubscribe:incident"
      : "unsubscribe:area",
      room.split(":")[1],
    );
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be inside <SocketProvider>");
  return ctx;
}
