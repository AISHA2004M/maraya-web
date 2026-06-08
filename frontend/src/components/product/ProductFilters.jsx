const GENDERS = ["All", "women", "men", "unisex"];

export default function ProductFilters({ filters, onChange }) {
  const setGender = (g) =>
    onChange({ ...filters, gender: g === "All" ? undefined : g });

  const active = filters.gender || "All";

  return (
    <div className="flex items-center gap-1 border border-rule">
      {GENDERS.map((g) => {
        const isActive = active === g;
        return (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`px-5 py-2.5 text-[0.6rem] font-semibold tracking-widest uppercase transition-all ${
              isActive
                ? "bg-ink text-white"
                : "bg-white text-muted hover:text-ink"
            }`}
          >
            {g === "All" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
