import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import API from "../../api/axios";
import useSmartState from "../../hooks/useSmartState";
import CompanyLayout from "../../layouts/CompanyLayout";

/* Existing feature components */
import Overview from "../../components/company/Overview";
import ProfileTab from "../../components/company/Profile";
import ScreeningTab from "../../components/company/Screening";
import TalentTab from "../../components/company/Talent";
import JobsTab from "../../components/company/Jobs";
import HackathonsTab from "../../components/company/Hackathons";
import WebinarsTab from "../../components/company/Webinars";
import PartnershipsTab from "../../components/company/Partnerships";
// import CollabWorkspace from "../../components/shared/CollabWorkspace";
import Collaboration from "../../components/university/Collaboration";

/* tiny helpers preserved */
const apiOrigin=(API.defaults.baseURL && new URL(API.defaults.baseURL).origin) || (typeof window!=="undefined"?window.location.origin:"");
const toAbsolute=(p)=>!p?null:(p.startsWith("http")?p:`${apiOrigin}${p.startsWith("/")?p:`/${p}`}`);
const takeArray=(v)=>Array.isArray(v)?v:(!v||typeof v!=="object"?[]:(v.items||v.data||v.results||v.rows||v.applications||v.jobs||v.webinars||v.hackathons||v.partnerships||[]));

export default function CompanyApp(){
  const [profile,setProfile]=useState(null);
  const [skills,setSkills]=useState([]);
  const [jobs,setJobs]=useState([]);
  const [webinars,setWebinars]=useState([]);
  const [hackathons,setHackathons]=useState([]);
  const [partnerships,setPartnerships]=useState([]);
  const [applications,setApplications]=useState([]);
  const [talent,setTalent]=useState([]);
  const [loading,setLoading]=useState(true);

  const [search,setSearch]=useSmartState("company.talent.search",{skillIds:[],minScore:6});

  const fetchAll=async()=>{
    setLoading(true);
    try{
      const [p,s,j,w,h,pa,apps]=await Promise.all([
        API.get("/company/profile"),
        API.get("/admin/skills"),
        API.get("/company/jobs"),
        API.get("/company/webinars"),
        API.get("/company/hackathons"),
        API.get("/company/partnerships"),
        API.get("/company/applications"),
      ]);
      setProfile(p.data||null);
      setSkills(takeArray(s.data));
      setJobs(takeArray(j.data));
      setWebinars(takeArray(w.data));
      setHackathons(takeArray(h.data));
      setPartnerships(takeArray(pa.data));
      setApplications(takeArray(apps.data));
    }catch(e){ console.error("Load dashboard failed:",e?.response?.data||e.message); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ fetchAll(); },[]);

  const kpis=useMemo(()=>{
    const openJobs=jobs.filter(j=>j.status==="open").length;
    const totalApps=applications.length;
    const upcomingWebinars=webinars.filter(w=>new Date(w.startsAt)>new Date()).length;
    const activePartnerships=partnerships.filter(p=>p.status==="active").length;
    return [
      {label:"Open Roles",value:openJobs},
      {label:"Applications",value:totalApps},
      {label:"Upcoming Webinars",value:upcomingWebinars},
      {label:"Active Partnerships",value:activePartnerships},
    ];
  },[jobs,applications,webinars,partnerships]);

  /* Profile save (unchanged) */
  const saveProfile=async(e)=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const body={
      name:f.get("name"),
      website:f.get("website"),
      logoUrl:f.get("logoUrl"),
      description:f.get("description"),
      size:f.get("size"),
      locations:(f.get("locations")||"").split(",").map(v=>v.trim()).filter(Boolean),
      domains:(f.get("domains")||"").split(",").map(v=>v.trim()).filter(Boolean),
      contactEmail:f.get("contactEmail"),
      contactPhone:f.get("contactPhone"),
    };
    try{
      if(profile?._id){ const res=await API.put("/company/profile",body); setProfile(res.data); }
      else{
        try{ const res=await API.post("/company/profile",body); setProfile(res.data); }
        catch(err){ if(err?.response?.status===409){ const res2=await API.put("/company/profile",body); setProfile(res2.data); } else { throw err; } }
      }
    }catch(err){
      console.error("Save profile failed:",err?.response?.data||err.message);
      alert(err?.response?.data?.message||"Failed to save profile");
    }
  };

  /* Applications (unchanged) */
  const refreshApplications=async()=>{ const r=await API.get("/company/applications"); setApplications(Array.isArray(r.data)?r.data:(r.data?.items||r.data?.data||[])); };
  const updateAppStatus=async(id,status)=>{ try{ await API.patch(`/company/applications/${id}`,{status}); await refreshApplications(); }catch(e){ console.error("Update application failed:",e?.response?.data||e.message);} };
  const aiScanOne=async(id,setBusy)=>{ try{ setBusy?.(true); await API.post(`/company/applications/${id}/ai-screen`); await refreshApplications(); }catch(e){ alert(e?.response?.data?.message||"AI scan failed"); }finally{ setBusy?.(false);} };
  const aiScanAll=async(setBusy)=>{ try{ setBusy?.(true); for(const a of applications){ await API.post(`/company/applications/${a._id}/ai-screen`);} await refreshApplications(); }catch(e){ alert(e?.response?.data?.message||"AI scan (all) failed"); }finally{ setBusy?.(false);} };

  /* Talent (unchanged) */
  const runTalentSearch=async()=>{ try{
    const params=new URLSearchParams();
    (search.skillIds||[]).forEach(id=>params.append("skillIds",id));
    params.append("minScore",search.minScore??6);
    const res=await API.get(`/company/talent-search?${params.toString()}`);
    setTalent(res.data||[]);
  }catch(e){ console.error("Talent search failed:",e?.response?.data||e.message);} };
  useEffect(()=>{ (search.skillIds?.length?runTalentSearch():setTalent([])); },[search]); // eslint-disable-line

  /* Jobs (unchanged) */
  const createJob=async(p)=>{ await API.post("/company/jobs",p); await fetchAll(); };
  const updateJob=async(id,p)=>{ await API.put(`/company/jobs/${id}`,p); await fetchAll(); };
  const toggleJob=async(id)=>{ await API.patch(`/company/jobs/${id}/toggle`); await fetchAll(); };
  const deleteJob=async(id)=>{ await API.delete(`/company/jobs/${id}`); await fetchAll(); };

  /* Hackathons (unchanged) */
  const createHackathon=async(p)=>{ await API.post("/company/hackathons",p); await fetchAll(); };
  const setHackStatus=async(id,status)=>{ await API.patch(`/company/hackathons/${id}/status`,{status}); await fetchAll(); };
  const publishLeaderboard=async(id)=>{ await API.post(`/company/hackathons/${id}/publish-leaderboard`); alert("Leaderboard published"); };

  /* Webinars & Partnerships (unchanged) */
  const createWebinar=async(p)=>{ await API.post("/company/webinars",p); await fetchAll(); };
  const createPartnership=async(p)=>{ await API.post("/company/partnerships",p); await fetchAll(); };

  return (
    <CompanyLayout profile={profile}>
      {loading ? (
        <div className="card p-10 grid place-items-center text-slate-500">Loading…</div>
      ) : (
        <Routes>
          {/* absolute default route to avoid loops */}
          <Route path="/" element={<Navigate to="/company/overview" replace />} />
          <Route path="overview" element={<Overview kpis={kpis} jobs={jobs} webinars={webinars} onGoJobs={()=> (window.location.href="/company/jobs")} />} />
          <Route path="screening" element={<ScreeningTab applications={applications} updateAppStatus={updateAppStatus} aiScanOne={aiScanOne} aiScanAll={aiScanAll} toAbsolute={toAbsolute} onRefresh={refreshApplications} />} />
          <Route path="talent" element={<TalentTab skills={skills} search={search} setSearch={setSearch} results={talent} onRunSearch={runTalentSearch} />} />
          <Route path="jobs" element={<JobsTab skills={skills} jobs={jobs} createJob={createJob} updateJob={updateJob} deleteJob={deleteJob} toggleJob={toggleJob} />} />
          <Route path="hackathons" element={<HackathonsTab skills={skills} hackathons={hackathons} createHackathon={createHackathon} setHackStatus={setHackStatus} publishLeaderboard={publishLeaderboard} />} />
          <Route path="webinars" element={<WebinarsTab webinars={webinars} createWebinar={createWebinar} />} />
          <Route path="partnerships" element={<PartnershipsTab partnerships={partnerships} createPartnership={createPartnership} />} />

          {/* NEW: company-side alias -> universal collab */}
          <Route path="collaboration" element={<Collaboration />} />

          {/* Profile is kept for deep link & topbar menu */}
          <Route path="profile" element={<ProfileTab profile={profile} onSave={saveProfile} />} />
          <Route path="settings" element={<div className="card p-6 text-slate-600">Settings</div>} />

          <Route path="*" element={<Navigate to="/company/overview" replace />} />
        </Routes>
      )}
    </CompanyLayout>
  );
}
