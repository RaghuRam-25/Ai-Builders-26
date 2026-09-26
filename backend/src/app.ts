import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { errorHandler, notFoundHandler } from "./utils/api-error.js";

export function createApp(): Application {
  const app = express();

  // Behind a reverse proxy so `req.ip` and rate limiting see the real client.
  if (env.TRUST_PROXY) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API only serves JSON, but relaxing this keeps Capacitor WebViews
      // and the static export from tripping over CORP on asset requests.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use("/api/v1", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler as (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void);

  return app;
}
