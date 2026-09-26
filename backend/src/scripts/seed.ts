/**
 * Idempotent seeding of the government service catalog, training programs, job
 * notices, Home-screen categories, starter suggestions and English overrides.
 *
 *   pnpm --filter @janasheba/backend db:seed
 *
 * Existing user data is never touched: the script only upserts the reference
 * documents by their stable string ids.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { logger } from "../utils/logger.js";
import {
  JobOpportunityModel,
  Service,
  ServiceCategoryModel,
  SuggestionModel,
  TrainingProgramModel,
} from "../models/index.js";
import { governmentServices } from "../data/government-services.seed.js";
import { serviceTranslationsSeed } from "../data/service-translations.seed.js";
import {
  categoryServiceIds,
  serviceCategoriesSeed,
  suggestionsSeed,
} from "../data/service-catalog.seed.js";
import { trainingProgramsSeed } from "../data/training-programs.seed.js";
import { jobOpportunitiesSeed } from "../data/job-opportunities.seed.js";

async function seed() {
  await connectDatabase();

  const translationsByServiceId = new Map(
    serviceTranslationsSeed.map((entry) => [entry.id, entry]),
  );

  // Mongoose's inferred update types cannot express nested subdocument arrays
  // (`options` / `programs`), so the operations are cast to the bulk-write
  // parameter type once instead of at every call site.
  type ServiceBulkOp = Parameters<typeof Service.bulkWrite>[0][number];

  const serviceOps = governmentServices.map((service, index) => {
    const { id, ...rest } = service;
    const translation = translationsByServiceId.get(id);

    return {
      updateOne: {
        filter: { id },
        update: {
          $set: {
            ...rest,
            ...(translation
              ? {
                  translation: {
                    ...(translation.category ? { category: translation.category } : {}),
                    ...(translation.title ? { title: translation.title } : {}),
                    ...(translation.description
                      ? { description: translation.description }
                      : {}),
                    ...(translation.eta ? { eta: translation.eta } : {}),
                    ...(translation.documents ? { documents: translation.documents } : {}),
                    ...(translation.steps ? { steps: translation.steps } : {}),
                  },
                }
              : {}),
            order: index,
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    } as ServiceBulkOp;
  });

  const serviceResult = await Service.bulkWrite(serviceOps);
  logger.info(
    `Services upserted: ${serviceResult.upsertedCount} new, ${serviceResult.modifiedCount} updated`,
  );

  await ServiceCategoryModel.bulkWrite(
    serviceCategoriesSeed.map((category, index) => {
      const { id, label, labelEn, icon } = category;
      return {
        updateOne: {
          filter: { id },
          update: {
            $set: {
              label,
              labelEn,
              icon,
              serviceIds: categoryServiceIds[id] ?? [],
              order: index,
            },
          },
          upsert: true,
        },
      };
    }),
  );
  logger.info(`Service categories upserted: ${serviceCategoriesSeed.length}`);

  await SuggestionModel.bulkWrite(
    suggestionsSeed.map((suggestion, index) => {
      const { id, label, labelEn } = suggestion;
      return {
        updateOne: {
          filter: { id },
          update: { $set: { label, labelEn, order: index } },
          upsert: true,
        },
      };
    }),
  );
  logger.info(`Suggestions upserted: ${suggestionsSeed.length}`);

  await TrainingProgramModel.bulkWrite(
    trainingProgramsSeed.map((program, index) => {
      const { id, ...rest } = program;
      return {
        updateOne: {
          filter: { id },
          update: { $set: { ...rest, order: index } },
          upsert: true,
        },
      };
    }),
  );
  logger.info(`Training programs upserted: ${trainingProgramsSeed.length}`);

  await JobOpportunityModel.bulkWrite(
    jobOpportunitiesSeed.map((job, index) => {
      const { id, ...rest } = job;
      return {
        updateOne: {
          filter: { id },
          update: { $set: { ...rest, order: index } },
          upsert: true,
        },
      };
    }),
  );
  logger.info(`Job opportunities upserted: ${jobOpportunitiesSeed.length}`);

  logger.info("Seed complete. User accounts and notifications were not modified.");
}

seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error("Seed failed", error);
    await disconnectDatabase();
    process.exit(1);
  });
