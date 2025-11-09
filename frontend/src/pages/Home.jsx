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
      <div className="h-20 md:h-24" />

      <main className="bg-[#F6F7FB] text-[#091057]">
        {/* ========= HERO ========= */}
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: headline + desc + ctas + search */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E3E4EF] bg-[#F8F9FF] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#024CAA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC8305]" />
                Careers that start with skills
              </div>

              <h1 className="text-[34px] leading-[1.15] md:text-[50px] md:leading-[1.08] font-extrabold tracking-tight text-[#091057]">
                Turn student skills into{" "}
                <span className="text-[#024CAA]">real job offers.</span>
              </h1>

              <p className="text-[15px] md:text-[16px] text-[#091057]/75 max-w-xl leading-relaxed">
                Sproutyou connects students, universities and hiring teams on one
                outcome-first platform — from learning and projects to interviews
                and offers.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl font-semibold text-white inline-flex items-center justify-center text-sm md:text-[15px] shadow-md shadow-[#024CAA]/30 hover:-translate-y-0.5 transition-transform"
                  style={{ backgroundColor: "#024CAA" }}
                >
                  Get Started
                </Link>
                <Link
                  to="/about"
                  className="text-sm md:text-[15px] font-semibold text-[#024CAA] hover:underline"
                >
                  How Sproutyou works →
                </Link>
              </div>

              {/* Search bar */}
              <form
                ref={formRef}
                onSubmit={doSearchSubmit}
                className="pt-2"
                aria-label="Job search"
              >
                <div className="rounded-2xl bg-white border border-[#E2E4EE] shadow-[0_14px_40px_rgba(9,16,87,0.06)] p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-[2.2fr_1.1fr_1.1fr] gap-2">
                    <div className="flex items-center gap-2 bg-[#F7F8FF] rounded-xl px-3">
                      <span className="text-xs md:text-sm opacity-70">🔍</span>
                      <input
                        value={kw}
                        onChange={(e) => setKw(e.target.value)}
                        placeholder={
                          typed
                            ? `Search roles like "${typed}…"`
                            : "Search by skill, role or company"
                        }
                        className="h-11 w-full bg-transparent text-[14px] md:text-[15px] focus:outline-none placeholder:text-[#9AA0C2]"
                      />
                    </div>

                    <div className="flex items-center bg-[#F7F8FF] rounded-xl px-3">
                      <select
                        value={exp}
                        onChange={(e) => setExp(e.target.value)}
                        className="h-11 w-full bg-transparent text-[14px] md:text-[15px] focus:outline-none border-0"
                      >
                        <option value="">Experience</option>
                        <option value="fresher">Fresher</option>
                        <option value="1">1 year</option>
                        <option value="2">2 years</option>
                        <option value="3">3 years</option>
                        <option value="4">4 years</option>
                        <option value="5">5+ years</option>
                      </select>
                    </div>

                    <div className="relative flex items-center bg-[#F7F8FF] rounded-xl px-3">
                      <input
                        value={loc}
                        onChange={(e) => setLoc(e.target.value)}
                        placeholder="Location"
                        className="h-11 w-full bg-transparent text-[14px] md:text-[15px] focus:outline-none placeholder:text-[#9AA0C2]"
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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <p className="text-[11px] text-[#091057]/55">
                      Start typing a role or company name. Use filters to narrow down.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#024CAA] text-white hover:bg-[#013b84] transition-colors"
                    >
                      Search jobs
                      <span>↵</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: illustration */}
            <div className="relative flex justify-center md:justify-end">
              <div className="absolute inset-0 blur-3xl opacity-50 bg-[radial-gradient(circle_at_top,_rgba(2,76,170,0.20),_transparent_60%)] pointer-events-none" />
              <img
                src="/assets/undraw_job-hunt_5umi.svg"
                alt="Talent working on laptop"
                className="relative z-[1] rounded-3xl border bg-white"
                style={{
                  width: "min(380px, 85vw)",
                  borderColor: "#DBD3D3",
                  boxShadow: "0 18px 50px rgba(9,16,87,0.22)",
                }}
              />
            </div>
          </div>
        </section>

        {/* ========= HOW WE WORK ========= */}
        <section className="py-12 md:py-16 bg-[#F6F7FB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-[0.18em] text-[#091057]/55">
                FROM LEARNING TO OFFER LETTER
              </p>
              <h2 className="mt-2 text-2xl md:text-[28px] font-extrabold text-[#091057]">
                A simple journey that keeps everyone aligned.
              </h2>
              <p className="mt-3 text-[14px] md:text-[15px] text-[#091057]/75">
                Students build skills, universities validate, and companies hire with confidence —
                all inside one clean workflow.
              </p>
            </div>

            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "1. Map your path",
                  desc: "Pick your goal. We break it into skills, projects, and milestones matched to real job descriptions.",
                  icon: "📍",
                },
                {
                  title: "2. Build & verify",
                  desc: "Complete guided projects and assessments. Universities & mentors validate your progress and badges.",
                  icon: "📚",
                },
                {
                  title: "3. Match & apply",
                  desc: "Your profile is matched with relevant roles. Companies see real work instead of just marksheets.",
                  icon: "💼",
                },
              ].map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl bg-white border border-[#E4E6F4] p-5 md:p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl text-lg mb-3 bg-[#024CAA] text-white">
                    {s.icon}
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#091057]">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-7 text-[#091057]/75">{s.desc}</p>
                </div>
              ))}
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
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i === idx ? "bg-[#024CAA]" : "bg-[#D5DBF0]"
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
