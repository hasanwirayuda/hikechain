import { z } from "zod";

export const LocationBatchSchema = z.object({
  locations: z
    .array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy_meters: z.number().optional(),
        recorded_at: z.string().datetime(),
      }),
    )
    .min(1),
});

export type LocationBatchDto = z.infer<typeof LocationBatchSchema>;
