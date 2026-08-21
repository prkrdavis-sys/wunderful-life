/** File-name helpers shared by video, photo, and storage paths. */

export function extensionFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  const ext = filename.slice(dotIndex).toLowerCase();
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return "";
  return ext;
}

/** Last path segment of a local path or remote URL, for upload-button labels. */
export function assetDisplayName(path: string): string {
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const segment = new URL(path).pathname.split("/").pop();
      return segment || path;
    }
  } catch {
    // fall through
  }
  return path.split("/").pop() || path;
}
