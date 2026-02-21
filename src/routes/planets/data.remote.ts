import { query } from "$app/server";
import type { Planet } from "$lib/swapi-schema/planetSchema";
import type { PlanetView } from "$lib/schemas/planetView";

const RE_COMMA_SPACES_OPT = /,\s*/;

export const getPlanets = query(async (): Promise<PlanetView[]> => {
  const response = await fetch("https://swapi.info/api/planets/");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Planet[];

  return data.map((planet) => ({
    ...planet,
    climate: planet.climate.split(RE_COMMA_SPACES_OPT).map((c) => c.trim()),
    terrain: planet.terrain.split(RE_COMMA_SPACES_OPT).map((t) => t.trim()),
  }));
});
