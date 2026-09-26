"use client";

/**
 * Drop-in replacement for the slice of `expo-document-picker` the app uses.
 * On the web/Capacitor target this is a plain file input, but it keeps the same
 * `{ canceled, assets: [{ name, uri, size, mimeType }] }` shape so the screens
 * port verbatim.
 */

export type DocumentPickerAsset = {
  name: string;
  uri: string;
  size: number;
  mimeType: string;
};

export type DocumentPickerResult =
  | { canceled: true; assets: null }
  | { canceled: false; assets: DocumentPickerAsset[] };

export type DocumentPickerOptions = {
  type?: string | string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
};

const ACCEPT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  image: ["image/*"],
};

function toAccept(type: string | string[] | undefined): string | undefined {
  if (!type) return undefined;
  const kinds = Array.isArray(type) ? type : [type];
  const mimes = kinds.flatMap((kind) => {
    if (kind.includes("/")) return [kind];
    return ACCEPT[kind] ?? [];
  });
  return mimes.length ? mimes.join(",") : undefined;
}

export const DocumentPicker = {
  getDocumentAsync(options: DocumentPickerOptions = {}): Promise<DocumentPickerResult> {
    if (typeof document === "undefined") {
      return Promise.resolve({ canceled: true, assets: null });
    }

    return new Promise<DocumentPickerResult>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      const accept = toAccept(options.type);
      if (accept) input.accept = accept;
      input.multiple = Boolean(options.multiple);
      input.style.position = "fixed";
      input.style.left = "-9999px";
      input.setAttribute("aria-hidden", "true");

      let settled = false;
      const finish = (result: DocumentPickerResult) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("focus", onFocus);
        input.remove();
        resolve(result);
      };

      // The picker steals focus; regaining it without a change event means the
      // user dismissed the dialog.
      const onFocus = () => {
        window.setTimeout(() => {
          if (!input.files?.length) finish({ canceled: true, assets: null });
        }, 400);
      };

      input.addEventListener("change", () => {
        const files = Array.from(input.files ?? []);
        if (!files.length) {
          finish({ canceled: true, assets: null });
          return;
        }
        const assets = files.map((file) => ({
          name: file.name,
          uri: URL.createObjectURL(file),
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        }));
        finish({ canceled: false, assets: options.multiple ? assets : [assets[0]] });
      });

      input.addEventListener("cancel", () => finish({ canceled: true, assets: null }));

      document.body.appendChild(input);
      window.addEventListener("focus", onFocus);
      input.click();
    });
  },
};
