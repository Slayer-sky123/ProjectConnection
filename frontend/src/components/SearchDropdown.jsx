import { Link } from "react-router-dom";

/** Anchored results box for the homepage search bar. */
export default function SearchDropdown({ open, items, onPick }) {
  if (!open) return null;

  return (
    <div
      className="absolute left-0 top-full mt-2 w-full rounded-2xl overflow-hidden z-[60]"
      style={{
        border: "1px solid #E9E9EE",
        boxShadow: "0 18px 40px rgba(9,16,87,0.10)",
        background: "white",
        maxHeight: 360,
      }}
      role="listbox"
    >
      {items.length === 0 ? (
        <div className="p-4 text-sm text-[#091057]/60">No matching roles.</div>
      ) : (
        <>
          <div className="px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#091057]/45 bg-[#F7F8FF]">
            Matching roles
          </div>
          <ul className="overflow-auto">
            {items.map((j) => {
              const pkg = j?.package || {};
              const hasPkg = pkg.min || pkg.max;
              const pkgText = hasPkg
                ? `${pkg.min ? pkg.min : ""}${
                    pkg.min && pkg.max ? " - " : ""
                  }${pkg.max || ""} ${pkg.currency || "INR"}/${
                    pkg.unit || "year"
                  }`
                : "—";

              return (
                <li
                  key={j._id}
                  className="px-4 py-3 cursor-pointer hover:bg-[#F8FAFF] border-b last:border-0"
                  style={{ borderColor: "#F1F1F4" }}
                  onClick={() => onPick(j)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#091057] text-[14.5px]">
                        {j.title}
                      </div>
                      <div className="text-[12.5px] text-[#091057]/70 truncate">
                        {(j?.company?.name || "Company")} • {j.location || "—"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11.5px]">
                        <span
                          className="px-2 py-0.5 rounded-md border bg-white"
                          style={{ borderColor: "#E9E9EE", color: "#091057" }}
                        >
                          Exp: {j?.experience || "0-2 yrs"}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md border bg-white"
                          style={{ borderColor: "#E9E9EE", color: "#091057" }}
                        >
                          Offer: {pkgText}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/register"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 rounded-md px-3 py-1.5 text-[12px] font-semibold text-white hover:-translate-y-0.5 transition-transform"
                      style={{ backgroundColor: "#024CAA" }}
                    >
                      Apply
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
