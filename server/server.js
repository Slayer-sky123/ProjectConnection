// server/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const rooms = new Map();

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// quick env visibility (safe)
const show = (v) => (v ? "SET" : "MISSING");
console.log(
  `[env] JWT_SECRET: ${show(process.env.JWT_SECRET)}, ADMIN_JWT_SECRET: ${show(
    process.env.ADMIN_JWT_SECRET
  )}, AI_PROVIDER: ${process.env.AI_PROVIDER || "ollama"}, AI_MODEL: ${
    process.env.AI_MODEL || "llama3.1:latest"
  }`
);

// ---------- DEFAULT ADMIN BOOTSTRAP ----------
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function bootstrapAdmin() {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME, ADMIN_PHONE } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_USERNAME || !ADMIN_PHONE) {
      console.warn("[admin] Skipping admin bootstrap (envs missing)");
      return;
    }
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const username = ADMIN_USERNAME.trim();

    let admin = await User.findOne({ email });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      admin = await User.create({
        name: "Platform Admin",
        username,
        email,
        phone: ADMIN_PHONE,
        password: hash,
        role: "admin",
      });
      console.log("[admin] Default admin created:", email);
    } else {
      let toUpdate = {};
      if (admin.role !== "admin") toUpdate.role = "admin";
      if (admin.username !== username) toUpdate.username = username;
      if (admin.phone !== ADMIN_PHONE) toUpdate.phone = ADMIN_PHONE;

      const same = await bcrypt.compare(ADMIN_PASSWORD, admin.password || "");
      if (!same) {
        const salt = await bcrypt.genSalt(10);
        toUpdate.password = await bcrypt.hash(ADMIN_PASSWORD, salt);
      }
      if (Object.keys(toUpdate).length) {
        await User.updateOne({ _id: admin._id }, { $set: toUpdate });
        console.log("[admin] Default admin ensured/updated:", email);
      } else {
        console.log("[admin] Default admin already present:", email);
      }
    }
  } catch (err) {
    console.error("[admin] Bootstrap failed:", err.message);
  }
}

// Static (e.g., resumes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== API Routes =====
app.use("/api/auth", require("./routes/auth.admin")); // admin auth
app.use("/api/auth", require("./routes/authRoutes")); // student/company auth
app.use("/api/student", require("./routes/student"));
app.use("/api/student/skill-test", require("./routes/student/skillTest"));
app.use("/api/student/skill-pref", require("./routes/student/skillPref")); // <-- NEW

app.use("/api/admin/skills", require("./routes/admin/skills"));
app.use("/api/admin/question-sets", require("./routes/admin/sets"));
app.use("/api/admin/questions", require("./routes/admin/questions"));
app.use("/api/admin/results", require("./routes/admin/results"));
app.use("/api/admin/aptitude", require("./routes/admin/aptitude"));
app.use("/api/admin", require("./routes/admin"));

app.use("/api/student/jobs", require("./routes/student/jobs"));
app.use("/api/student/webinars", require("./routes/student/webinars"));
app.use("/api/student/interviews", require("./routes/student/interviews"));
app.use("/api/student/hackathons", require("./routes/student/hackathons"));

app.use("/api/company/profile", require("./routes/company/profile"));
app.use("/api/company/jobs", require("./routes/company/jobs"));
app.use("/api/company/webinars", require("./routes/company/webinars"));
app.use("/api/company/applications", require("./routes/company/applications"));
app.use("/api/company", require("./routes/company"));

app.use("/student/ai", require("./routes/student.ai"));
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/student/study", require("./routes/student/study"));

app.use("/api/ai", require("./routes/ai"));
app.use("/api/company", require("./routes/company/ai")); 
app.use("/api/student", require("./routes/student/careerRoadmap"));
app.use("/api/student/guidance", require("./routes/student/guidance"));
app.use("/api/university", require("./routes/university/index"));
app.use("/api/student/aptitude-test", require("./routes/student/aptitudeTest"));
app.use("/api/company/screening", require("./routes/company/screening"));
app.use("/api/company/recruiter-tests", require("./routes/company/recruiterTests"));
app.use("/api/student/tests", require("./routes/student/tests"));
app.use("/api/company", require("./routes/company/tests"));
app.use("/api/company", require("./routes/company/results"));
app.use("/api/certificates", require("./routes/certificates"));
app.use("/api/collab", require("./routes/collaborations"));

// ===== Socket.IO on SAME server =====
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

// Socket events
const roomsRef = rooms;
io.on("connection", (socket) => {
  const safeEmit = (id, evt, payload) => {
    try {
      io.to(id).emit(evt, payload);
    } catch {}
  };

  socket.on("auth:identify", ({ userId }) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    socket.data.userId = userId;
  });

  socket.on("createWebinar", ({ roomId, webinarName, hostName }) => {
    if (!roomId) roomId = `room_${Date.now()}`;
    if (!roomsRef.has(roomId)) {
      roomsRef.set(roomId, { host: socket.id, waiting: new Map(), participants: new Map() });
    } else {
      roomsRef.get(roomId).host = socket.id;
    }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = "host";
    socket.emit("webinarCreated", { roomId });

    const r = roomsRef.get(roomId);
    const waiting = [...r.waiting.values()];
    const participants = [...r.participants.values()];
    safeEmit(socket.id, "lobbyUpdate", { waiting, participants });
  });

  socket.on("requestJoin", ({ roomId, username }) => {
    const r = roomsRef.get(roomId);
    if (!r) return socket.emit("error", { message: "Webinar not found" });

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = "student";
    socket.data.username = username || "Student";

    r.waiting.set(socket.id, { socketId: socket.id, username: socket.data.username });
    safeEmit(r.host, "lobbyUpdate", {
      waiting: [...r.waiting.values()],
      participants: [...r.participants.values()],
    });
  });

  socket.on("admit", ({ roomId, socketIds }) => {
    const r = roomsRef.get(roomId);
    if (!r || socket.id !== r.host) return;
    const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
    ids.forEach((sid) => {
      const u = r.waiting.get(sid);
      if (!u) return;
      r.waiting.delete(sid);
      r.participants.set(sid, u);
      safeEmit(sid, "admitted", { roomId });
    });
    safeEmit(r.host, "lobbyUpdate", {
      waiting: [...r.waiting.values()],
      participants: [...r.participants.values()],
    });
  });

  socket.on("deny", ({ roomId, socketIds }) => {
    const r = roomsRef.get(roomId);
    if (!r || socket.id !== r.host) return;
    const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
    ids.forEach((sid) => {
      r.waiting.delete(sid);
      safeEmit(sid, "denied", { roomId });
    });
    safeEmit(r.host, "lobbyUpdate", {
      waiting: [...r.waiting.values()],
      participants: [...r.participants.values()],
    });
  });

  socket.on("signal-offer", ({ target, sdp }) => {
    safeEmit(target, "signal-offer", { from: socket.id, sdp });
  });
  socket.on("signal-answer", ({ target, sdp }) => {
    safeEmit(target, "signal-answer", { from: socket.id, sdp });
  });
  socket.on("signal-ice", ({ target, candidate }) => {
    safeEmit(target, "signal-ice", { from: socket.id, candidate });
  });

  socket.on("chatMessage", ({ roomId, username, message }) => {
    io.to(roomId).emit("chatMessage", { username, message });
  });

  socket.on("disconnect", () => {
    const { roomId, role } = socket.data || {};
    if (!roomId) return;
    const r = roomsRef.get(roomId);
    if (!r) return;

    r.waiting.delete(socket.id);
    r.participants.delete(socket.id);

    if (role === "host") {
      io.to(roomId).emit("webinarEnded");
      roomsRef.delete(roomId);
    } else {
      safeEmit(r.host, "lobbyUpdate", {
        waiting: [...r.waiting.values()],
        participants: [...r.participants.values()],
      });
    }
  });
});

// Server timeouts for AI
server.setTimeout(130000);
server.headersTimeout = 135000;
server.keepAliveTimeout = 130000;

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await bootstrapAdmin();
  console.log(`Server + Socket.IO running on ${PORT}`);
  try {
    const fetch = (...a) => import("node-fetch").then(({ default: f }) => f(...a));
    const r = await fetch(`http://localhost:${PORT}/api/ai/warmup`, { timeout: 30000 });
    console.log("AI warmup:", await r.text());
  } catch (e) {
    console.log("AI warmup skipped:", e.message);
  }
});
