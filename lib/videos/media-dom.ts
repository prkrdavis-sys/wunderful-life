export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function waitForVideoEvent(
  video: HTMLVideoElement,
  event: "loadedmetadata" | "loadeddata" | "seeked" | "ended",
  errorMessage = "Could not load this video.",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(errorMessage));
    };
    const cleanup = () => {
      video.removeEventListener(event, onSuccess);
      video.removeEventListener("error", onError);
    };
    if (event === "loadedmetadata" && video.readyState >= 1) {
      resolve();
      return;
    }
    if (event === "loadeddata" && video.readyState >= 2) {
      resolve();
      return;
    }
    video.addEventListener(event, onSuccess);
    video.addEventListener("error", onError);
  });
}
