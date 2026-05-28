export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, existing: string[]): string {
  let slug = slugify(base);
  if (!slug) slug = "video";

  if (!existing.includes(slug)) return slug;

  let counter = 2;
  while (existing.includes(`${slug}-${counter}`)) {
    counter += 1;
  }
  return `${slug}-${counter}`;
}
