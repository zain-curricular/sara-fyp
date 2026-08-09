import { uuid } from "@/lib/validation/uuid";

/** Path param: brand or model id (UUID). */
export const catalogUuidParamSchema = uuid("Invalid id");
