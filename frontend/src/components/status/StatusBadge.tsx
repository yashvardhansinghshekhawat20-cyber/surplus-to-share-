import { Badge } from "@/components/ui/badge";
import { DONATION_STATUS_LABEL, REQUEST_STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DonationStatus, RequestStatus } from "@/types";

const REQUEST_STYLES: Record<RequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-sky-200 bg-sky-50 text-sky-800",
  assigned: "border-violet-200 bg-violet-50 text-violet-800",
  collected: "border-teal-200 bg-teal-50 text-teal-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const DONATION_STYLES: Record<DonationStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  claimed: "border-amber-200 bg-amber-50 text-amber-800",
  completed: "border-stone-200 bg-stone-100 text-stone-700",
};

export function RequestStatusBadge({ status, testId }: { status: RequestStatus; testId?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] uppercase tracking-[0.08em]", REQUEST_STYLES[status])}
      data-testid={testId}
    >
      {REQUEST_STATUS_LABEL[status]}
    </Badge>
  );
}

export function DonationStatusBadge({ status, testId }: { status: DonationStatus; testId?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] uppercase tracking-[0.08em]", DONATION_STYLES[status])}
      data-testid={testId}
    >
      {DONATION_STATUS_LABEL[status]}
    </Badge>
  );
}
