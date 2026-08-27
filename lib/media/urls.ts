/** Public uploads and remote stills should hit their CDN, not `/_next/image`. */
export function isRemoteMediaUrl(src: string): boolean {
  return src.startsWith("https://") || src.startsWith("http://");
}
