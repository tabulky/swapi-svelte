<script lang="ts">
  import type { PlanetView } from "$lib/schemas/planetView";
  import Table, { schemaColumn } from "$lib/components/table/Table.svelte";
  import Tag from "$lib/components/Tag.svelte";
  import { getPlanets } from "./data.remote";
  import Button from "$lib/components/Button.svelte";

  const planets = $derived(await getPlanets());

  const col = schemaColumn<PlanetView>();
  const columns = $state([
    col("name", { label: "Name", sortable: true }),
    col("climate", { label: "Climate", cell: tagCell }),
    col("terrain", { label: "Terrain", cell: tagCell }),
    col("gravity", { label: "Gravity", sortable: true }),
    col("surface_water", { label: "Surface Water", type: "numeric" }),
    col("rotation_period", { label: "Rotation Period", type: "numeric" }),
    col("orbital_period", { label: "Orbital Period", type: "numeric" }),
    col("diameter", { label: "Diameter", type: "numeric" }),
    col("population", { label: "Population", type: "numeric" }),
    col("residents", { label: "Residents", cell: refsCell, align: "center" }),
    col("films", { label: "Films", cell: refsCell, align: "center" }),
  ]);
</script>

{#snippet tagCell({ value }: { value: string[] })}
  {#each value as tag (tag)}
    <Tag>{tag}</Tag>
  {/each}
{/snippet}

{#snippet refsCell({ value }: { value: string[] })}
  {#if !value.length}–{:else}{value.length}{/if}
{/snippet}

<main class="m-2">
  <h1 class="my-4 text-2xl font-bold">Planets</h1>

  <div class="flex items-center gap-4">
    <Button onclick={() => getPlanets().refresh()}>⟳</Button>

    {#if $effect.pending()}
      <div>Loading planets...</div>
    {/if}
  </div>

  <svelte:boundary>
    <Table data={planets} {columns} rowKey="url" filterPlaceholder="Filter planets…" />

    {#snippet pending()}
      <p>Loading planets...</p>
    {/snippet}

    {#snippet failed(error)}
      <p>Error loading planets: {error instanceof Error ? error.message : error}</p>
    {/snippet}
  </svelte:boundary>
</main>
