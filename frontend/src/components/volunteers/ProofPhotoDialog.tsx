import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPatch } from "@/lib/api";
import { apiErrorMessage, fmtQty } from "@/lib/format";
import { compressImage } from "@/lib/image";
import type { DeliveryStatusPayload, FoodRequest } from "@/types";

export function ProofPhotoDialog({
  delivery,
  onClose,
}: {
  delivery: FoodRequest | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const close = () => {
    setPhoto(null);
    onClose();
  };

  const deliverMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: DeliveryStatusPayload }) =>
      apiPatch<FoodRequest>(`/volunteer/deliveries/${id}`, body),
    onSuccess: () => {
      toast.success("Delivery completed — photo saved. Great work!");
      queryClient.invalidateQueries();
      close();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      setPhoto(await compressImage(file));
    } catch {
      toast.error("Couldn't read that photo — please use a JPG or PNG image");
    } finally {
      setReading(false);
    }
  };

  return (
    <Dialog open={!!delivery} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md" data-testid="proof-photo-dialog">
        {delivery && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-tight">
                Confirm delivery with a photo
              </DialogTitle>
              <DialogDescription>
                {fmtQty(delivery.quantity, delivery.unit)} of “{delivery.donation_title}” to{" "}
                {delivery.recipient_organization || delivery.recipient_name}. A photo of the
                hand-over is required — the NGO, donor and admin can see it.
              </DialogDescription>
            </DialogHeader>

            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f1f5f9] p-4 text-center transition-colors hover:border-[#047857]/50"
              data-testid="proof-photo-dropzone"
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Delivery proof preview"
                  className="max-h-56 rounded-lg object-contain"
                  data-testid="proof-photo-preview"
                />
              ) : (
                <>
                  <Camera className="h-7 w-7 text-[#047857]" />
                  <span className="text-sm font-semibold text-[#0f172a]">
                    {reading ? "Processing photo…" : "Take or choose a photo"}
                  </span>
                  <span className="text-xs text-[#475569]">Opens the camera on phones</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
                data-testid="proof-photo-input"
              />
            </label>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs font-semibold text-[#059669] hover:underline"
                data-testid="proof-photo-retake"
              >
                Retake photo
              </button>
            )}

            <Button
              onClick={() =>
                photo &&
                deliverMutation.mutate({
                  id: delivery.id,
                  body: { status: "delivered", proof_photo: photo },
                })
              }
              disabled={!photo || reading || deliverMutation.isPending}
              className="w-full"
              data-testid="btn-confirm-delivered"
            >
              {deliverMutation.isPending ? "Saving…" : "Mark delivered"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
