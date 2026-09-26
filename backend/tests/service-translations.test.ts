/**
 * Bilingual service guidance.
 *
 * Ported from the original `tests/service-translations.test.ts`, which exercised
 * `getLocalizedService` in `shared/service-translations.ts`. That module moved
 * into `backend/src/services/government.service.ts` as `applyLanguage`, so the
 * assertions are preserved against the new home of the same logic.
 */
import { describe, expect, it } from "vitest";

import type { ServiceTranslation } from "../src/types/government-service.js";

import { governmentServices } from "../src/data/government-services.seed.js";
import { serviceTranslationsSeed } from "../src/data/service-translations.seed.js";
import { applyLanguage } from "../src/services/government.service.js";

const translations = new Map<string, ServiceTranslation>(
  serviceTranslationsSeed.map((translation) => [translation.id, translation]),
);

/**
 * The shipped Bengali seed is stored in Unicode decomposed form (U+09DF U+09BC
 * for "য়"), while editors commonly produce the precomposed form. Compare
 * normalized so the assertion tests the value, not the encoding form.
 */
const nfc = (value: string): string => value.normalize("NFC");

describe("Janasheba bilingual service guidance", () => {
  it("returns English titles and guidance without changing the Bengali source", () => {
    const nid = governmentServices.find((service) => service.id === "nid");
    expect(nid).toBeDefined();
    if (!nid) return;

    const english = applyLanguage(nid, translations, "en");
    expect(english.title).toBe("National ID correction");
    expect(english.documents[0]).toBe("Current NID copy");
    // Localization must not mutate the Bengali source object.
    expect(nfc(nid.title)).toBe(nfc("জাতীয় পরিচয়পত্র সংশোধন"));
  });

  it("keeps every service usable in both languages", () => {
    for (const service of governmentServices) {
      const english = applyLanguage(service, translations, "en");
      expect(english.title).toBeTruthy();
      expect(english.documents.length).toBe(service.documents.length);
      expect(english.steps.length).toBe(service.steps.length);

      // Asking for Bengali must return the untouched original.
      const bengali = applyLanguage(service, translations, "bn");
      expect(bengali.title).toBe(service.title);
    }
  });

  it("ships an English translation for every seeded service", () => {
    for (const service of governmentServices) {
      expect(translations.has(service.id)).toBe(true);
    }
  });
});
