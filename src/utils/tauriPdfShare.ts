import { canShare, share } from "@vnidrop/tauri-plugin-share";

export const sharePdfInTauri = async (
  pdf: Blob,
  fileName: string,
  title: string,
): Promise<void> => {
  const supported = await canShare();

  if (!supported) {
    throw new Error("Native sharing is not supported.");
  }

  const pdfFile = new File([pdf], fileName, {
    type: "application/pdf",
  });

  await share({
    title,
    text: title,
    files: [pdfFile],
  });
};
