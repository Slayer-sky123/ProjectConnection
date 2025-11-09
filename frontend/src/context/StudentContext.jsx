// src/context/StudentContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // bootstrap on first mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await API.get("/student/profile");
        const p = res.data || null;
        setProfile(p);
        // persist some convenient bits for UX (your dashboard already reads these)
        if (p?.name) localStorage.setItem("studentName", p.name);
        if (p?.primarySkill?.name) localStorage.setItem("studentPrimarySkill", p.primarySkill.name);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const primarySkill = useMemo(() => {
    return profile?.primarySkill || { id: null, name: "" };
  }, [profile]);

  // Switch skill from anywhere (Study, Dashboard, etc.)
  const setPrimarySkill = useCallback(async ({ skillId, skillName }) => {
    // optimistic update
    setProfile((prev) => ({
      ...(prev || {}),
      primarySkill: { id: skillId || prev?.primarySkill?.id || null, name: skillName || "" },
    }));
    try {
      const form = new FormData();
      if (skillId) form.append("primarySkillId", skillId);
      if (skillName) form.append("primarySkillName", skillName);
      await API.post("/student/profile/update", form);
      // write localStorage for quick reads (sidebar/header/etc.)
      if (skillName) localStorage.setItem("studentPrimarySkill", skillName);
      // broadcast so any screen reacts (Jobs, SkillTest, etc.)
      window.dispatchEvent(new CustomEvent("student:primarySkillChanged", { detail: { skillId, skillName } }));
    } catch (e) {
      console.error("Failed to update primary skill:", e?.response?.data || e.message);
    }
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, loading, primarySkill, setPrimarySkill }),
    [profile, loading, primarySkill, setPrimarySkill]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
