import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export const downloadExcelInTauri = async (
  buffer: ArrayBuffer,
  fileName: string,
) => {
  const filePath = await save({
    defaultPath: fileName,
    filters: [
      {
        name: "Excel File",
        extensions: ["xlsx"],
      },
    ],
  });

  if (!filePath) {
    return false;
  }

  await writeFile(filePath, new Uint8Array(buffer));

  return true;
};

export const downloadPdfInTauri = async (
  pdf: Blob,
  fileName: string,
): Promise<boolean> => {
  const filePath = await save({
    defaultPath: fileName,
    filters: [
      {
        name: "PDF Document",
        extensions: ["pdf"],
      },
    ],
  });

  if (!filePath) return false;

  const buffer = await pdf.arrayBuffer();

  await writeFile(filePath, new Uint8Array(buffer));

  return true;
};
