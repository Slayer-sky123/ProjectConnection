import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

function WebinarRoom({ roomId, username }) {
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      userVideo.current.srcObject = stream;
      socket.emit("joinWebinar", { roomId, username });

      socket.on("userJoined", ({ username }) => {
        console.log(`${username} joined`);
      });

      socket.on("signal", ({ id, data }) => {
        const peer = peersRef.current.find(p => p.peerID === id);
        if (peer) {
          peer.peer.signal(data);
        }
      });
    });
  }, [roomId, username]);

  return (
    <div className="webinar-container">
      <video ref={userVideo} autoPlay playsInline muted className="video-player" />
      {peers.map((peer, index) => (
        <Video key={index} peer={peer.peer} />
      ))}
    </div>
  );
}

function Video({ peer }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline className="video-player" />;
}

export default WebinarRoom;
