type EditorPanelIconProps = {
  className?: string;
};

/** Overlapping panels — site page behind, editor floating in front. */
export function EditorPanelIcon({ className = "h-4 w-4" }: EditorPanelIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="7" width="12" height="13" rx="2" opacity="0.45" />
      <rect x="9" y="4" width="12" height="13" rx="2" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 8.5h6M12 11h4M12 13.5h5" />
    </svg>
  );
}
