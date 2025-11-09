import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import io from "socket.io-client";
import {
  ArrowLeft, MessageCircle, Info, Smile, Maximize2, Minimize2,
  MicOff, VideoOff, ScreenShare, PhoneOff
} from "lucide-react";
import useLocalMedia from "../../hooks/useLocalMedia";

const socket = io(import.meta.env.VITE_API_BASE || "http://localhost:5000", { transports: ["websocket"] });
const PANEL_W = 360;

const Pill = ({ active, children, onClick, title }) => (
  <button type="button" title={title} onClick={onClick}
    className={`px-3 h-9 rounded-full border text-sm flex items-center gap-2 transition
      ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white/90 hover:bg-white border-black/10 text-gray-800"}`}>
    {children}
  </button>
);

const ChatPanel = ({ messages, me, onSend }) => {
  const inputRef = useRef(null);
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 h-12 border-b border-black/10 flex items-center font-semibold">In‑call messages</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : messages.map((m, i) => (
          <div key={i}>{m.system ? <span className="italic text-gray-500">{m.message}</span> : (<><b className={m.username===me?"text-blue-600":""}>{m.username}: </b><span>{m.message}</span></>)}</div>
        ))}
      </div>
      <div className="p-3 border-t border-black/10 flex gap-2">
        <input ref={inputRef} className="flex-1 border rounded-md px-3 h-10" placeholder="Send a message"
          onKeyDown={(e)=>{ if(e.key==="Enter"){ const v=inputRef.current?.value?.trim(); if(v){ onSend(v); inputRef.current.value=""; }}}}/>
        <button onClick={()=>{ const v=inputRef.current?.value?.trim(); if(v){ onSend(v); inputRef.current.value=""; }}} className="h-10 px-4 rounded-md bg-blue-600 text-white">Send</button>
      </div>
    </div>
  );
};

const StudentInfoPanel = () => (
  <div className="h-full flex flex-col">
    <div className="px-4 h-12 border-b border-black/10 flex items-center font-semibold">Info</div>
    <div className="p-4 text-sm space-y-3">
      <p>Welcome! The host controls the meeting.</p>
      <div>
        <p className="font-medium mb-1">Shortcuts</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">C</kbd> — Toggle chat</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">I</kbd> — Toggle info</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">M</kbd> — Mute</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">V</kbd> — Camera</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">P</kbd> — Present</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">F</kbd> — Fullscreen</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">R</kbd> — React 🙂</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function StudentWebinarViewer() {
  const { roomId } = useParams();
  const me = "Student";
  const stageRef = useRef(null);

  // media hook
  const {
    videoRef, muted, cameraOff, presenting,
    toggleMute, toggleCamera, togglePresent, stopAll, ensureStream
  } = useLocalMedia();

  const [connected, setConnected] = useState(false);
  const [panel, setPanel] = useState(null);  // "chat" | "info" | null
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const containerMinH = useMemo(() => "min-h-[560px]", []);

  useEffect(() => {
    if (!roomId) return;
    // join + basic listeners
    socket.emit("joinWebinar", { roomId, username: me });
    const onMsg = (payload) => setMessages((m) => [...m, payload]);
    const onEnded = () => setMessages((m) => [...m, { system: true, message: "Webinar ended." }]);
    socket.on("chatMessage", onMsg);
    socket.on("webinarEnded", onEnded);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => { socket.off("chatMessage", onMsg); socket.off("webinarEnded", onEnded); socket.off("connect"); socket.off("disconnect"); };
  }, [roomId]);

  // start devices when the user first interacts (click any control) OR when page loads (optional)
  useEffect(() => { ensureStream().catch(() => {}); }, [ensureStream]);

  // reactions auto-fade
  useEffect(() => {
    if (!reactions.length) return;
    const t = setTimeout(() => setReactions((r) => r.slice(1)), 1200);
    return () => clearTimeout(t);
  }, [reactions]);

  const sendChat = (text) => socket.emit("chatMessage", { roomId, username: me, message: text });
  const togglePanel = (next) => setPanel((p) => (p === next ? null : next));

  const requestFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  // keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      const k = e.key.toLowerCase();
      if (k === "c") setPanel(p => (p === "chat" ? null : "chat"));
      if (k === "i") setPanel(p => (p === "info" ? null : "info"));
      if (k === "f") requestFullscreen();
      if (k === "m") toggleMute();
      if (k === "v") toggleCamera();
      if (k === "p") togglePresent();
      if (k === "r") setReactions(r => [...r, { id: Date.now(), emoji: "👍" }]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggleMute, toggleCamera, togglePresent]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-sm text-blue-600">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <span className={`text-xs px-2 py-1 rounded ${connected ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 overflow-hidden">
          <div ref={stageRef} className={`relative flex w-full ${containerMinH}`}>
            {/* STAGE */}
            <div className="relative flex-1 bg-slate-900">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />

              {/* reactions */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-24 gap-3">
                {reactions.map((r) => <div key={r.id} className="animate-bounce text-3xl drop-shadow">{r.emoji}</div>)}
              </div>

              {/* controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center" style={{ paddingRight: panel ? PANEL_W : 0 }}>
                <div className="backdrop-blur bg-black/40 border border-white/10 rounded-full px-3 py-2 flex items-center gap-2 text-white">
                  <button onClick={toggleMute} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title={`Mute (M)`}>
                    <MicOff size={18} className={muted ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={toggleCamera} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title={`Camera (V)`}>
                    <VideoOff size={18} className={cameraOff ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={togglePresent} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title={`Present (P)`}>
                    <ScreenShare size={18} className={presenting ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={requestFullscreen} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title="Fullscreen (F)">
                    {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button onClick={stopAll} className="w-9 h-9 grid place-items-center rounded-full bg-red-600 hover:bg-red-700 ml-1" title="Leave">
                    <PhoneOff size={18} />
                  </button>
                </div>
              </div>

              {/* dock */}
              <div className="absolute bottom-5 flex gap-2" style={{ right: (panel ? PANEL_W : 0) + 20 }}>
                <Pill active={panel === "info"} onClick={() => togglePanel("info")} title="Info (I)">
                  <Info size={16} /> Info
                </Pill>
                <Pill active={panel === "chat"} onClick={() => togglePanel("chat")} title="Chat (C)">
                  <MessageCircle size={16} /> Chat
                </Pill>
                <Pill onClick={() => setReactions((r) => [...r, { id: Date.now(), emoji: "👍" }])} title="React (R)">
                  <Smile size={16} /> React
                </Pill>
              </div>
            </div>

            {/* PANEL */}
            <div className="h-full bg-white text-zinc-900 border-l border-black/10 transition-[width] duration-200 ease-out overflow-hidden shadow-[inset_8px_0_16px_rgba(0,0,0,0.05)]"
                 style={{ width: panel ? PANEL_W : 0 }}>
              {panel === "chat" && <ChatPanel messages={messages} me={me} onSend={sendChat} />}
              {panel === "info" && <StudentInfoPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
