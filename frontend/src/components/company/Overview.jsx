import { Sparkles, Briefcase, Video, MapPin } from "lucide-react";

/**
 * Brand-aware UI atoms (no logic changed)
 */
const MetricCard = ({ label, value, tone = "blue", icon }) => {
  const tones = {
    blue:   { ring: "rgba(26,85,227,.12)", fg: "#1A55E3",  bg: "rgba(26,85,227,.08)" },
    pink:   { ring: "rgba(255,8,84,.14)",  fg: "#FF0854",  bg: "rgba(255,8,84,.08)" },
    green:  { ring: "rgba(0,210,132,.16)", fg: "#00D284",  bg: "rgba(0,210,132,.08)" },
    purple: { ring: "rgba(94,110,237,.14)",fg: "#5E6EED",  bg: "rgba(94,110,237,.08)" },
  };
  const t = tones[tone] || tones.blue;

  return (
    <div
      className="card p-4 md:p-5"
      style={{ boxShadow: "0 8px 28px rgba(2,8,23,.06)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl md:text-3xl font-semibold mt-1 text-slate-900">{value}</p>
        </div>
        <div
          className="h-10 w-10 md:h-12 md:w-12 grid place-items-center rounded-xl"
          style={{ background: t.bg, color: t.fg, boxShadow: `0 0 0 6px ${t.ring}` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActionBar = ({ onGoJobs }) => (
  <div
    className="card p-4 md:p-5"
    style={{ background: "linear-gradient(180deg,#ffffff, #f7fbff)" }}
  >
    <div className="flex items-center gap-2 mb-3">
      <Sparkles color="#1A55E3" size={18} />
      <h3 className="font-semibold text-slate-900">Quick Actions</h3>
    </div>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onGoJobs}
        className="btn btn-primary"
        title="Create a new job posting"
      >
        + Post a Job
      </button>
      <a
        href="/company/talent"
        className="btn btn-ghost"
        title="Search talent by scored skills"
      >
        Explore Talent
      </a>
    </div>
  </div>
);

const Pill = ({ children }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
    style={{
      background: "rgba(26,85,227,.08)",
      color: "#1A55E3",
      border: "1px solid rgba(26,85,227,.18)",
    }}
  >
    {children}
  </span>
);

export default function Overview({ kpis = [], jobs = [], webinars = [], onGoJobs }) {
  const openJobs = jobs.filter((j) => j.status === "open").slice(0, 5);
  const upcoming = webinars
    .filter((w) => new Date(w.startsAt) > new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top metrics — 4 cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <MetricCard
            key={k.label}
            label={k.label}
            value={k.value}
            tone={["blue", "purple", "pink", "green"][i % 4]}
            icon={k.icon ?? <Sparkles size={18} />}
          />
        ))}
      </div>

      {/* Quick actions */}
      <ActionBar onGoJobs={onGoJobs} />

      {/* Main grid: Open roles & Webinars */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Open Roles */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl grid place-items-center" style={{ background:"rgba(26,85,227,.08)", color:"#1A55E3" }}>
                <Briefcase size={18} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Open Roles</h3>
            </div>
            <a href="/company/jobs" className="text-sm text-[#1A55E3] hover:underline">See all</a>
          </div>

          {openJobs.length === 0 ? (
            <p className="text-sm text-slate-500">No open roles. Create one from Jobs.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {openJobs.map((j) => (
                <li key={j._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{j.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Pill>{j.type}</Pill>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} /> {j.location || "—"}
                        </span>
                      </div>
                    </div>
                    <a
                      className="text-sm text-[#5E6EED] hover:underline"
                      href="/company/jobs"
                      title="Manage job"
                    >
                      Manage
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Webinars */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl grid place-items-center" style={{ background:"rgba(94,110,237,.10)", color:"#5E6EED" }}>
                <Video size={18} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Webinars</h3>
            </div>
            <a href="/company/webinars" className="text-sm text-[#1A55E3] hover:underline">See all</a>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming webinars scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((w) => (
                <li key={w._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{w.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(w.startsAt).toLocaleString()} • {w.durationMins} mins
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={`/student/webinars/webinar/${w.roomId}`}
                        className="text-sm text-[#0DCAF0] hover:underline"
                        title="Open viewer link"
                      >
                        Join
                      </a>
                      <a
                        href={`/company/webinar/${w.roomId}`}
                        className="text-sm text-[#1A55E3] hover:underline"
                        title="Open studio link"
                      >
                        Open Studio
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom strip idea (kept minimal for now; ready for tables/analytics) */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Need deeper insights? Head to <a href="/company/screening" className="text-[#FF0854] hover:underline">Screening</a> to review applications & AI metrics.
          </div>
          <a href="/company/talent" className="btn btn-ghost">Open Talent Search</a>
        </div>
      </div>
    </div>
  );
}
