// src/lib/socket.js
import { io } from "socket.io-client";
import API from "../api/axios";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  // Reuse the same API origin and token
  const baseURL = API.defaults.baseURL || (typeof window !== "undefined" ? window.location.origin : "");
  const token = localStorage.getItem("token"); // or however you store it

  socket = io(baseURL, {
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
}
