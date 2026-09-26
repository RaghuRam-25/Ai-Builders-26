import {
  findGovernmentServiceContext,
  findGovernmentServices,
  getGovernmentServiceById,
} from "../types/government-search.js";
import type {
  GovernmentService,
  ServiceCategory,
  ServiceTranslation,
  Suggestion,
} from "../types/government-service.js";

import {
  Service,
  ServiceCategoryModel,
  SuggestionModel,
} from "../models/index.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";

/** Applies the English overrides, matching `getLocalizedService` in the original app. */
export function applyLanguage(
  service: GovernmentService,
  translations: Map<string, ServiceTranslation>,
  lang: "bn" | "en",
): GovernmentService {
  if (lang === "bn") return service;
  const translation = translations.get(service.id);
  if (!translation) return service;
  return {
    ...service,
    ...(translation.category ? { category: translation.category } : {}),
    ...(translation.title ? { title: translation.title } : {}),
    ...(translation.description ? { description: translation.description } : {}),
    ...(translation.eta ? { eta: translation.eta } : {}),
    ...(translation.documents ? { documents: translation.documents } : {}),
    ...(translation.steps ? { steps: translation.steps } : {}),
  };
}

export async function listServices(
  options: { search?: string; limit?: number; lang?: "bn" | "en" } = {},
): Promise<GovernmentService[]> {
  const { search = "", limit = 50, lang = "bn" } = options;
  // No projection here: an inclusive projection would silently drop every field
  // that is not listed, which previously emptied id/title on all six services.
  const docs = await Service.find({}).sort({ order: 1 }).lean();

  const translations = new Map<string, ServiceTranslation>();
  for (const doc of docs) {
    if (doc.translation) {
      translations.set(doc.id, { id: doc.id, ...doc.translation } as ServiceTranslation);
    }
  }

  const services = docs.map(
    (doc) =>
      ({
        id: doc.id,
        category: doc.category,
        title: doc.title,
        description: doc.description,
        eta: doc.eta,
        documents: doc.documents ?? [],
        steps: doc.steps ?? [],
        officialSource: doc.officialSource,
        accent: doc.accent,
        ...(doc.programs ? { programs: doc.programs as never } : {}),
        ...(doc.options ? { options: doc.options as never } : {}),
      }) as GovernmentService,
  );

  const filtered = search.trim()
    ? findGovernmentServices(services, search, limit)
    : services.slice(0, limit);

  return filtered.map((service) => applyLanguage(service, translations, lang));
}

export async function getServiceById(
  id: string,
  lang: "bn" | "en" = "bn",
): Promise<GovernmentService> {
  const doc = await Service.findOne({ id }).lean();
  if (!doc) throw ApiError.notFound(`Government service "${id}" was not found`);

  const service = {
    id: doc.id,
    category: doc.category,
    title: doc.title,
    description: doc.description,
    eta: doc.eta,
    documents: doc.documents ?? [],
    steps: doc.steps ?? [],
    officialSource: doc.officialSource,
    accent: doc.accent,
    ...(doc.programs ? { programs: doc.programs as never } : {}),
    ...(doc.options ? { options: doc.options as never } : {}),
  } as GovernmentService;

  const translations = doc.translation
    ? new Map<string, ServiceTranslation>([
        [doc.id, { id: doc.id, ...doc.translation } as ServiceTranslation],
      ])
    : new Map<string, ServiceTranslation>();

  return applyLanguage(service, translations, lang);
}

export async function searchServices(
  query: string,
  limit: number,
  lang: "bn" | "en" = "bn",
): Promise<GovernmentService[]> {
  // Search over the Bengali source text (as the original did), then localize
  // the results for the requested language.
  const services = await listServices({ limit: 50, lang });
  return findGovernmentServices(services, query, limit);
}

export async function resolveContext(
  query: string,
  lang: "bn" | "en" = "bn",
) {
  const services = await listServices({ limit: 50, lang });
  const context = findGovernmentServiceContext(services, query);
  if (!context) return null;
  return {
    service: context.service,
    ...(context.optionId ? { optionId: context.optionId } : {}),
    ...(context.programId ? { programId: context.programId } : {}),
  };
}

export async function listCategories(
  lang: "bn" | "en" = "bn",
): Promise<ServiceCategory[]> {
  const docs = await ServiceCategoryModel.find({}).sort({ order: 1 }).lean();
  if (docs.length) {
    return docs.map((doc) => ({
      id: doc.id,
      label: lang === "en" ? doc.labelEn : doc.label,
      labelEn: doc.labelEn,
      icon: doc.icon,
    }));
  }
  // Database not seeded yet — fall back to the bundled defaults so the Home
  // screen never renders an empty category rail.
  logger.warn("Service categories collection is empty, using bundled defaults");
  const { serviceCategoriesSeed } = await import("../data/service-catalog.seed.js");
  return serviceCategoriesSeed.map((item) => ({
    id: item.id,
    label: lang === "en" ? item.labelEn : item.label,
    labelEn: item.labelEn,
    icon: item.icon,
  }));
}

export async function listSuggestions(
  lang: "bn" | "en" = "bn",
): Promise<Suggestion[]> {
  const docs = await SuggestionModel.find({}).sort({ order: 1 }).lean();
  if (docs.length) {
    return docs.map((doc) => ({
      id: doc.id,
      label: lang === "en" ? doc.labelEn : doc.label,
      labelEn: doc.labelEn,
    }));
  }
  const { suggestionsSeed } = await import("../data/service-catalog.seed.js");
  return suggestionsSeed.map((item) => ({
    id: item.id,
    label: lang === "en" ? item.labelEn : item.label,
    labelEn: item.labelEn,
  }));
}

export { findGovernmentServices, getGovernmentServiceById };
