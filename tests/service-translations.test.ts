import { describe, expect, it } from "vitest";

import { services } from "../shared/service-catalog";
import { getLocalizedService } from "../shared/service-translations";

describe("Janasheba bilingual service guidance", () => {
  it("returns English titles and guidance without changing the Bengali source", () => {
    const nid = services.find((service) => service.id === "nid");
    expect(nid).toBeDefined();
    if (!nid) return;

    const english = getLocalizedService(nid, true);
    expect(english.title).toBe("National ID correction");
    expect(english.documents[0]).toBe("Current NID copy");
    expect(nid.title).toBe("জাতীয় পরিচয়পত্র সংশোধন");
  });

  it("keeps every service usable in both languages", () => {
    for (const service of services) {
      const english = getLocalizedService(service, true);
      expect(english.title).toBeTruthy();
      expect(english.documents.length).toBe(service.documents.length);
      expect(english.steps.length).toBe(service.steps.length);
    }
  });
});
