import { z } from "zod";

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(5),
    category: z.string().min(3),
    description: z.string().min(5).optional(),
    lat: z.number(),
    lng: z.number(),
    photoUrls: z.array(z.string().url()).optional()
  })
});

export const listIncidentsSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    category: z.string().optional(),
    near: z.string().optional(),  // "lat,lng"
    radiusKm: z.string().optional(),
    take: z.string().optional(),
    cursor: z.string().optional()
  })
});

export const changeStatusSchema = z.object({
  body: z.object({
    toStatus: z.enum(["REPORTED","TRIAGED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED","CLOSED"]),
    reason: z.string().min(3).optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});

export const confirmSchema = z.object({
  body: z.object({
    type: z.enum(["CONFIRM", "DISPUTE"])
  }),
  params: z.object({
    id: z.string().uuid()
  })
});
