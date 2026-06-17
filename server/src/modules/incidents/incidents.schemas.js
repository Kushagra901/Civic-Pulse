import { z } from "zod";
import { sanitiseText, sanitiseRichText, sanitisePhotoUrls } from "../../utils/sanitise.js";

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().transform(val => sanitiseText(val)).refine(val => val.length >= 5, { message: "Title must be at least 5 characters after cleaning" }),
    category: z.string().transform(val => sanitiseText(val)).refine(val => val.length >= 3, { message: "Category must be at least 3 characters after cleaning" }),
    description: z.string().optional().transform(val => val ? sanitiseRichText(val) : undefined).refine(val => !val || val.length >= 5, { message: "Description must be at least 5 characters after cleaning" }),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    photoUrls: z.array(z.string().url()).max(5, 'Maximum 5 photos per report').default([]).transform((urls) => sanitisePhotoUrls(urls, process.env.CLOUDINARY_CLOUD_NAME))
  })
});

export const listIncidentsSchema = z.object({
  query: z.object({
    cursor: z.string().uuid().optional(),
    cursorDate: z.string().datetime().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    bbox: z.string().optional(),
    near: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20)
  })
});

export const getTimelineSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(15).optional()
  })
});

export const listIncidentsNearSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce.number().positive().optional(),
    status: z.string().optional(),
    category: z.string().optional()
  })
});

export const changeStatusSchema = z.object({
  body: z.object({
    toStatus: z.enum(["REPORTED", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFIED", "CLOSED"]),
    reason: z.string().min(3).optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

export const confirmSchema = z.object({
  body: z.object({
    type: z.enum(["CONFIRM", "DISPUTE"]),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180)
  }),
  params: z.object({
    id: z.string().uuid()
  })
});
