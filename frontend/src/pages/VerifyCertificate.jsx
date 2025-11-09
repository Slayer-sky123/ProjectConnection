import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldCheck, Copy, ExternalLink, RefreshCcw, AlertTriangle } from "lucide-react";
import { verifyPublicCertificate } from "../api/certificates";

const COLORS = {
  primary: "#145da0",
  dark: "#0c2d48",
  light: "#e6eef4",
  ok: "#059669",
  warn: "#b45309",
  danger: "#dc2626",
};

export default function VerifyCertificate() {
  const { hash: routeHash } = useParams();
  const [state, setState] = useState({ loading: true, found: false, data: null, error: "" });

  const hash = useMemo(() => (routeHash || "").trim(), [routeHash]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!hash) {
        if (mounted) {
          setState({
            loading: false,
            found: false,
            data: null,
            error: "Missing verification hash.",
          });
        }
        return;
      }

      setState((s) => ({ ...s, loading: true, error: "" }));

      try {
        const res = await verifyPublicCertificate(hash); // GET /api/certificates/public/:hash
        if (!mounted) return;

        if (res?.ok && res?.certificate) {
          setState({
            loading: false,
            found: true,
            data: res.certificate,
            error: "",
          });
        } else {
          setState({
            loading: false,
            found: false,
            data: null,
            error: "Certificate not found.",
          });
        }
      } catch (err) {
        if (!mounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to verify certificate.";
        setState({
          loading: false,
          found: false,
          data: null,
          error: msg,
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hash]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const statusBadge = (statusStr) => {
    const s = (statusStr || "").toLowerCase();
    if (s === "revoked") {
      return (
        <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "#fecaca", color: COLORS.danger, background: "#fee2e2" }}>
          Revoked
        </span>
      );
    }
    // default "issued"
    return (
      <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "#bbf7d0", color: COLORS.ok, background: "#ecfdf5" }}>
        Issued
      </span>
    );
  };

  const TitleBar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6" style={{ color: COLORS.primary }} />
        <h1 className="text-xl font-bold" style={{ color: COLORS.dark }}>
          Certificate Verification
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-slate-50"
          style={{ borderColor: COLORS.light }}
          onClick={() => window.location.reload()}
          title="Refresh"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-slate-50"
          style={{ borderColor: COLORS.light }}
          onClick={copyLink}
          title="Copy public verify link"
        >
          <Copy className="w-4 h-4" />
          Copy Link
        </button>
      </div>
    </div>
  );

  if (state.loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="w-full max-w-2xl bg-white border rounded-2xl p-8 shadow-sm" style={{ borderColor: COLORS.light }}>
          <TitleBar />
          <div className="flex items-center gap-3 text-slate-600">
            <RefreshCcw className="w-5 h-5 animate-spin" />
            Verifying certificate…
          </div>
        </div>
      </div>
    );
  }

  if (!state.found) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="w-full max-w-2xl bg-white border rounded-2xl p-8 shadow-sm" style={{ borderColor: COLORS.light }}>
          <TitleBar />
          <div className="flex items-start gap-3 text-slate-700">
            <XCircle className="w-5 h-5" style={{ color: COLORS.danger }} />
            <div>
              <div className="font-semibold mb-1">Verification failed</div>
              <div className="text-sm text-slate-600">
                {state.error || "Certificate not found."}
              </div>
              {!hash && (
                <div className="text-xs text-slate-500 mt-2">
                  Tip: Open a valid link such as <code>/verify/&lt;hash&gt;</code> or use the button on your certificate.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4" style={{ borderColor: COLORS.light }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline"
              title="Go home"
            >
              <ExternalLink className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // success render
  const c = state.data || {};
  const issued = new Date(c.issueDate);

  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div
        className="w-full max-w-3xl bg-white border rounded-2xl p-8 shadow-sm"
        style={{
          borderColor: COLORS.light,
          backgroundImage:
            "radial-gradient(28rem 18rem at -10% -10%, rgba(20,93,160,0.05), transparent 55%), radial-gradient(22rem 16rem at 110% 110%, rgba(46,139,192,0.06), transparent 60%)",
        }}
      >
        <TitleBar />

        {/* Success strip */}
        <div
          className="flex items-center gap-3 mb-6 rounded-xl px-4 py-3"
          style={{ background: "#ecfdf5", border: "1px solid #bbf7d0" }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.ok }} />
          <div className="text-sm text-slate-700">
            This certificate is <b>valid</b> and was issued by{" "}
            <span className="font-semibold">{c.university?.name}</span>.
          </div>
        </div>

        {/* Card */}
        <div className="grid md:grid-cols-[1fr,240px] gap-6">
          {/* Left: Essentials only */}
          <div>
            <div className="mb-4">
              <div className="text-[13px] text-slate-500">Certificate Title</div>
              <div className="text-lg md:text-xl font-bold" style={{ color: COLORS.dark }}>
                {c.title}
              </div>
              {c.description ? (
                <p className="mt-1 text-sm text-slate-600">{c.description}</p>
              ) : null}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow label="University" value={c.university?.name || "—"} />
              <InfoRow label="Student" value={c.student?.name || "—"} />
              <InfoRow label="Issue Date" value={isNaN(+issued) ? "—" : issued.toLocaleDateString()} />
              <InfoRow
                label="Status"
                value={
                  <span className="inline-block align-middle">
                    {statusBadge(c.status)}
                  </span>
                }
              />
              <InfoRow
                label="Verification Hash"
                value={
                  <code className="text-xs break-all">
                    {c.hash}
                  </code>
                }
              />
              {c.student?.studentId ? (
                <InfoRow label="Student ID" value={c.student.studentId} />
              ) : null}
            </div>

            {/* Small advisory if revoked */}
            {(c.status || "").toLowerCase() === "revoked" && (
              <div
                className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ background: "#fff7ed", border: "1px solid #ffedd5" }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warn, marginTop: 2 }} />
                <div className="text-xs text-slate-700">
                  This certificate has been revoked by the issuing university. Contact the university for clarification.
                </div>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="rounded-xl border p-4 h-fit" style={{ borderColor: COLORS.light }}>
            <div className="text-sm font-semibold mb-3" style={{ color: COLORS.dark }}>
              Share & Verify
            </div>
            <div className="space-y-2">
              <button
                onClick={copyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50"
                style={{ borderColor: COLORS.light }}
              >
                <Copy className="w-4 h-4" /> Copy Verify Link
              </button>
              <a
                href={`/verify/${c.hash}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50"
                style={{ borderColor: COLORS.light }}
              >
                <ExternalLink className="w-4 h-4" /> Open Public Page
              </a>
            </div>

            <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
              Only essential details are shown on this public page. Additional metadata and controls are available to the issuing university inside their dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg p-3 border bg-white" style={{ borderColor: "#e6eef4" }}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm mt-0.5 text-slate-800">
        {typeof value === "string" || typeof value === "number" ? value : value}
      </div>
    </div>
  );
}
