import type { ReactNode } from "react";

/**
 * Puffy thought-cloud silhouette from EmojiOne 1F4AD (CC BY 4.0).
 * https://commons.wikimedia.org/wiki/File:Emojione_1F4AD.svg
 */
const CLOUD_PATH =
  "m62 22.7c0-2.7-1.3-5.1-3.2-6.6 0-.2 0-.4 0-.6 0-4.2-3.3-7.7-7.4-7.7-.3 0-.5 0-.8 0-1.6-2.7-4.4-4.6-7.7-4.6-2 0-3.8.6-5.2 1.7-1.9-1.7-4.5-2.9-7.3-2.9-4.6 0-8.5 3.1-9.8 7.4-1.5-1.1-3.4-1.7-5.4-1.7-5.3 0-9.6 4.4-9.6 9.8 0 1.6.4 3.1 1 4.5-2.8 2-4.6 5.3-4.6 9.1 0 6.2 4.9 11.2 10.9 11.2 2.2 0 4.3-.7 6-1.8.9 4.7 5 8.3 9.9 8.3 3.6 0 6.8-2 8.6-4.9 1.2 1.2 2.9 2 4.8 2 3.5 0 6.4-2.8 6.7-6.3.8.3 1.7.5 2.6.5 4.3 0 7.8-3.6 7.8-8 0-.9-.2-1.8-.4-2.6 1.8-1.7 3.1-4.1 3.1-6.8z";

type TestimonialCloudProps = {
  children: ReactNode;
  className?: string;
  /** Mirror the silhouette so paired quotes do not look stamped. */
  flip?: boolean;
};

export function TestimonialCloud({
  children,
  className = "",
  flip = false,
}: TestimonialCloudProps) {
  return (
    <figure className={`testimonial-cloud ${className}`.trim()}>
      <svg
        className={`testimonial-cloud-shape${flip ? " testimonial-cloud-shape-flip" : ""}`}
        viewBox="6 3 55 45"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={CLOUD_PATH} />
      </svg>
      <div className="testimonial-cloud-body">{children}</div>
    </figure>
  );
}
