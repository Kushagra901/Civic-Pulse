import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as c from "./incidents.controller.js";
import { getHeatmapData } from "./heatmap.controller.js";
import { searchIncidents } from "./search.controller.js";
import { createIncidentSchema, listIncidentsSchema, listIncidentsNearSchema, changeStatusSchema, confirmSchema, getTimelineSchema } from "./incidents.schemas.js";

export const incidentsRouter = Router();

incidentsRouter.get("/", validate(listIncidentsSchema), c.listIncidents);
incidentsRouter.get("/near", validate(listIncidentsNearSchema), c.listIncidentsNear);
incidentsRouter.get("/heatmap", getHeatmapData);
incidentsRouter.get("/search", searchIncidents);
incidentsRouter.get("/:id/timeline", validate(getTimelineSchema), c.getTimeline);
incidentsRouter.get("/:id", c.getIncident);

incidentsRouter.post("/", requireAuth, validate(createIncidentSchema), c.createIncident);

incidentsRouter.post("/:id/confirm", requireAuth, validate(confirmSchema), c.confirm);

// status changes should be restricted
incidentsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("MODERATOR", "ADMIN", "WORKER_TEAM"),
  validate(changeStatusSchema),
  c.changeStatus
);

