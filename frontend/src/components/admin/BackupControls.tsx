import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileJson, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiUpload } from "@/lib/api";
import { apiErrorMessage } from "@/lib/format";
import type { RestoreResult } from "@/types";

export function BackupControls() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const restore = useMutation({
    mutationFn: (f: File) => apiUpload<RestoreResult>("/admin/restore", f),
    onSuccess: (r) => {
      toast.success(
        `Restored: ${r.users_added} users added / ${r.users_updated} updated, ` +
          `${r.donations_added + r.donations_updated} donations, ${r.requests_added + r.requests_updated} requests, ` +
          `${r.photos_restored} photos` + (r.users_skipped ? ` · ${r.users_skipped} skipped (email already used)` : ""),
        { duration: 10000 },
      );
      queryClient.invalidateQueries();
      setFile(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href="/api/admin/backup.xlsx" download className={buttonVariants({ variant: "outline" })} data-testid="btn-download-backup">
        <Download className="h-4 w-4" /> Excel backup
      </a>
      <a href="/api/admin/backup-full.json" download className={buttonVariants({ variant: "outline" })} data-testid="btn-download-full-backup">
        <FileJson className="h-4 w-4" /> Full backup
      </a>
      <Button variant="outline" onClick={() => inputRef.current?.click()} data-testid="btn-restore-backup">
        <Upload className="h-4 w-4" /> Restore
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
        data-testid="restore-file-input"
      />
      <Dialog open={!!file} onOpenChange={(o) => !o && setFile(null)}>
        <DialogContent className="max-w-md" data-testid="restore-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">Restore from backup?</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{file?.name}</span> — records missing here are added and existing
              ones are updated to the backup's version. Nothing is deleted.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => file && restore.mutate(file)}
            disabled={restore.isPending}
            data-testid="btn-confirm-restore"
          >
            {restore.isPending ? "Restoring…" : "Restore now"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
