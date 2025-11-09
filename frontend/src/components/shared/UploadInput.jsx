// src/components/shared/UploadInput.jsx
import { useRef, useState } from "react";
import { Paperclip, Link as LinkIcon, Loader2 } from "lucide-react";

export default function UploadInput({ busy, onSend }) {
  const ref = useRef(null);
  const [links, setLinks] = useState("");
  const [text, setText] = useState("");

  const send = () => {
    if (busy) return;
    const linkArr = links.split(/\s+/).filter(Boolean);
    onSend?.({ text: text.trim(), linkArr, fileList: ref.current?.files });
    setText(""); setLinks(""); if (ref.current) ref.current.value = "";
  };

  return (
    <div className="rounded-xl border p-3 bg-white">
      <textarea
        rows={2}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Write a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2">
        <label className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded border cursor-pointer hover:bg-slate-50">
          <Paperclip className="w-4 h-4" /> Attach
          <input ref={ref} type="file" className="hidden" multiple />
        </label>
        <div className="flex items-center gap-1 text-sm flex-1">
          <LinkIcon className="w-4 h-4 text-gray-500" />
          <input
            className="flex-1 border rounded px-2 py-1"
            placeholder="Paste links (space separated)"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
          />
        </div>

        <button
          disabled={busy || (!text.trim() && !links.trim() && (!ref.current || !ref.current.files?.length))}
          onClick={send}
          className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "#145da0" }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
        </button>
      </div>
    </div>
  );
}
