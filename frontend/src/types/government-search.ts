/**
 * Government service search + context resolution.
 *
 * Ported verbatim from the original `shared/government-services.ts` so the AI
 * assistant, the Home screen search and the backend all resolve identical
 * results. The original module bundled the data; here the data lives in MongoDB
 * and the caller passes the records in.
 */

import type {
  GovernmentService,
  GovernmentServiceContext,
} from "./government-service";

function haystackFor(service: GovernmentService): string {
  return [
    service.id,
    service.title,
    service.description,
    service.category,
    ...(service.programs ?? []).flatMap((program) => [
      program.title,
      program.department,
      program.summary,
    ]),
    ...(service.options ?? []).flatMap((option) => [
      option.title,
      option.description,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

export function supportedQueryTerms(services: GovernmentService[]): string[] {
  return services.flatMap((service) => [
    service.id,
    service.title,
    service.description,
    service.category,
    ...(service.programs ?? []).flatMap((program) => [
      program.title,
      program.department,
      program.summary,
    ]),
    ...(service.options ?? []).flatMap((option) => [
      option.title,
      option.description,
    ]),
  ]);
}

export function getGovernmentServiceById(
  services: GovernmentService[],
  id: string,
): GovernmentService | null {
  return services.find((service) => service.id === id) ?? null;
}

export function findGovernmentServices(
  services: GovernmentService[],
  query: string,
  limit = 5,
): GovernmentService[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return services.slice(0, limit);
  }

  const normalized = cleanQuery.toLowerCase();

  const matches = services.filter((service) =>
    haystackFor(service).includes(normalized),
  );

  if (matches.length > 0) {
    return matches.slice(0, limit);
  }

  const tokenized = normalized.split(/\s+/).filter(Boolean);
  if (tokenized.length === 0) {
    return services.slice(0, limit);
  }

  return services
    .map((service) => {
      const haystack = haystackFor(service);
      const score = tokenized.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );
      return { service, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service)
    .slice(0, limit);
}

export function findGovernmentServiceContext(
  services: GovernmentService[],
  query: string,
): GovernmentServiceContext | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const byId = (id: string) => getGovernmentServiceById(services, id);

  if (/জন্ম|birth/.test(normalized)) {
    const service = byId("birth");
    if (service) {
      return {
        service,
        optionId: /correction|সংশোধন|ঠিক/.test(normalized)
          ? "correction"
          : "new-registration",
      };
    }
  }
  if (/\bnid\b|জাতীয় পরিচয়|পরিচয়পত্র/.test(normalized)) {
    const service = byId("nid");
    if (service) {
      return {
        service,
        optionId: /correction|সংশোধন|ঠিক/.test(normalized)
          ? "correction"
          : "new-registration",
      };
    }
  }
  if (/passport|পাসপোর্ট/.test(normalized)) {
    const service = byId("passport");
    if (service) {
      return {
        service,
        optionId: /renew|reissue|নবায়ন|পুনরায়/.test(normalized)
          ? "renewal-reissue"
          : /correction|সংশোধন|তথ্য/.test(normalized)
            ? "information-correction"
            : "new-application",
      };
    }
  }

  for (const service of services) {
    const option = (service.options ?? []).find((item) => {
      const text = `${item.id} ${item.title} ${item.description}`.toLowerCase();
      return text
        .split(/\s+/)
        .some((token) => token.length > 2 && normalized.includes(token));
    });
    if (option) return { service, optionId: option.id };

    const program = (service.programs ?? []).find((item) => {
      const text = `${item.id} ${item.title} ${item.summary}`.toLowerCase();
      return (
        text
          .split(/\s+/)
          .some((token) => token.length > 2 && normalized.includes(token)) ||
        (item.id === "older-persons-allowance" &&
          /বয়স্ক|বয়স্ক|old age|elderly/.test(normalized)) ||
        (item.id === "disability-allowance" &&
          /প্রতিবন্ধী|disability/.test(normalized)) ||
        (item.id === "maternity-allowance" &&
          /মাতৃত্ব|maternity/.test(normalized)) ||
        (item.id === "child-support" && /শিশু|child/.test(normalized)) ||
        (item.id === "widow-allowance" && /বিধবা|widow/.test(normalized))
      );
    });
    if (program) return { service, programId: program.id };
  }

  const service = findGovernmentServices(services, normalized, 1)[0];
  return service ? { service } : null;
}
