import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { chatRouter } from "./chat.routes.js";
import { governmentRouter } from "./government.routes.js";
import { documentRouter, notificationRouter } from "./notification.routes.js";
import { profileRouter } from "./profile.routes.js";
import { ok } from "../utils/response.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) =>
  ok(res, { status: "ok", service: "janasheba-api" }),
);

apiRouter.use("/auth", authRouter);
apiRouter.use("/government", governmentRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/documents", documentRouter);
