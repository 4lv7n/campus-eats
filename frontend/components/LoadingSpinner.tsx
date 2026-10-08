export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
