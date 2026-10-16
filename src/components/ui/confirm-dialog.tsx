"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";

export function ConfirmDialog() {
  const options = useConfirm((s) => s.options);
  const settle = useConfirm((s) => s.settle);
  const open = options !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
    >
      <DialogContent showCloseButton={false}>
        <div className="flex items-start gap-3">
          <span
            className={
              options?.destructive
                ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            }
          >
            <CircleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle>{options?.title ?? ""}</DialogTitle>
            {options?.description && (
              <DialogDescription className="mt-1">{options.description}</DialogDescription>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => settle(false)}>
            {options?.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            variant={options?.destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
