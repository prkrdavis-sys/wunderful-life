type UploadProgressBarProps = {
  label: string;
  message: string;
  progress: number;
  indeterminate?: boolean;
};

export function UploadProgressBar({
  label,
  message,
  progress,
  indeterminate = false,
}: UploadProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="font-medium text-brown">{label}</span>
        <span className="text-right text-muted">{message}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-lavender/30"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-label={label}
      >
        {indeterminate ? (
          <div className="h-full w-1/3 animate-[upload-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-burgundy/85" />
        ) : (
          <div
            className="h-full rounded-full bg-burgundy transition-[width] duration-200 ease-out"
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
    </div>
  );
}
