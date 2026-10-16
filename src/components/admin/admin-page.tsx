import { cn } from "@/lib/utils";

export function AdminPageContainer({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          {Icon && <Icon className="h-6 w-6 text-primary" aria-hidden="true" />}
          {title}
        </h1>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
