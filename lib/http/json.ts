export type JsonPayloadKind = "video" | "photo" | "generic";

const PAYLOAD_TOO_LARGE: Record<JsonPayloadKind, string> = {
  video:
    "That file is too large for a direct upload. Compress it or try a shorter clip.",
  photo:
    "That photo is too large for a direct upload. Try a smaller JPEG and save again.",
  generic:
    "That file is too large for a direct upload. Try a smaller file and save again.",
};

/**
 * Parse a JSON body after `response.text()`, so HTML error pages (413, 5xx)
 * become a useful message instead of a raw SyntaxError.
 */
export async function readResponseJson<T>(
  response: Response,
  options?: { payload?: JsonPayloadKind },
): Promise<T> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (response.status === 413) {
      throw new Error(PAYLOAD_TOO_LARGE[options?.payload ?? "generic"]);
    }
    throw new Error(
      response.ok
        ? "The server returned an unexpected response."
        : `Upload failed (${response.status}). Please try again.`,
    );
  }
}
