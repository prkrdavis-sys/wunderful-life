import type { MediaUploadDir } from "./media-upload";

type SignedUploadResponse = {
  uploadUrl?: string;
  publicUrl?: string;
  error?: string;
};

export async function uploadMediaToStorage(
  file: File,
  dir: MediaUploadDir,
  handleUploadUrl: string,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  const response = await fetch(handleUploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dir, filename: file.name }),
  });

  const payload = (await readJson(response)) as SignedUploadResponse;
  if (!response.ok || !payload.uploadUrl || !payload.publicUrl) {
    throw new Error(payload.error ?? "Could not start upload.");
  }

  await putToSignedUrl(payload.uploadUrl, file, onProgress);
  return payload.publicUrl;
}

async function readJson(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unexpected response."
        : `Upload failed (${response.status}). Please try again.`,
    );
  }
}

function putToSignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "31536000");
    body.append("", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error("Upload failed. Please try again."));
    };
    xhr.onerror = () =>
      reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    xhr.send(body);
  });
}
