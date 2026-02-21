/**
 * Enriched Planet schema for app use.
 * Extends the auto-generated planetSchema, overriding
 * `climate` and `terrain` from comma-separated strings to string arrays.
 */

import * as v from "valibot";
import { planetSchema } from "$lib/swapi-schema/planetSchema";

export const planetViewSchema = v.omit(planetSchema, ["climate", "terrain"]);

export const planetViewFullSchema = v.object({
  ...planetViewSchema.entries,
  climate: v.array(v.string()),
  terrain: v.array(v.string()),
});

export type PlanetView = v.InferOutput<typeof planetViewFullSchema>;
