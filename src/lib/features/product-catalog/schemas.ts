import { z } from "zod";

/** Path param: brand or model id (UUID). */
export const catalogUuidParamSchema = z.string().uuid("Invalid id");
