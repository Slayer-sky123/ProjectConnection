import { Link } from "react-router-dom";

/** Premium rectangular job card — fills grid cell cleanly. */
export default function JobCard({ job }) {
  const pkg = job?.package || {};
  const hasPkg = pkg.min || pkg.max;
  const pkgText = hasPkg
    ? `${pkg.min ? pkg.min : ""}${pkg.min && pkg.max ? " - " : ""}${pkg.max || ""} ${
        pkg.currency || "INR"
      }/${pkg.unit || "year"}`
    : "—";
  const start = job?.startDate ? new Date(job.startDate).toLocaleDateString() : "Immediate";
  const type = job?.type || job?.jobType || "";

  return (
    <div
      className="h-full rounded-2xl bg-white px-5 py-4 flex flex-col justify-between relative overflow-hidden group border border-[#E4E6F4] shadow-[0_14px_34px_rgba(9,16,87,0.06)]"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-extrabold text-[15.5px] leading-snug text-[#091057]">
            {job?.title || "Role"}
          </div>
          <div className="mt-1 text-[12.5px]">
            <span className="font-semibold text-[#024CAA]">
              {job?.company?.name || "Company"}
            </span>
            <span className="mx-1 text-[#091057]/40">•</span>
            <span className="text-[#091057]/75">{job?.location || "—"}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className="h-9 w-9 shrink-0 rounded-full overflow-hidden grid place-items-center bg-[#F2F6FF] border border-[#DBD3D3]"
          >
            {job?.company?.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job?.company?.name || "logo"}
                className="h-9 w-9 object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-[10px] text-[#091057]">Logo</span>
            )}
          </div>
          {type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4F6FF] text-[#024CAA]">
              {type}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
        <div>
          <div className="text-[#091057]/55">Offer</div>
          <div className="font-semibold text-[#091057] truncate">{pkgText}</div>
        </div>
        <div>
          <div className="text-[#091057]/55">Start</div>
          <div className="font-semibold text-[#091057] truncate">{start}</div>
        </div>
        <div>
          <div className="text-[#091057]/55">Exp</div>
          <div className="font-semibold text-[#091057]">
            {job?.experience || "0-2 yrs"}
          </div>
        </div>
        <div>
          <div className="text-[#091057]/55">Openings</div>
          <div className="font-semibold text-[#091057]">{job?.openings ?? 1}</div>
        </div>
      </div>

      <Link
        to="/register"
        className="mt-3 block w-full text-center rounded-lg py-2 text-[13px] font-semibold text-white group-hover:-translate-y-0.5 transition-transform"
        style={{ backgroundColor: "#024CAA", boxShadow: "0 10px 26px rgba(2,76,170,0.25)" }}
      >
        Apply
      </Link>
    </div>
  );
}
