import type { ReactNode } from "react";

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
    <figure
      className={`testimonial-cloud${flip ? " testimonial-cloud-flip" : ""} ${className}`.trim()}
    >
      <div className="testimonial-cloud-body">{children}</div>
    </figure>
  );
}
