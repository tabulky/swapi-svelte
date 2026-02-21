import type { Planet } from "$lib/swapi-schema/planetSchema";

const fetchPlanets = async (fetch: typeof globalThis.fetch): Promise<Planet[]> => {
  const response = await fetch("https://swapi.info/api/planets/");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Planet[]>;
};

export const load = async ({ fetch, depends }) => {
  depends("data:planets");
  return {
    planets: fetchPlanets(fetch),
  };
};
