'use client';

export interface Filters {
  category: string;
  maxPrice: string; // kept as text so the input can be empty
  availableOnly: boolean;
}

interface Props {
  filters: Filters;
  categories: string[];
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, categories, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const input = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label="Category" value={filters.category} onChange={(e) => set({ category: e.target.value })} className={input}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        aria-label="Maximum price"
        placeholder="Max price ₹"
        value={filters.maxPrice}
        onChange={(e) => set({ maxPrice: e.target.value })}
        className={`${input} w-32`}
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={filters.availableOnly} onChange={(e) => set({ availableOnly: e.target.checked })} className="h-4 w-4 accent-orange-500" />
        Available only
      </label>
      {(filters.category || filters.maxPrice || filters.availableOnly) && (
        <button onClick={() => onChange({ category: '', maxPrice: '', availableOnly: false })} className="text-sm font-medium text-orange-600 hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}
