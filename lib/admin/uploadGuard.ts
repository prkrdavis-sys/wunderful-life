export const UPLOAD_IN_PROGRESS_MESSAGE =
  "A video upload is still in progress. Leave anyway? Your upload may not finish.";

export function confirmLeaveDuringUpload(isUploadBusy: boolean): boolean {
  if (!isUploadBusy) return true;
  return window.confirm(UPLOAD_IN_PROGRESS_MESSAGE);
}
