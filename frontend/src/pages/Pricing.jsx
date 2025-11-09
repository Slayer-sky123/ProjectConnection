// src/pages/Pricing.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check, X, Sparkles, ShieldCheck, Users2, GraduationCap, Building2, Stars,
  ChevronDown, ChevronUp, ArrowRight, Briefcase, Trophy, Video, ClipboardList,
  Binary, Route as RouteIcon, Bell, BadgeCheck
} from "lucide-react";

/* tiny UI helpers */
const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${className}`}>
    {children}
  </span>
);
const Feature = ({ children }) => (
  <li className="flex items-start gap-2">
    <Check className="mt-0.5 text-emerald-600" size={16} />
    <span>{children}</span>
  </li>
);
const NoFeature = ({ children }) => (
  <li className="flex items-start gap-2 text-slate-500">
    <X className="mt-0.5" size={16} />
    <span>{children}</span>
  </li>
);

export default function Pricing() {
  const [cycle, setCycle] = useState("monthly"); // "monthly" | "annual"
  const [faqOpen, setFaqOpen] = useState(null);
  const price = (m, y) => (cycle === "monthly" ? m : y);

  /* Plans reflect your current build + room to grow */
  const tiers = useMemo(
    () => ([
      {
        key: "student_free",
        label: "Student — Free",
        icon: <GraduationCap className="text-sky-600" size={18} />,
        badge: "Best for starters",
        color: "from-sky-50 to-indigo-50",
        price: "₹0",
        period: "/forever",
        cta: { to: "/signup?role=student&plan=free", text: "Get Started" },
        features: [
          "Profile & basic networking",
          "Apply to limited jobs / month",
          "Skill tests (limited)",
          "Join public hackathons",
          "Join webinars (viewer)",
          "Notifications & badges (basic)",
        ],
        missing: [
          "AI résumé optimizer",
          "Interview simulator",
          "Advanced analytics",
        ],
      },
      {
        key: "student_pro",
        label: "Student — Pro",
        icon: <Stars className="text-indigo-600" size={18} />,
        badge: "Most popular",
        color: "from-indigo-50 to-violet-50",
        price: `₹${price(299, 249)}`,
        period: cycle === "monthly" ? "/month" : "/month (billed annually)",
        highlight: true,
        cta: { to: "/checkout?role=student&plan=pro", text: "Upgrade to Pro" },
        features: [
          "Unlimited job applications",
          "AI résumé & portfolio optimization",
          "Interview simulator & tips",
          "Advanced profile analytics",
          "Priority support",
        ],
        missing: [],
      },
      {
        key: "recruiter",
        label: "Recruiter / Company",
        icon: <Users2 className="text-emerald-600" size={18} />,
        badge: "For hiring teams",
        color: "from-emerald-50 to-teal-50",
        price: `₹${price(3999, 3499)}`,
        period: cycle === "monthly" ? "/month" : "/month (billed annually)",
        cta: { to: "/company/subscribe?plan=recruiter", text: "Start Hiring" },
        features: [
          "Unlimited job postings",
          "Smart candidate screening (resume/test/fit)",
          "Interview scheduling + host join link",
          "Talent search & filters",
          "Company branding page",
          "Webinars (Studio host)",
          "Hackathons: create, judge, leaderboard",
        ],
        missing: [],
      },
      {
        key: "university",
        label: "University Suite",
        icon: <Building2 className="text-rose-600" size={18} />,
        badge: "For placement cells",
        color: "from-rose-50 to-orange-50",
        price: `₹${price(14999, 12999)}`,
        period: cycle === "monthly" ? "/month" : "/month (billed annually)",
        cta: { to: "/contact?type=university", text: "Talk to Sales" },
        features: [
          "Cohort analytics & dashboards",
          "Skill-gap & curriculum insights",
          "Placement tracking & reports",
          "Private talent network",
          "Multi-admin roles & SSO",
        ],
        note: "Custom onboarding & SLAs available.",
        missing: [],
      },
    ]),
    [cycle]
  );

  const addons = [
    {
      title: "AI Tools Pack",
      price: `₹${price(199, 149)}`,
      period: cycle === "monthly" ? "/month per user" : "/month per user (annual)",
      features: ["Résumé rewrite & score", "Cover-letter generator", "Job match predictor"],
    },
    {
      title: "Event & Hackathon Sponsorship",
      price: "Custom",
      period: "",
      features: ["Branding across events", "Talent leads & insights", "Judging & stage time"],
    },
  ];

  /* Comparison focuses on features you already have live */
  const compare = [
    { label: "Unlimited applications", free: false, student: true, recruiter: "—", uni: "—" },
    { label: "Skill tests & progress", free: true, student: true, recruiter: "—", uni: "—" },
    { label: "Career roadmap", free: true, student: true, recruiter: "—", uni: "—" },
    { label: "Interview scheduling (join links)", free: "—", student: "—", recruiter: true, uni: true },
    { label: "Smart screening (resume/test/fit)", free: "—", student: "—", recruiter: true, uni: true },
    { label: "Talent search", free: "—", student: "—", recruiter: true, uni: true },
    { label: "Webinars (viewer/studio)", free: "viewer", student: "viewer", recruiter: "studio", uni: "studio" },
    { label: "Hackathons (join/create/judge)", free: "join", student: "join", recruiter: "create/judge", uni: "create/judge" },
    { label: "Cohort analytics", free: "—", student: "—", recruiter: "—", uni: true },
  ];

  const faqs = [
    {
      q: "Does Student Pro include AI résumé tools and interview simulator?",
      a: "Yes. Student Pro unlocks AI résumé optimization, portfolio suggestions, and an interview simulator with feedback.",
    },
    {
      q: "How do company interviews work?",
      a: "Recruiters schedule interviews (stage, time, duration). Both company and student get join links; company joins the Studio, student joins the viewer.",
    },
    {
      q: "What’s included in hackathons?",
      a: "Registration, team name, submissions (repo/demo/file), judging with scores & feedback, and leaderboard publishing are all supported.",
    },
    {
      q: "Can universities get custom onboarding and SLAs?",
      a: "Yes. The University Suite includes custom onboarding, SSO, cohort analytics, and optional SLAs.",
    },
    {
      q: "Is there a free trial?",
      a: "We offer a 7‑day trial for Student Pro with limited AI credits. Companies can request a pilot via Sales.",
    },
  ];

  const modules = [
    { to: "/student/jobs", icon: <Briefcase size={18} />, title: "Jobs & Applications", desc: "Modern board, apply/withdraw, status, résumé links." },
    { to: "/student/status", icon: <ClipboardList size={18} />, title: "Application Tracking", desc: "Live statuses, interview window & join buttons." },
    { to: "/student/hackathons", icon: <Trophy size={18} />, title: "Hackathons", desc: "Register, submit, see feedback & leaderboard." },
    { to: "/student/webinars", icon: <Video size={18} />, title: "Webinars", desc: "Attend live sessions; companies host via Studio." },
    { to: "/student/testskill", icon: <Binary size={18} />, title: "Skill Tests", desc: "Timed MCQs, overview grid, auto‑scored, progress." },
    { to: "/student/roadmap", icon: <RouteIcon size={18} />, title: "Career Roadmap", desc: "AI‑guided steps, topics, resources per skill." },
    { to: "/student/badges", icon: <BadgeCheck size={18} />, title: "Badges", desc: "Earn achievements; show credibility on profile." },
    { to: "/student/dashboard", icon: <Bell size={18} />, title: "Notifications", desc: "Clean, minimal updates across modules." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero */}
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 text-xs font-medium">
                <Sparkles size={14} /> Built around your live features
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Pricing that scales with students, recruiters, and universities
              </h1>
              <p className="mt-3 text-slate-600">
                Freemium for learners, Pro tools for career acceleration, and powerful suites for hiring teams
                & universities. Clean, pastel, responsive — ready for today’s UX.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="text-emerald-600" size={16} />
                14‑day refund on first purchase • Cancel anytime
              </div>
            </div>

            {/* Billing cycle toggle */}
            <div className="shrink-0 rounded-xl border bg-white p-2 ring-1 ring-slate-200">
              <div className="flex items-center">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${cycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("annual")}
                  className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium ${cycle === "annual" ? "bg-slate-900 text-white" : "text-slate-700"}`}
                >
                  Annual <span className="ml-1 text-emerald-600 font-semibold">(Save ~15%)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Your live modules (quick links) */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Everything live in your build</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((m, i) => (
              <Link key={i} to={m.to} className="group rounded-2xl border bg-white/80 backdrop-blur p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-white border grid place-items-center">{m.icon}</div>
                    <div className="font-semibold">{m.title}</div>
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="mt-2 text-sm text-slate-600">{m.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Tiers */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div key={t.key} className={`group relative rounded-2xl border bg-gradient-to-b ${t.color} p-1 hover:shadow-sm transition`}>
              <div className="rounded-2xl bg-white/80 backdrop-blur p-5 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-white border grid place-items-center">{t.icon}</div>
                    <div className="font-semibold">{t.label}</div>
                  </div>
                  {t.badge && <Pill className="bg-indigo-50 text-indigo-700 ring-indigo-200">{t.badge}</Pill>}
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold">{t.price}</div>
                  <div className="text-xs text-slate-600">{t.period}</div>
                  {t.note && <div className="text-xs text-slate-500 mt-1">{t.note}</div>}
                </div>

                <ul className="mt-4 space-y-2 text-sm">
                  {t.features.map((f, i) => <Feature key={i}>{f}</Feature>)}
                  {t.missing?.map((m, i) => <NoFeature key={`m-${i}`}>{m}</NoFeature>)}
                </ul>

                <Link
                  to={t.cta.to}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                    ${t.highlight ? "bg-slate-900 text-white hover:bg-black" : "bg-white border hover:bg-slate-50"}`}
                >
                  {t.cta.text} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Add-ons */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold">Add‑ons</h2>
            <p className="text-slate-600 text-sm mt-1">Enhance any plan with AI tools and sponsored events.</p>
          </div>
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
            {[
              ...addons,
              {
                title: "Custom Integrations",
                price: "Quote",
                period: "",
                features: ["SSO/SAML", "ATS/HRIS bridges", "Data exports & APIs"],
              },
            ].map((a, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{a.price}</div>
                    <div className="text-xs text-slate-600">{a.period}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {a.features.map((f, k) => <Feature key={k}>{f}</Feature>)}
                </ul>
                <div className="mt-4">
                  <Link
                    to={i === 0 ? "/checkout?addon=ai_tools" : "/contact?type=sponsorship"}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Learn more <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="p-3 text-left w-1/3">Features</th>
                  <th className="p-3 text-center">Student Free</th>
                  <th className="p-3 text-center">Student Pro</th>
                  <th className="p-3 text-center">Recruiter</th>
                  <th className="p-3 text-center">University</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{row.label}</td>
                    {[row.free, row.student, row.recruiter, row.uni].map((v, idx) => (
                      <td key={idx} className="p-3 text-center">
                        {v === true ? (
                          <Check className="inline text-emerald-600" size={18} />
                        ) : v === "—" ? (
                          <span className="text-slate-400">—</span>
                        ) : v === "viewer" ? (
                          <span className="text-slate-700">Viewer</span>
                        ) : v === "studio" ? (
                          <span className="text-slate-700">Studio</span>
                        ) : v === "join" ? (
                          <span className="text-slate-700">Join</span>
                        ) : v === "create/judge" ? (
                          <span className="text-slate-700">Create/Judge</span>
                        ) : (
                          <X className="inline text-slate-400" size={18} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div>
            <h2 className="text-xl font-semibold">FAQs</h2>
            <p className="text-slate-600 text-sm mt-1">
              Everything you need to know before choosing a plan.
            </p>
          </div>
          <div className="lg:col-span-2 space-y-2">
            {faqs.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} className="rounded-2xl border bg-white">
                  <button
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm font-medium text-left">{f.q}</span>
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {open && <div className="px-4 pb-4 text-sm text-slate-600">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Ready to list your first role or join a hackathon?</h3>
            <p className="text-slate-600 text-sm">Students grow careers. Recruiters hire faster. Universities get better outcomes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/signup?role=student&plan=pro" className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm">
              Try Pro free
            </Link>
            <Link to="/company/subscribe?plan=recruiter" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Start Hiring
            </Link>
            <Link to="/contact?type=university" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Talk to Sales
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-slate-500">
          Prices shown are indicative. Currency and tax are finalized at checkout.
        </p>
      </main>
    </div>
  );
}
