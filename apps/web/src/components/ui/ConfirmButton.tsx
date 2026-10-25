import { useEffect, useState } from "react";
import { Button } from "./Button";

interface ConfirmButtonProps {
  children: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  variant?: "secondary" | "danger";
  onConfirm: () => void;
}

/** Destructive action in two clicks: the first arms it, the second (within 5s) runs it. */
export function ConfirmButton({ children, confirmLabel, pendingLabel, pending, variant = "danger", onConfirm }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      variant={armed ? "danger" : variant}
      pending={pending}
      pendingLabel={pendingLabel}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => !pending && setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
