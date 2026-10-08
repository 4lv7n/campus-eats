interface Props {
  label: string;
  value: string | number;
  icon?: string;
  tone?: 'orange' | 'blue' | 'green' | 'purple';
}

const TONES = {
  orange: 'bg-orange-50 text-orange-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function DashboardCard({ label, value, icon, tone = 'orange' }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {icon && <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${TONES[tone]}`}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
