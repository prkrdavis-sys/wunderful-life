import { readResponseJson } from "@/lib/http/json";
import type { SignedMediaUpload } from "./media-host";
import type { MediaUploadDir } from "./media-upload";

type SignedUploadResponse = Partial<SignedMediaUpload> & { error?: string };

export async function uploadMediaToStorage(
  file: File,
  dir: MediaUploadDir,
  handleUploadUrl: string,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  const response = await fetch(handleUploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dir, filename: file.name, contentType: file.type }),
  });

  const payload = await readResponseJson<SignedUploadResponse>(response);
  if (!response.ok || !payload.uploadUrl || !payload.publicUrl) {
    throw new Error(payload.error ?? "Could not start upload.");
  }

  // R2 presigned PUTs take the raw bytes; Supabase expects a multipart form.
  const body: XMLHttpRequestBodyInit =
    payload.mode === "raw-put" ? file : supabaseFormBody(file);

  await putToSignedUrl(payload.uploadUrl, body, payload.headers, onProgress);
  return payload.publicUrl;
}

function supabaseFormBody(file: File): FormData {
  const body = new FormData();
  body.append("cacheControl", "31536000");
  body.append("", file);
  return body;
}

function putToSignedUrl(
  uploadUrl: string,
  body: XMLHttpRequestBodyInit,
  headers?: Record<string, string>,
  onProgress?: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    for (const [name, value] of Object.entries(headers ?? {})) {
      xhr.setRequestHeader(name, value);
    }
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
