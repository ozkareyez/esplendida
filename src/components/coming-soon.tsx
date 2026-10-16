import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  message?: string;
}

export function ComingSoon({ title = "Muy pronto", message }: ComingSoonProps) {
  return (
    <div className="container mx-auto px-4 py-16 lg:px-6 lg:py-20">
      <div className="mx-auto max-w-lg rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-[var(--shadow-soft)]">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="text-h3">{title}</h2>
        {message && <p className="text-body mt-2 text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
