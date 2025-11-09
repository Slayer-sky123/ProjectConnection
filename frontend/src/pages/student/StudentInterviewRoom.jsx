import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE?.replace("/api","") || "http://localhost:5000", { transports: ["websocket"] });

export default function StudentInterviewRoom() {
  const { roomId } = useParams();
  const [connected, setConnected] = useState(false);
  const videoMine = useRef(null);
  const videoPeer = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => { socket.off("connect"); socket.off("disconnect"); };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    (async () => {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoMine.current) videoMine.current.srcObject = localStreamRef.current;

      pcRef.current = new RTCPeerConnection();
      localStreamRef.current.getTracks().forEach(t => pcRef.current.addTrack(t, localStreamRef.current));
      pcRef.current.ontrack = (e) => { if (videoPeer.current) videoPeer.current.srcObject = e.streams[0]; };

      socket.emit("requestJoin", { roomId, username: "Candidate" });

      socket.on("admitted", async () => {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("signal-offer", { target: "host", sdp: offer }); // server routes to host
      });

      socket.on("signal-answer", async ({ sdp }) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("signal-ice", async ({ candidate }) => {
        if (candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });

      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) socket.emit("signal-ice", { target: "host", candidate: e.candidate });
      };
    })();

    return () => {
      mounted = false;
      socket.off("admitted");
      socket.off("signal-answer");
      socket.off("signal-ice");
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <Link to="/student/dashboard" className="text-blue-600 underline">Back</Link>
          <span className={`text-xs px-2 py-1 rounded ${connected ? "bg-green-100 text-green-700":"bg-gray-200 text-gray-600"}`}>{connected?"Connected":"Disconnected"}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <video ref={videoPeer} autoPlay playsInline className="w-full bg-black rounded-xl aspect-video" />
          <video ref={videoMine} autoPlay playsInline muted className="w-full bg-black rounded-xl aspect-video" />
        </div>
      </div>
    </div>
  );
}
