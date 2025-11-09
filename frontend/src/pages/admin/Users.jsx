import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

/* Minimal inline icons (no external libs) */
const I = {
  Search: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 6h18M8 6v14m8-14v14M10 6l1-2h2l1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>),
  Crown: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 7l4 3 5-5 5 5 4-3v10H3z" fill="currentColor"/></svg>),
  Spinner: (p) => (<svg viewBox="0 0 50 50" width="26" height="26" className="animate-spin" {...p}><circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.2"/><path d="M45 25a20 20 0 00-20-20" stroke="currentColor" strokeWidth="6" fill="none"/></svg>),
  Key: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><circle cx="7" cy="17" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 17h10l-3-3 3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>),
  Refresh: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M20 12a8 8 0 10-2.34 5.66" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M20 8v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
};

const Card = ({ children, className="" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/75 backdrop-blur shadow-sm ${className}`}>{children}</div>
);

const IconBtn = ({ title, onClick, children, variant="ghost", disabled }) => {
  const map = {
    ghost: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border border-rose-600",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 px-3 rounded-xl text-sm inline-flex items-center gap-2 ${map[variant]} ${disabled ? "opacity-60 cursor-not-allowed":""}`}
    >
      {children}
    </button>
  );
};

function EditModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    username: initial?.username || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    university: initial?.university || "",
    education: initial?.education || "",
    skills: Array.isArray(initial?.skills) ? initial.skills.join(", ") : (initial?.skills || ""),
    role: initial?.role || "student",
  });
  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || "",
        username: initial?.username || "",
        email: initial?.email || "",
        phone: initial?.phone || "",
        university: initial?.university || "",
        education: initial?.education || "",
        skills: Array.isArray(initial?.skills) ? initial.skills.join(", ") : (initial?.skills || ""),
        role: initial?.role || "student",
      });
    }
  }, [open, initial]);

  const save = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <Card className="w-full max-w-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">Edit User</div>
          <button onClick={onClose} className="text-slate-500">×</button>
        </div>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Name" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Username" value={form.username} onChange={(e)=>setForm(f=>({...f,username:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Email" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="University" value={form.university} onChange={(e)=>setForm(f=>({...f,university:e.target.value}))}/>
          <select className="border rounded-xl px-3 py-2" value={form.education} onChange={(e)=>setForm(f=>({...f,education:e.target.value}))}>
            <option value="">Education</option>
            <option value="UG">UG</option>
            <option value="PG">PG</option>
            <option value="PhD">PhD</option>
          </select>
          <div className="md:col-span-2">
            <input className="border rounded-xl px-3 py-2 w-full" placeholder="Skills (comma separated)" value={form.skills} onChange={(e)=>setForm(f=>({...f,skills:e.target.value}))}/>
          </div>
          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <select className="border rounded-xl px-3 py-2" value={form.role} onChange={(e)=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="student">Student</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <IconBtn onClick={onClose}>Cancel</IconBtn>
              <IconBtn variant="primary" onClick={save}>Save</IconBtn>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

function CreateModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "", username: "", email: "", phone: "",
    password: "", role: "student", university: "", education: "UG", skills: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    await onCreate(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <Card className="w-full max-w-2xl p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">Create User</div>
          <button onClick={onClose} className="text-slate-500">×</button>
        </div>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Name" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Username" value={form.username} onChange={(e)=>setForm(f=>({...f,username:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Email" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))}/>
          <input type="password" className="border rounded-xl px-3 py-2" placeholder="Password" value={form.password} onChange={(e)=>setForm(f=>({...f,password:e.target.value}))}/>
          <select className="border rounded-xl px-3 py-2" value={form.role} onChange={(e)=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
          <input className="border rounded-xl px-3 py-2" placeholder="University" value={form.university} onChange={(e)=>setForm(f=>({...f,university:e.target.value}))}/>
          <select className="border rounded-xl px-3 py-2" value={form.education} onChange={(e)=>setForm(f=>({...f,education:e.target.value}))}>
            <option value="UG">UG</option><option value="PG">PG</option><option value="PhD">PhD</option>
          </select>
          <div className="md:col-span-2">
            <input className="border rounded-xl px-3 py-2 w-full" placeholder="Skills (comma separated)" value={form.skills} onChange={(e)=>setForm(f=>({...f,skills:e.target.value}))}/>
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <IconBtn onClick={onClose}>Cancel</IconBtn>
            <IconBtn variant="primary" onClick={submit}>
              <I.Plus /> Create
            </IconBtn>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function UsersAdmin() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [limit, setLimit] = useState(10);

  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState("");

  const fetchUsers = async (resetPage = false) => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users", {
        params: { q, role, page: resetPage ? 1 : page, limit, sort }
      });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setPages(res.data.pages || 1);
    } catch (e) {
      console.error("Users fetch failed:", e?.response?.data || e.message);
      setRows([]); setTotal(0); setPage(1); setPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(true); /* initial */ }, []);
  useEffect(() => { fetchUsers(); /* on page change */ }, [page, limit, sort]);

  const resetFilters = () => {
    setQ(""); setRole(""); setSort("-createdAt"); setLimit(10); setPage(1);
    fetchUsers(true);
  };

  const updateUser = async (data) => {
    if (!editing?._id) return;
    setBusyId(editing._id);
    try {
      // save basic fields
      await API.put(`/admin/users/${editing._id}`, {
        name: data.name, username: data.username, email: data.email, phone: data.phone,
        university: data.university, education: data.education, skills: data.skills,
      });
      // if role changed, issue role patch
      if (data.role !== editing.role) {
        await API.patch(`/admin/users/${editing._id}/role`, { role: data.role });
      }
      setEditing(null);
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await API.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusyId("");
    }
  };

  const changeRole = async (id, newRole) => {
    setBusyId(id);
    try {
      await API.patch(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Role update failed");
    } finally {
      setBusyId("");
    }
  };

  const resetPassword = async (id) => {
    const np = window.prompt("New password (min 6 chars):");
    if (!np) return;
    try {
      await API.post(`/admin/users/${id}/reset-password`, { newPassword: np });
      alert("Password updated.");
    } catch (e) {
      alert(e?.response?.data?.message || "Reset failed");
    }
  };

  const pagesArr = useMemo(() => Array.from({ length: pages }, (_, i) => i + 1), [pages]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-indigo-500">Administration</div>
          <h2 className="text-2xl font-semibold text-slate-800">User Base</h2>
          <p className="text-sm text-slate-500">Manage students, companies and admins from one place.</p>
        </div>
        <div className="flex gap-2">
          <IconBtn onClick={() => fetchUsers()} title="Refresh"><I.Refresh/> Refresh</IconBtn>
          <IconBtn variant="primary" onClick={() => setShowCreate(true)} title="Create User">
            <I.Plus/> New User
          </IconBtn>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-b from-indigo-50/60 to-white">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(1); fetchUsers(true); } }}
              placeholder="Search name, email, username, phone…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="absolute left-3 top-2.5 text-slate-500"><I.Search/></div>
          </div>

          <select
            value={role}
            onChange={(e)=>{ setRole(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={sort}
            onChange={(e)=>{ setSort(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
          >
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="name">Name A→Z</option>
            <option value="-name">Name Z→A</option>
            <option value="email">Email A→Z</option>
            <option value="-email">Email Z→A</option>
          </select>

          <select
            value={limit}
            onChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
          >
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <b>{rows.length}</b> of <b>{total}</b> users
          </div>
          <button onClick={resetFilters} className="text-xs underline text-slate-600">Reset filters</button>
        </div>

        <div className="mt-3">
          <IconBtn variant="primary" onClick={()=>{ setPage(1); fetchUsers(true); }}>Apply</IconBtn>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <I.Spinner />
          <div className="mt-2 text-sm">Loading users…</div>
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-slate-600 bg-slate-50">No users found.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">University</th>
                  <th className="px-4 py-3">Education</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, idx) => (
                  <tr key={u._id} className={idx % 2 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3">{u.name || "—"}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs
                        ${u.role === "admin" ? "bg-indigo-100 text-indigo-700"
                          : u.role === "company" ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{u.username || "—"}</td>
                    <td className="px-4 py-3 text-center">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-center">{u.university || "—"}</td>
                    <td className="px-4 py-3 text-center">{u.education || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <IconBtn title="Edit" onClick={()=>setEditing(u)}><I.Edit/> Edit</IconBtn>
                        <IconBtn title="Reset Password" onClick={()=>resetPassword(u._id)}><I.Key/> Reset</IconBtn>
                        <IconBtn title="Make Admin" onClick={()=>changeRole(u._id, "admin")}><I.Crown/> Admin</IconBtn>
                        <IconBtn title="Delete" variant="danger" onClick={()=>removeUser(u._id)}>
                          {busyId===u._id ? <I.Spinner/> : <I.Trash/>} Delete
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex flex-wrap items-center justify-center gap-2">
            {pagesArr.map((p) => (
              <button
                key={p}
                onClick={()=>setPage(p)}
                className={`h-8 min-w-[2rem] px-2 rounded-full border text-sm ${
                  page === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Card>
      )}

      <EditModal
        open={!!editing}
        initial={editing}
        onClose={()=>setEditing(null)}
        onSave={updateUser}
      />

      <CreateModal
        open={showCreate}
        onClose={()=>setShowCreate(false)}
        onCreate={async (form) => {
          try {
            await API.post("/auth/register", {
              name: form.name,
              username: form.username,
              email: form.email,
              password: form.password,
              phone: form.phone,
              role: form.role,
              university: form.university,
              education: form.education,
              skills: form.skills,
            });
            setShowCreate(false);
            fetchUsers(true);
          } catch (e) {
            alert(e?.response?.data?.message || "Create failed");
          }
        }}
      />
    </div>
  );
}
