import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const STEPS: { key: RequestStatus; label: string }[] = [
  { key: "pending", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "assigned", label: "Volunteer" },
  { key: "collected", label: "Collected" },
  { key: "delivered", label: "Delivered" },
];

export function RequestTimeline({ status }: { status: RequestStatus }) {
  if (status === "rejected") {
    return (
      <p className="text-sm font-medium text-red-700" data-testid="request-timeline-rejected">
        This request was not approved.
      </p>
    );
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center gap-1.5" data-testid="request-timeline">
      {STEPS.map((step, i) => (
        <li key={step.key} className="flex flex-1 items-center gap-1.5 last:flex-none">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              i <= current ? "bg-emerald-600" : "bg-stone-300",
            )}
          />
          <span
            className={cn(
              "hidden whitespace-nowrap text-xs sm:block",
              i <= current ? "font-medium text-emerald-800" : "text-stone-400",
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <span className={cn("h-px flex-1", i < current ? "bg-emerald-600" : "bg-stone-300")} />
          )}
        </li>
      ))}
    </ol>
  );
}
