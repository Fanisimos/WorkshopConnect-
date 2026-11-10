import Link from "next/link";

/** Product wordmark. The mark is a simple loop arrow: attendance → feedback → follow-up. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-ink">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-700 text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v4h-4" />
        </svg>
      </span>
      <span>
        Workshop Connect<span className="text-brand-700">+</span>
      </span>
    </Link>
  );
}
