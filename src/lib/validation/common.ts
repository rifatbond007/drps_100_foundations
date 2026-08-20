/**
 * Common Zod schemas.
 */
import { z } from 'zod';

export const cuidSchema = z.string().cuid();
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
