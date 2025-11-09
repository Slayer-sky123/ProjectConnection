export default function CompanyTabs({ tabs, activeTab, onChange, mobileOpen, primary = "#1A55E3" }) {
  return (
    <div className={`border-t md:border-none ${mobileOpen ? "block" : "hidden md:block"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? "text-white shadow"
                    : "text-gray-700 hover:bg-slate-100"
                }`}
                style={active ? { backgroundColor: primary } : {}}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
