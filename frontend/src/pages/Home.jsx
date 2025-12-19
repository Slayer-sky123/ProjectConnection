import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import SearchDropdown from "../components/SearchDropdown";
import API from "../api/axios";

/**
 * Palette
 * ink:   #091057
 * blue:  #024CAA
 * orange:#EC8305
 * light: #DBD3D3
 */

const ROLE_CYCLE = [
  "Frontend Developer",
  "Data Analyst",
  "Product Designer",
  "DevOps Engineer",
  "AI Research Intern",
  "Full-Stack Engineer",
];

function matchesFilters(job, { kw, exp, loc }) {
  const title = (job?.title || "").toLowerCase();
  const comp = (job?.company?.name || "").toLowerCase();
  const location = (job?.location || "").toLowerCase();
  const expText = (job?.experience || "").toLowerCase();

  const kwOk = kw ? title.includes(kw) || comp.includes(kw) || location.includes(kw) : true;
  const locOk = loc ? location.includes(loc) : true;

  let expOk = true;
  if (exp) {
    const e = exp.toLowerCase();
    if (e === "fresher") expOk = expText.includes("fresher") || expText.includes("0");
    else expOk = expText.includes(e);
  }
  return kwOk && locOk && expOk;
}

export default function Home() {
  const navigate = useNavigate();
  const [showTopBtn, setShowTopBtn] = useState(false);

  // typing placeholder
  const [roleIndex, setRoleIndex] = useState(0);
  const [typed, setTyped] = useState("");

  // jobs
  const [allJobs, setAllJobs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [err, setErr] = useState("");

  // live search
  const [kw, setKw] = useState("");
  const [exp, setExp] = useState("");
  const [loc, setLoc] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [openDD, setOpenDD] = useState(false);
  const formRef = useRef(null);

  // outside click to close dropdown
  useEffect(() => {
    function onDoc(e) {
      if (!formRef.current) return;
      if (!formRef.current.contains(e.target)) setOpenDD(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // load jobs
  useEffect(() => {
    (async () => {
      try {
        setLoadingAll(true);
        const res = await API.get("/student/jobs", { __public: true, params: {} });
        setAllJobs(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErr("Could not load jobs");
      } finally {
        setLoadingAll(false);
      }
    })();
  }, []);

  // live strict search
  useEffect(() => {
    const t = setTimeout(async () => {
      const kwTrim = kw.trim();
      const locTrim = loc.trim();
      const canSearch = kwTrim.length >= 3 || !!exp || locTrim.length >= 2;

      if (!canSearch) {
        setSearchResults([]);
        setOpenDD(false);
        return;
      }

      try {
        const res = await API.get("/student/jobs", {
          __public: true,
          params: {
            ...(kwTrim.length >= 3 ? { q: kwTrim } : {}),
            ...(exp ? { exp } : {}),
            ...(locTrim.length >= 2 ? { location: locTrim } : {}),
          },
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        const needle = {
          kw: kwTrim.length >= 3 ? kwTrim.toLowerCase() : "",
          exp: exp || "",
          loc: locTrim.length >= 2 ? locTrim.toLowerCase() : "",
        };
        const filtered = rows.filter((j) => matchesFilters(j, needle));

        setSearchResults(filtered);
        setOpenDD(filtered.length > 0);
      } catch {
        setSearchResults([]);
        setOpenDD(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [kw, exp, loc]);

  // typing animation for placeholder
  useEffect(() => {
    const full = ROLE_CYCLE[roleIndex % ROLE_CYCLE.length];
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i === full.length) {
        clearInterval(id);
        setTimeout(() => setRoleIndex((n) => (n + 1) % ROLE_CYCLE.length), 1200);
      }
    }, 40);
    return () => clearInterval(id);
  }, [roleIndex]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 320);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // carousel state
  const [idx, setIdx] = useState(0);
  const [pause, setPause] = useState(false);
  const total = allJobs.length;
  const pageSize = 3;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const currentPageJobs = useMemo(() => {
    const start = idx * pageSize;
    return allJobs.slice(start, start + pageSize);
  }, [allJobs, idx]);

  useEffect(() => {
    if (pause || total <= pageSize) return;
    const id = setInterval(() => setIdx((p) => (p + 1) % pages), 5000);
    return () => clearInterval(id);
  }, [pause, pages, total]);

  const goPrev = () => setIdx((p) => (p - 1 + pages) % pages);
  const goNext = () => setIdx((p) => (p + 1) % pages);

  const onWheel = (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (e.deltaY > 0) goNext();
      else goPrev();
    }
  };

  const doSearchSubmit = (e) => {
    e?.preventDefault?.();
    const kwTrim = kw.trim();
    const locTrim = loc.trim();
    const canSearch = kwTrim.length >= 3 || !!exp || locTrim.length >= 2;
    if (!canSearch) return;

    const params = new URLSearchParams();
    if (kwTrim.length >= 3) params.set("q", kwTrim);
    if (exp) params.set("exp", exp);
    if (locTrim.length >= 2) params.set("location", locTrim);
    navigate(`/jobs?${params.toString()}`);
  };

  const ddItems = useMemo(() => searchResults.slice(0, 8), [searchResults]);

  return (
    <>
      <Header />

      {/* spacer for fixed header */}
      <div className="h-20 md:h-16" />

      <main className="bg-[#F6F7FB] text-white">
        {/* ========= HERO ========= */}
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: headline + desc + ctas + search */}
            <div className="space-y-6 md:space-y-4">
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-[#E3E4EF] bg-[#F8F9FF] px-3 py-1 text-[11px] font-semibold capitalize tracking-[0.16em] text-[#024CAA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC8305]" />
                Careers that start with skills
              </div> */}

              <h1 className="text-[34px] leading-[1.15] md:text-[50px] md:leading-tight font-bold capitalize tracking-tight text-(--primary-blue) relative">
                <img className="size-10 object-contain absolute -top-[20%] right-[2%] rotate-45 z-0" src="/assets/smile.webp" alt="Smile" />
                Turn student skills into{" "}
                <span className="text-(--primary-orange)">real job offers.
                </span>
              </h1>

              <p className="text-[15px] md:text-lg text-(--primary-blue) max-w-xl leading-relaxed">
                Sproutyou connects students, universities and hiring teams on one
                outcome-first platform — from learning and projects to interviews
                and offers.
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-base font-medium rounded-lg bg-(--primary-blue) select-none inline-flex justify-center items-center gap-2 will-change-transform transition-all duration-150 hover:scale-95 active:scale-95"
                >
                  Get Started
                </Link>
                <Link
                  to="/about"
                  className="text-base font-medium text-(--primary-blue) capitalize flex justify-center items-center gap-1 transition-all duration-150 hover:underline"
                >
                  How we works
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 lucide lucide-arrow-up-right-icon lucide-arrow-up-right"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
                </Link>
              </div>

              {/* Search bar */}
              <form
                ref={formRef}
                onSubmit={doSearchSubmit}
                className="mt-8"
                aria-label="Job search"
              >
                {/* The main form container is now more prominent with a soft shadow */}
                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-(--primary-blue)/20">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* 1. Job Role/Skill Input - col-span-8 for desktop */}
                    <div className="md:col-span-8 flex items-center gap-2 bg-(--soft-gray) text-(--gray) rounded-xl px-4 py-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-5"
                      >
                        <path d="m21 21-4.34-4.34" />
                        <circle cx="11" cy="11" r="8" />
                      </svg>
                      <input
                        value={kw}
                        onChange={(e) => setKw(e.target.value)}
                        required
                        placeholder={
                          typed ? `Search roles like "${typed}…"` : "Search roles like Product Designer..."
                        }
                        className="h-12 w-full bg-transparent text-sm focus:outline-none placeholder:text-(--placeholder)"
                      />
                    </div>

                    {/* 2. Experience Dropdown - col-span-4 for desktop */}
                    <div className="md:col-span-4 relative flex items-center bg-(--soft-gray) text-(--gray) rounded-xl px-4 py-0">
                      <select
                        value={exp}
                        onChange={(e) => setExp(e.target.value)}
                        required
                        className="appearance-none h-12 w-full bg-transparent text-sm capitalize focus:outline-none border-0 pr-6 cursor-pointer"
                      >
                        <option value="">Experience</option>
                        <option value="fresher">Fresher</option>
                        <option value="1">1 year</option>
                        <option value="2">2 years</option>
                        <option value="3">3 years</option>
                        <option value="4">4 years</option>
                        <option value="5">5+ years</option>
                      </select>
                      {/* Custom dropdown arrow for better visual consistency */}
                      <svg
                        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-(--placeholder)"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>

                    {/* Second Row for Location and Button */}
                    {/* 3. Location Input - col-span-8 for desktop */}
                    <div className="md:col-span-8 relative flex items-center bg-(--soft-gray) text-(--gray) rounded-xl px-4 py-0">
                      <input
                        value={loc}
                        onChange={(e) => setLoc(e.target.value)}
                        required
                        placeholder="Location"
                        className="h-12 w-full bg-transparent text-sm focus:outline-none placeholder:text-(--placeholder)"
                      />
                      <SearchDropdown
                        open={openDD && searchResults.length > 0}
                        items={ddItems}
                        onPick={(job) => {
                          const params = new URLSearchParams();
                          params.set("q", job.title);
                          navigate(`/jobs?${params.toString()}`);
                          setOpenDD(false);
                        }}
                      />
                    </div>

                    {/* 4. Search Button - col-span-4 for desktop */}
                    <div className="md:col-span-4 flex items-center">
                      <button
                        type="submit"
                        className="w-full capitalize px-5 py-2.5 text-base font-normal rounded-lg bg-(--primary-blue) select-none inline-flex justify-center items-center gap-2 will-change-transform transition-all duration-150 hover:scale-95 active:scale-95"
                      >
                        {/* Using a check icon (similar to the image) for a more professional touch */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-5"
                        >
                          <path d="m21 21-4.34-4.34" />
                          <circle cx="11" cy="11" r="8" />
                        </svg>
                        Search jobs
                      </button>
                    </div>
                  </div>

                  {/* Footer Text for Narrowing Down */}
                  <p className="text-xs font-normal text-(--primary-blue)/45 capitalize mt-4 px-1">
                    Start typing a role or company name. Use filters to narrow down.
                  </p>
                </div>
              </form>
            </div>

            {/* Right: illustration */}
            <div className="relative flex justify-center md:justify-end">
              <img
                src="/assets/hero-banner.webp"
                alt="Talent working on laptop"
                className="aspect-square w-[85%] object-contain"
              />
            </div>
          </div>
        </section>

        {/* ========= HOW WE WORK ========= */}
        <section className="p-5 bg-white">
          <div className="py-12 md:py-16 bg-(--primary-blue) rounded-4xl relative overflow-hidden">
            <img className="opacity-45 object-center object-cover absolute inset-0 z-0 w-full" src="/assets/grid.webp" alt="Grid Lines" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-sm capitalize text-white">
                  From Learning To Offer Letter
                </p>
                <h2 className="mt-4 text-2xl md:text-4xl font-bold text-(--primary-orange) capitalize relative">
                  <img className="absolute -top-[28%] left-[5%] z-0 size-8 object-contain select-none invert" src="/assets/wink.webp" alt="wink" />
                  A simple journey that keeps everyone aligned.
                </h2>
                <p className="max-w-xl mx-auto mt-5 text-[14px] md:text-lg capitalize text-white">
                  Students build skills, universities validate, and companies hire with confidence —
                  all inside one clean workflow.
                </p>
              </div>

              <div className="mt-10 grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "1. Map your path",
                    desc: "Pick your goal. We break it into skills, projects, and milestones matched to real job descriptions.",
                    icon: (
                      <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.598-.49L10.5.99 5.598.01a.5.5 0 0 0-.196 0l-5 1A.5.5 0 0 0 0 1.5v14a.5.5 0 0 0 .598.49l4.902-.98 4.902.98a.5.5 0 0 0 .196 0l5-1A.5.5 0 0 0 16 14.5zM5 14.09V1.11l.5-.1.5.1v12.98l-.402-.08a.5.5 0 0 0-.196 0zm5 .8V1.91l.402.08a.5.5 0 0 0 .196 0L11 1.91v12.98l-.5.1z" />
                      </svg>
                    )
                  },
                  {
                    title: "2. Build & verify",
                    desc: "Complete guided projects and assessments. Universities & mentors validate your progress and badges.",
                    icon: (
                      <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" class="bi bi-buildings-fill" viewBox="0 0 16 16">
                        <path d="M15 .5a.5.5 0 0 0-.724-.447l-8 4A.5.5 0 0 0 6 4.5v3.14L.342 9.526A.5.5 0 0 0 0 10v5.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V14h1v1.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5zM2 11h1v1H2zm2 0h1v1H4zm-1 2v1H2v-1zm1 0h1v1H4zm9-10v1h-1V3zM8 5h1v1H8zm1 2v1H8V7zM8 9h1v1H8zm2 0h1v1h-1zm-1 2v1H8v-1zm1 0h1v1h-1zm3-2v1h-1V9zm-1 2h1v1h-1zm-2-4h1v1h-1zm3 0v1h-1V7zm-2-2v1h-1V5zm1 0h1v1h-1z" />
                      </svg>
                    )
                  },
                  {
                    title: "3. Match & apply",
                    desc: "Your profile is matched with relevant roles. Companies see real work instead of just marksheets.",
                    icon: (
                      <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1z" />
                        <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85z" />
                      </svg>
                    )
                  }
                ].map((s) => (
                  <div
                    key={s.title}
                    className="rounded-2xl bg-white border border-[#E4E6F4] p-5 md:p-6 shadow-sm"
                  >
                    <div className="size-14 flex items-center justify-center rounded-xl text-white mb-3 bg-(--primary-blue)">
                      {s.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-(--primary-blue)">{s.title}</h3>
                    <p className="mt-2 leading-6 text-sm font-medium text-(--primary-blue)/75">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========= LATEST OPENINGS ========= */}
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-[#091057]">Latest openings</h3>
                <p className="text-sm text-[#091057]/65 mt-1">
                  Fresh, student-friendly roles aligned with your skills.
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm text-[#091057]/75">
                {loadingAll ? (
                  <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-[#F3F4FF]">
                    Loading…
                  </span>
                ) : (
                  <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-[#F3F4FF]">
                    {allJobs.length} live opportunities
                  </span>
                )}
                <Link
                  to="/jobs"
                  className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#024CAA] hover:underline"
                >
                  View all jobs →
                </Link>
              </div>
            </div>

            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

            <div
              className="mt-8 rounded-3xl bg-[#F8F9FF] border border-[#E3E6F5] px-3 py-6 md:px-6 md:py-7 relative"
              onMouseEnter={() => setPause(true)}
              onMouseLeave={() => setPause(false)}
              onWheel={onWheel}
            >
              {/* Arrows - outside the card grid for symmetry */}
              {allJobs.length > pageSize && (
                <>
                  <button
                    onClick={goPrev}
                    className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-white shadow-lg shadow-[#024CAA]/40 hover:-translate-x-0.5 transition-transform"
                    style={{ backgroundColor: "#024CAA" }}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full text-white shadow-lg shadow-[#024CAA]/40 hover:translate-x-0.5 transition-transform"
                    style={{ backgroundColor: "#024CAA" }}
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="mx-1 sm:mx-3 md:mx-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch">
                  {currentPageJobs.map((j) => (
                    <JobCard key={j._id} job={j} />
                  ))}
                  {!loadingAll && currentPageJobs.length === 0 && (
                    <div className="col-span-3 text-sm text-[#091057]/60 py-6 text-center bg-white rounded-2xl border border-dashed border-[#E1E5F2]">
                      No jobs found. Try adjusting your search filters.
                    </div>
                  )}
                </div>
              </div>

              {allJobs.length > pageSize && (
                <div className="mt-5 flex justify-center gap-2">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${i === idx ? "bg-[#024CAA]" : "bg-[#D5DBF0]"
                        }`}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========= FINAL CTA ========= */}
        <section className="py-16 bg-[#F6F7FB] border-t border-[#E1E5F2]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold text-[#091057]">
              Ready to move faster with{" "}
              <span className="font-extrabold text-[#024CAA]">Sproutyou</span>?
            </h3>
            <p className="mt-3 text-[14px] md:text-[15px] text-[#091057]/75 max-w-2xl mx-auto leading-relaxed">
              Join a trusted network where students, universities and companies
              collaborate for real outcomes — skills, portfolios, internships and offers.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center mt-7 px-8 py-3 rounded-xl font-semibold text-sm md:text-[15px] text-white shadow-md shadow-[#024CAA]/30 hover:-translate-y-0.5 transition-transform"
              style={{ backgroundColor: "#024CAA" }}
            >
              Get Started →
            </Link>
          </div>
        </section>
      </main>

      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 text-white p-3 rounded-full shadow-xl transition z-50 hover:translate-y-[-2px]"
          style={{ backgroundColor: "#024CAA" }}
          aria-label="Scroll to Top"
        >
          ↑
        </button>
      )}

      <Footer />
    </>
  );
}
