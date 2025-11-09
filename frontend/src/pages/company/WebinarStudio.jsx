import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  ShieldCheck, ArrowLeft, Users, Info, MessageCircle,
  MicOff, VideoOff, ScreenShare, PhoneOff, Maximize2, Minimize2,
  Check, X as XIcon, UserPlus, UserX
} from "lucide-react";
import useLocalMedia from "../../hooks/useLocalMedia";

const socket = io(import.meta.env.VITE_API_BASE || "http://localhost:5000", { transports: ["websocket"] });
const PANEL_W = 380;

const Pill = ({ active, onClick, title, children }) => (
  <button type="button" title={title} onClick={onClick}
    className={`px-3 h-9 rounded-full border text-sm flex items-center gap-2 transition
      ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white/90 hover:bg-white border-black/10 text-gray-800"}`}>
    {children}
  </button>
);

const ChatPanel = ({ messages, onSend }) => {
  const inputRef = useRef(null);
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 h-12 border-b border-black/10 flex items-center font-semibold">In‑call messages</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
        {messages.length === 0 ? <p className="text-gray-500">No messages yet.</p> :
          messages.map((m, i) => (<div key={i}>{m.system ? <span className="italic text-gray-500">{m.message}</span> : (<><b className="text-purple-700">{m.username}: </b><span>{m.message}</span></>)}</div>))}
      </div>
      <div className="p-3 border-t border-black/10 flex gap-2">
        <input ref={inputRef} className="flex-1 border rounded-md px-3 h-10" placeholder="Send a message to everyone"
          onKeyDown={(e)=>{ if(e.key==="Enter"){ const v=inputRef.current?.value?.trim(); if(v){ onSend(v); inputRef.current.value=""; }}}}/>
        <button onClick={()=>{ const v=inputRef.current?.value?.trim(); if(v){ onSend(v); inputRef.current.value=""; }}} className="h-10 px-4 rounded-md bg-blue-600 text-white">Send</button>
      </div>
    </div>
  );
};

const HostInfoPanel = () => (
  <div className="h-full flex flex-col">
    <div className="px-4 h-12 border-b border-black/10 flex items-center font-semibold">Info</div>
    <div className="p-4 text-sm space-y-3">
      <p>Admit or deny attendees from the People tab.</p>
      <div>
        <p className="font-medium mb-1">Shortcuts</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">G</kbd> — Open People</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">C</kbd> — Chat</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">I</kbd> — Info</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">M</kbd> — Mute</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">V</kbd> — Camera</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">P</kbd> — Present</li>
          <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">F</kbd> — Fullscreen</li>
        </ul>
      </div>
    </div>
  </div>
);

const PeoplePanel = ({ waiting, onToggle, selected, onAdmit, onDeny, onAdmitSelected, onDenySelected, participants }) => (
  <div className="h-full flex flex-col">
    <div className="px-4 h-12 border-b border-black/10 flex items-center justify-between">
      <span className="font-semibold">People</span>
      <div className="flex items-center gap-2">
        <button onClick={onAdmitSelected} className="px-2 h-8 rounded-md bg-emerald-600 text-white text-xs flex items-center gap-1">
          <Check size={14}/> Admit selected
        </button>
        <button onClick={onDenySelected} className="px-2 h-8 rounded-md bg-red-600 text-white text-xs flex items-center gap-1">
          <XIcon size={14}/> Deny selected
        </button>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto text-sm">
      <div className="p-4 border-b border-black/10">
        <p className="font-medium mb-2">Waiting room</p>
        {waiting.length === 0 ? <p className="text-gray-500">No one waiting.</p> :
          waiting.map((u)=>(
            <div key={u.id} className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!selected[u.id]} onChange={()=>onToggle(u.id)}/>
                <span>{u.name}</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={()=>onAdmit(u.id)} className="px-2 h-8 rounded-md bg-emerald-600 text-white text-xs flex items-center gap-1"><UserPlus size={14}/> Admit</button>
                <button onClick={()=>onDeny(u.id)} className="px-2 h-8 rounded-md bg-red-600 text-white text-xs flex items-center gap-1"><UserX size={14}/> Deny</button>
              </div>
            </div>
          ))}
      </div>
      <div className="p-4">
        <p className="font-medium mb-2">In the meeting</p>
        {participants.length === 0 ? <p className="text-gray-500">Only you right now.</p> :
          participants.map((u)=>(<div key={u.id} className="py-1">{u.name}</div>))}
      </div>
    </div>
  </div>
);

export default function WebinarStudio() {
  const { roomId } = useParams();
  const stageRef = useRef(null);

  const {
    videoRef, muted, cameraOff, presenting,
    toggleMute, toggleCamera, togglePresent, stopAll, ensureStream
  } = useLocalMedia();

  const [connected, setConnected] = useState(false);
  const [panel, setPanel] = useState(null); // "people" | "chat" | "info" | null
  const [messages, setMessages] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [selectedWait, setSelectedWait] = useState({});
  const [participants, setParticipants] = useState([]);
  const containerMinH = useMemo(() => "min-h-[600px]", []);

  useEffect(() => {
    if (!roomId) return;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chatMessage", (payload) => setMessages((m) => [...m, payload]));
    socket.on("userJoined", ({ username }) => {
      setWaiting((w) => [...w, { id: crypto.randomUUID(), name: username }]);
    });
    return () => { socket.off("connect"); socket.off("disconnect"); socket.off("chatMessage"); socket.off("userJoined"); };
  }, [roomId]);

  useEffect(() => { ensureStream().catch(()=>{}); }, [ensureStream]);

  const sendChat = (txt) => socket.emit("chatMessage", { roomId, username: "Host", message: txt });
  const requestFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };
  const togglePanel = (next) => setPanel((p) => (p === next ? null : next));

  // people controls
  const toggleSelect = (id) => setSelectedWait((s) => ({ ...s, [id]: !s[id] }));
  const admitOne = (id) => {
    setWaiting((w) => w.filter((x) => x.id !== id));
    const user = waiting.find((x) => x.id === id);
    if (user) setParticipants((p) => [...p, user]);
  };
  const denyOne = (id) => setWaiting((w) => w.filter((x) => x.id !== id));
  const admitSelected = () => { Object.keys(selectedWait).filter(k=>selectedWait[k]).forEach(admitOne); setSelectedWait({}); };
  const denySelected = () => { Object.keys(selectedWait).filter(k=>selectedWait[k]).forEach(denyOne); setSelectedWait({}); };

  // keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      const k = e.key.toLowerCase();
      if (k === "g") setPanel(p => (p === "people" ? null : "people"));
      if (k === "c") setPanel(p => (p === "chat" ? null : "chat"));
      if (k === "i") setPanel(p => (p === "info" ? null : "info"));
      if (k === "m") toggleMute();
      if (k === "v") toggleCamera();
      if (k === "p") togglePresent();
      if (k === "f") requestFullscreen();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggleMute, toggleCamera, togglePresent]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/company/dashboard" className="inline-flex items-center gap-2 text-sm text-blue-400">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-emerald-600/20 text-emerald-300">Live</span>
            <span className="text-xs px-2 py-1 rounded bg-slate-800">{roomId}</span>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 overflow-hidden">
          <div ref={stageRef} className={`relative flex w-full ${containerMinH}`}>
            {/* STAGE */}
            <div className="relative flex-1 bg-slate-900">
              <video ref={videoRef} className="w-full h-full object-cover opacity-85" autoPlay playsInline muted />

              <div className="absolute left-4 top-4 flex items-center gap-2">
                <ShieldCheck className="text-emerald-300" size={18} />
                <span className="text-xs text-white/80">Host Controls Enabled</span>
              </div>

              {/* controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center" style={{ paddingRight: panel ? PANEL_W : 0 }}>
                <div className="backdrop-blur bg-black/40 border border-white/10 rounded-full px-3 py-2 flex items-center gap-2">
                  <button onClick={toggleMute} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title="Mute (M)">
                    <MicOff size={18} className={muted ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={toggleCamera} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title="Camera (V)">
                    <VideoOff size={18} className={cameraOff ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={togglePresent} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title="Present (P)">
                    <ScreenShare size={18} className={presenting ? "opacity-100" : "opacity-50"} />
                  </button>
                  <button onClick={requestFullscreen} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10" title="Fullscreen (F)">
                    {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button onClick={stopAll} className="w-9 h-9 grid place-items-center rounded-full bg-red-600 hover:bg-red-700 ml-1" title="End">
                    <PhoneOff size={18} />
                  </button>
                </div>
              </div>

              {/* dock */}
              <div className="absolute bottom-5 flex gap-2" style={{ right: (panel ? PANEL_W : 0) + 20 }}>
                <Pill active={panel === "info"} onClick={() => togglePanel("info")} title="Info (I)">
                  <Info size={16} /> Info
                </Pill>
                <Pill active={panel === "people"} onClick={() => togglePanel("people")} title="People (G)">
                  <Users size={16} /> People
                </Pill>
                <Pill active={panel === "chat"} onClick={() => togglePanel("chat")} title="Chat (C)">
                  <MessageCircle size={16} /> Chat
                </Pill>
              </div>
            </div>

            {/* PANEL */}
            <div className="h-full bg-white text-zinc-900 border-l border-black/10 transition-[width] duration-200 ease-out overflow-hidden shadow-[inset_8px_0_16px_rgba(0,0,0,0.05)]"
                 style={{ width: panel ? PANEL_W : 0 }}>
              {panel === "chat"   && <ChatPanel messages={messages} onSend={sendChat} />}
              {panel === "people" && (
                <PeoplePanel
                  waiting={waiting}
                  selected={selectedWait}
                  onToggle={toggleSelect}
                  onAdmit={admitOne}
                  onDeny={denyOne}
                  onAdmitSelected={admitSelected}
                  onDenySelected={denySelected}
                  participants={participants}
                />
              )}
              {panel === "info"   && <HostInfoPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
