'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search food or outlets...', className = '' }: Props) {
  return (
    <div className={`flex w-full gap-2 ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        aria-label="Search"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
      />
      {onSubmit && (
        <button onClick={onSubmit} className="rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600">
          Search
        </button>
      )}
    </div>
  );
}
