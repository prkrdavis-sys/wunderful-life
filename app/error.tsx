"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium tracking-wide text-brown/70 uppercase">
        Saved content
      </p>
      <h1 className="mt-2 font-display text-3xl text-brown">
        This page could not load her saved site
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink">
        The live database did not respond, so nothing placeholder was shown.
        Refresh in a moment. Her uploads stay in Supabase until the connection
        comes back.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 self-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-paper"
      >
        Try again
      </button>
    </div>
  );
}
