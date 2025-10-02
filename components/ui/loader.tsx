import { cn } from "@/lib/utils"

type LoaderProps = {
  size?: "sm" | "md" | "lg"
  className?: string
  label?: string
}

const sizeMap: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-12 w-12 border-2",
}

export function Loader({ size = "md", className, label }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        aria-label={label || "Loading"}
        role="status"
        className={cn("animate-spin rounded-full border-b-2 border-current text-foreground", sizeMap[size], className)}
      />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
    </div>
  )
}
