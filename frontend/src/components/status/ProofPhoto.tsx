import { Camera } from "lucide-react";

/** Delivery proof thumbnail — the session cookie rides along on the same-origin <img>. */
export function ProofPhoto({ requestId }: { requestId: string }) {
  const src = `/api/requests/${requestId}/proof`;
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-2 pr-3 transition-colors hover:border-[#047857]/40"
      data-testid={`proof-photo-${requestId}`}
    >
      <img
        src={src}
        alt="Delivery proof"
        loading="lazy"
        className="h-14 w-20 rounded-lg object-cover"
      />
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857]">
        <Camera className="h-3.5 w-3.5" /> Delivery photo
      </span>
    </a>
  );
}
