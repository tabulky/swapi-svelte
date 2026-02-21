<script lang="ts">
  import type { PlanetView } from "$lib/schemas/planetView";
  import { Table, type ColumnConfig } from "$lib/components/table";
  import { Tag } from "$lib/components/tag";
  import { getPlanets } from "./data.remote";

  const planets = $derived(await getPlanets());

  const columns: ColumnConfig<PlanetView>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "climate", label: "Climate", cell: tagCell },
    { key: "terrain", label: "Terrain", cell: tagCell },
    { key: "gravity", label: "Gravity", sortable: true },
    { key: "surface_water", label: "Surface Water", sortable: true, sortType: "numeric" },
    { key: "rotation_period", label: "Rotation Period", sortable: true, sortType: "numeric" },
    { key: "orbital_period", label: "Orbital Period", sortable: true, sortType: "numeric" },
    { key: "diameter", label: "Diameter", sortable: true, sortType: "numeric" },
    { key: "population", label: "Population", sortable: true, sortType: "numeric" },
    {
      key: "residents",
      label: "Residents",
      render: (val) => (val as string[]).length,
    },
    {
      key: "films",
      label: "Films",
      render: (val) => (val as string[]).length,
    },
  ];
</script>

<h1>Planets</h1>

<div class="toolbar">
  <button onclick={() => getPlanets().refresh()}>Refresh</button>
</div>

{#snippet tagCell({ value }: { value: unknown })}
  <div class="tag-list">
    {#each value as string[] as tag}
      <Tag>{tag}</Tag>
    {/each}
  </div>
{/snippet}

<svelte:boundary>
  <Table data={planets} {columns} rowKey="url" filterPlaceholder="Filter planets…" />

  {#snippet pending()}
    <p>Loading planets...</p>
  {/snippet}

  {#snippet failed(error)}
    <p>Error loading planets: {error instanceof Error ? error.message : error}</p>
  {/snippet}
</svelte:boundary>

<style>
  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
</style>
