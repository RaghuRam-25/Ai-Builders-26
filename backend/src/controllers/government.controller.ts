import type { Request, Response } from "express";

import { ok } from "../utils/response.js";
import * as governmentService from "../services/government.service.js";

type Lang = "bn" | "en";

export async function listServices(req: Request, res: Response) {
  const { search, limit, lang } = req.query as unknown as {
    search: string;
    limit: number;
    lang: Lang;
  };
  const services = await governmentService.listServices({ search, limit, lang });
  return ok(res, { services });
}

export async function getService(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: string };
  const { lang = "bn" } = req.query as unknown as { lang?: Lang };
  const service = await governmentService.getServiceById(id, lang);
  return ok(res, { service });
}

export async function searchServices(req: Request, res: Response) {
  const { query, limit, lang } = req.query as unknown as {
    query: string;
    limit: number;
    lang: Lang;
  };
  const results = await governmentService.searchServices(query, limit, lang);
  return ok(res, { results });
}

export async function resolveContext(req: Request, res: Response) {
  const { query, lang } = req.query as unknown as { query: string; lang: Lang };
  const context = await governmentService.resolveContext(query, lang);
  return ok(res, { context });
}

export async function listCategories(req: Request, res: Response) {
  const { lang = "bn" } = req.query as unknown as { lang?: Lang };
  const categories = await governmentService.listCategories(lang);
  return ok(res, { categories });
}

export async function listSuggestions(req: Request, res: Response) {
  const { lang = "bn" } = req.query as unknown as { lang?: Lang };
  const suggestions = await governmentService.listSuggestions(lang);
  return ok(res, { suggestions });
}
