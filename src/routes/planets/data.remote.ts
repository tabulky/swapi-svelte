import { query } from "$app/server";
import type { Planet } from "$lib/swapi-schema/planetSchema";

export const getPlanets = query(async () => {
  const response = await fetch("https://swapi.info/api/planets/");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Planet[];
});
