import Link from 'next/link';

interface Props {
  icon?: string;
  title: string;
  text?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ icon = '🍽️', title, text, actionLabel, actionHref }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-slate-800">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-5 inline-block rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
