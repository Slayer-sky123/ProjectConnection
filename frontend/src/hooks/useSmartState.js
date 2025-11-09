import { useEffect, useRef, useState } from "react";

// Stable: never conditionally call hooks
export default function useSmartState(lsKey, initialValue) {
  const isFirst = useRef(true);

  // read initial from localStorage once (no conditionals)
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // write-through, always called (order stable)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    try {
      localStorage.setItem(lsKey, JSON.stringify(state));
    } catch {}
  }, [lsKey, state]);

  return [state, setState];
}
