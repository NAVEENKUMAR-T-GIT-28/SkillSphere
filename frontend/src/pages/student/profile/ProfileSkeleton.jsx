/**
 * Skeleton loader for the Profile page.
 * Mimics the actual layout so the page doesn't jump on load.
 */
export default function ProfileSkeleton() {
  const Pulse = ({ className }) => (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 py-4">

      {/* Hero Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <Pulse className="h-14 w-14 !rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Pulse className="h-6 w-48" />
            <Pulse className="h-4 w-32" />
            <div className="flex gap-2 mt-2">
              <Pulse className="h-6 w-24 !rounded-full" />
              <Pulse className="h-6 w-20 !rounded-full" />
              <Pulse className="h-6 w-16 !rounded-full" />
            </div>
            <div className="grid gap-2 md:grid-cols-2 mt-3">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-4 w-36" />
              <Pulse className="h-4 w-44" />
              <Pulse className="h-4 w-28" />
            </div>
          </div>
          <Pulse className="h-28 w-48 !rounded-xl shrink-0" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <Pulse className="h-8 w-8" />
              <Pulse className="h-3 w-12" />
            </div>
            <Pulse className="mt-3 h-6 w-16" />
            <Pulse className="mt-1 h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Sidebar + Form Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[260px] shrink-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            {[...Array(5)].map((_, i) => (
              <Pulse key={i} className="h-10 w-full mb-1.5" />
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <Pulse className="h-[72px] w-[72px] !rounded-full mx-auto" />
            <Pulse className="mt-3 h-4 w-24 mx-auto" />
            <div className="mt-3 space-y-2">
              {[...Array(6)].map((_, i) => (
                <Pulse key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
            <Pulse className="h-5 w-40" />
            <Pulse className="h-3 w-60" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-4">
              <div className="space-y-1.5">
                <Pulse className="h-4 w-20" />
                <Pulse className="h-10 w-full" />
              </div>
              <div className="space-y-1.5">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
