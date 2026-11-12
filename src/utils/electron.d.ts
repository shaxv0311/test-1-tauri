export {};

import type { PrintDocType } from "./type";

declare global {
  interface Window {
    electronAPI: {
      // printPage: () => Promise<boolean>;
      getPrinters: () => Promise<
        {
          name: string;
          displayName: string;
          description: string;
          status: number;
        }[]
      >;
      savePDF: (payload: {
        fileName: string;
        title?: string;
        data: any;
        format?: "a4" | "thermal";
        docType?: PrintDocType;
      }) => Promise<{ success: boolean; filePath?: string }>;
      printToPrinter: (
        printerName: string,
        payload: {
          title?: string;
          data: any;
          format?: "a4" | "thermal";
          docType?: PrintDocType;
        },
      ) => Promise<{ success: boolean; error?: string }>;
    };
  }
}