import { useEffect, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { collab } from "../../api/collab";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

export default function ChatBox({ collabId }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const sinceRef = useRef(null);
  const scrollRef = useRef(null);

  const load = async () => {
    const list = await collab.listMessages(collabId, sinceRef.current);
    if (Array.isArray(list) && list.length) {
      sinceRef.current = list[list.length - 1]?.createdAt || sinceRef.current;
      setItems((p) => [...p, ...list]);
      setTimeout(() => { scrollRef.current?.scrollTo?.(0, 999999); }, 0);
    }
  };

  useEffect(() => {
    if (!collabId) return;
    setItems([]); sinceRef.current = null;
    load();
    const t = setInterval(load, 2000); // simple polling
    return () => clearInterval(t);
  }, [collabId]);

  const send = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    await collab.sendMessage(collabId, { text: draft.trim(), attachments: [] });
    setDraft("");
    await load();
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto pr-2">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">No messages yet.</div>
        ) : items.map((m) => (
          <div key={m._id || m.id} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
            <div className="text-xs text-gray-500">
              {m.authorName || m.authorRole || "user"} • {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}
            </div>
            <div className="text-sm mt-1">{m.text}</div>
            {Array.isArray(m.attachments) && m.attachments.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                <Paperclip className="w-3 h-3" /> {m.attachments.length} attachment(s)
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1"
          style={{ borderColor: BRAND.light }}
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button
          onClick={send}
          disabled={busy || !draft.trim()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
          style={{ backgroundColor: BRAND.primary }}
        >
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
}
