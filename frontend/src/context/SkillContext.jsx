import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import API from "../api/axios";

/**
 * Unified Skill Context
 * - Backward compatibility with your previous API:
 *    selected, setSelected()
 * - New fields for fully personalized experience:
 *    skillId, skillName, isProfileReady, setPrimarySkill()
 * - LocalStorage persistence + best-effort server sync (/student/skill-pref)
 */

const SkillCtx = createContext({
  // old API
  selected: null,
  setSelected: () => {},
  loading: true,

  // new API
  skillId: "",
  skillName: "",
  isProfileReady: false,
  setPrimarySkill: (_id, _name, _obj) => {},
  refreshFromStorage: () => {},
});

// ---------- localStorage helpers ----------
const lsGet = (k, fallback = "") => {
  try {
    const v = localStorage.getItem(k);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
};
const lsSet = (k, v) => {
  try {
    if (v === undefined || v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
};

// normalize a skill object coming from server or your UI
const normalizeSkill = (s) => {
  if (!s) return null;
  if (typeof s === "string") return { _id: s, name: "" };
  if (s._id) return { _id: String(s._id), name: s.name || "" };
  return null;
};

export function SkillProvider({ children }) {
  // ===== state =====
  const [loading, setLoading] = useState(true);

  // single source of truth (object)
  const [selected, setSelectedState] = useState(() => {
    // try localStorage first
    const id = lsGet("studentPrimarySkillId", "");
    let name = "";
    try {
      const extras = JSON.parse(lsGet("studentProfileExtras", "{}"));
      name = extras?.primarySkillName || "";
    } catch {}
    if (!id) return null;
    return { _id: id, name };
  });

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // derived (new API)
  const skillId = selected?._id || "";
  const skillName = selected?.name || "";
  const [isProfileReady, setIsProfileReady] = useState(false);

  // ===== boot: best-effort server sync (optional) =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try server preference if available
        const res = await API.get("/student/skill-pref");
        const skill = normalizeSkill(res?.data?.skill);
        if (!cancelled && skill && skill._id) {
          setSelectedState(skill);
          lsSet("studentPrimarySkillId", skill._id);
          try {
            const extras = JSON.parse(lsGet("studentProfileExtras", "{}"));
            if (skill.name) extras.primarySkillName = skill.name;
            lsSet("studentProfileExtras", JSON.stringify(extras));
          } catch {}
        }
      } catch {
        // ignore: endpoint might not exist yet, we rely on LS
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== profile readiness (name + skill chosen) =====
  const recomputeReady = useCallback(() => {
    const name = lsGet("studentName", "").trim();
    const id = lsGet("studentPrimarySkillId", "");
    setIsProfileReady(Boolean(name && id));
  }, []);
  useEffect(() => {
    recomputeReady();
  }, [skillId, recomputeReady]);

  // ===== setters (old + new) =====
  const persistToLocalStorage = useCallback((skillObj) => {
    const id = skillObj?._id || "";
    const name = skillObj?.name || "";
    lsSet("studentPrimarySkillId", id);
    try {
      const extras = JSON.parse(lsGet("studentProfileExtras", "{}"));
      if (name) extras.primarySkillName = name;
      lsSet("studentProfileExtras", JSON.stringify(extras));
    } catch {}
  }, []);

  // old API: setSelected(skillObj or {_id,name})
  const setSelected = useCallback(async (skill) => {
    const norm = normalizeSkill(skill);
    setSelectedState(norm);
    persistToLocalStorage(norm);

    // best-effort server sync (ignore errors)
    if (norm?._id) {
      try {
        await API.post("/student/skill-pref", { skill: norm._id });
      } catch {}
    }
  }, [persistToLocalStorage]);

  // new API: setPrimarySkill(id, name, fullObj?)
  const setPrimarySkill = useCallback(
    async (id, name = "", obj = null) => {
      const norm = normalizeSkill(obj) || { _id: id, name: name || "" };
      setSelectedState(norm);
      persistToLocalStorage(norm);

      if (norm?._id) {
        try {
          await API.post("/student/skill-pref", { skill: norm._id });
        } catch {}
      }
    },
    [persistToLocalStorage]
  );

  // pull from LS again (e.g., after profile save)
  const refreshFromStorage = useCallback(() => {
    const id = lsGet("studentPrimarySkillId", "");
    let name = "";
    try {
      const extras = JSON.parse(lsGet("studentProfileExtras", "{}"));
      name = extras?.primarySkillName || "";
    } catch {}
    const norm = id ? { _id: id, name } : null;
    setSelectedState(norm);
    recomputeReady();
  }, [recomputeReady]);

  const value = useMemo(
    () => ({
      // old API
      selected,
      setSelected,
      loading,

      // new API
      skillId,
      skillName,
      isProfileReady,
      setPrimarySkill,
      refreshFromStorage,
    }),
    [
      selected,
      setSelected,
      loading,
      skillId,
      skillName,
      isProfileReady,
      setPrimarySkill,
      refreshFromStorage,
    ]
  );

  return <SkillCtx.Provider value={value}>{children}</SkillCtx.Provider>;
}

// hook (compat with your old code that imports { useSkill })
export function useSkill() {
  return useContext(SkillCtx);
}

// default export (compat with code that imports default)
export default SkillCtx;
