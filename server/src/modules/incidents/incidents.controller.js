import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./incidents.service.js";

export const createIncident = asyncHandler(async (req, res) => {
  const { title, category, description, lat, lng, photoUrls } = req.validated.body;
  const incident = await service.createOrAttachIncident({
    userId: req.user.id,
    title,
    category,
    description,
    lat,
    lng,
    photoUrls
  });
  res.status(201).json({ success: true, incident });
});

export const listIncidents = asyncHandler(async (req, res) => {
  const { status, category, take, cursor } = req.validated.query;
  const data = await service.listIncidents({ status, category, take, cursor });
  res.json({ success: true, ...data });
});

export const getIncident = asyncHandler(async (req, res) => {
  const incident = await service.getIncident(req.params.id);
  res.json({ success: true, incident });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { toStatus, reason } = req.validated.body;
  const updated = await service.changeStatus({
    id: req.params.id,
    actorId: req.user.id,
    toStatus,
    reason
  });
  res.json({ success: true, incident: updated });
});

export const confirm = asyncHandler(async (req, res) => {
  const { type } = req.validated.body;
  await service.confirmIncident({ id: req.params.id, userId: req.user.id, type });
  res.json({ success: true });
});
