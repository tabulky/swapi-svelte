<script lang="ts">
  import type { Planet } from "$lib/swapi-schema/planetSchema";
  import { getPlanets } from "./data.remote";

  const planets = $derived(await getPlanets());

  type SortKey = keyof Planet;
  type SortDirection = "asc" | "desc";

  interface Column {
    key: SortKey;
    label: string;
    visible: boolean;
  }

  let sortKey = $state<SortKey | null>(null);
  let sortDirection = $state<SortDirection>("asc");
  let showColumnSettings = $state(false);
  let filterText = $state("");

  let columns = $state<Column[]>([
    { key: "name", label: "Name", visible: true },
    { key: "climate", label: "Climate", visible: true },
    { key: "terrain", label: "Terrain", visible: true },
    { key: "gravity", label: "Gravity", visible: true },
    { key: "surface_water", label: "Surface Water", visible: true },
    { key: "rotation_period", label: "Rotation Period", visible: true },
    { key: "orbital_period", label: "Orbital Period", visible: true },
    { key: "diameter", label: "Diameter", visible: true },
    { key: "population", label: "Population", visible: true },
    { key: "residents", label: "Residents", visible: true },
    { key: "films", label: "Films", visible: true },
  ]);

  const visibleColumns = $derived(columns.filter((c) => c.visible));
  const visibleCount = $derived(visibleColumns.length);

  const textColumns = new Set<SortKey>(["name", "climate", "terrain", "gravity"]);
  const numericColumns = new Set<SortKey>([
    "diameter",
    "population",
    "rotation_period",
    "orbital_period",
    "surface_water",
  ]);
  const sortableColumns = new Set<SortKey>([...textColumns, ...numericColumns]);

  // --- Sorting ---

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function sortPlanets(planets: Planet[]): Planet[] {
    if (!sortKey) return planets;
    const key = sortKey;
    const dir = sortDirection === "asc" ? 1 : -1;
    const isNumeric = numericColumns.has(key);

    return [...planets].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (isNumeric) {
        const aStr = String(aVal).replace(/,/g, "");
        const bStr = String(bVal).replace(/,/g, "");
        const aNum = Number(aStr);
        const bNum = Number(bStr);
        const aIsNum = !isNaN(aNum);
        const bIsNum = !isNaN(bNum);
        if (aIsNum && bIsNum) return (aNum - bNum) * dir;
        if (aIsNum) return -1 * dir;
        if (bIsNum) return 1 * dir;
        return String(aVal).localeCompare(String(bVal)) * dir;
      }

      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }

  // --- Drag & drop reordering ---

  let dragIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let dragContext = $state<"header" | "settings" | null>(null);

  function onDragStart(index: number, context: "header" | "settings") {
    dragIndex = index;
    dragContext = context;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    dragOverIndex = index;
  }

  function onDropHeader(e: DragEvent, toVisibleIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragContext !== "header") return;

    const fromCol = visibleColumns[dragIndex];
    const toCol = visibleColumns[toVisibleIndex];
    const fromFull = columns.indexOf(fromCol);
    const toFull = columns.indexOf(toCol);

    if (fromFull !== -1 && toFull !== -1 && fromFull !== toFull) {
      const moved = columns.splice(fromFull, 1)[0];
      columns.splice(toFull > fromFull ? toFull - 1 : toFull, 0, moved);
      // Reassign to trigger reactivity (splice mutates in place)
      columns = [...columns];
    }

    dragIndex = null;
    dragOverIndex = null;
    dragContext = null;
  }

  function onDropSettings(e: DragEvent, toIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragContext !== "settings") return;

    if (dragIndex !== toIndex) {
      const moved = columns.splice(dragIndex, 1)[0];
      columns.splice(toIndex > dragIndex ? toIndex - 1 : toIndex, 0, moved);
      columns = [...columns];
    }

    dragIndex = null;
    dragOverIndex = null;
    dragContext = null;
  }

  function onDragEnd() {
    dragIndex = null;
    dragOverIndex = null;
    dragContext = null;
  }

  // --- Filtering ---

  function filterPlanets(planets: Planet[]): Planet[] {
    const q = filterText.trim().toLowerCase();
    if (!q) return planets;
    return planets.filter((planet) =>
      visibleColumns.some((col) => {
        const val = String(cellValue(planet, col.key)).toLowerCase();
        return val.includes(q);
      }),
    );
  }

  // --- Cell value rendering ---

  function cellValue(planet: Planet, key: SortKey): string | number {
    if (key === "residents") return planet.residents.length;
    if (key === "films") return planet.films.length;
    return String(planet[key]);
  }

  // --- Highlight API ---

  let tbodyEl = $state<HTMLTableSectionElement | null>(null);

  function getTextNodes(node: Node): Text[] {
    const texts: Text[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let current: Node | null;
    while ((current = walker.nextNode())) {
      texts.push(current as Text);
    }
    return texts;
  }

  $effect(() => {
    if (!CSS.highlights) return;

    const q = filterText.trim().toLowerCase();
    if (!q || !tbodyEl) {
      CSS.highlights.delete("filter-match");
      return;
    }

    const ranges: Range[] = [];
    for (const textNode of getTextNodes(tbodyEl)) {
      const text = textNode.textContent?.toLowerCase() ?? "";
      let start = 0;
      while (start < text.length) {
        const idx = text.indexOf(q, start);
        if (idx === -1) break;
        const range = new Range();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + q.length);
        ranges.push(range);
        start = idx + 1;
      }
    }

    if (ranges.length > 0) {
      CSS.highlights.set("filter-match", new Highlight(...ranges));
    } else {
      CSS.highlights.delete("filter-match");
    }

    return () => {
      CSS.highlights?.delete("filter-match");
    };
  });
</script>

<h1>Planets</h1>

<div class="toolbar">
  <button onclick={() => getPlanets().refresh()}>Refresh</button>
  <button onclick={() => (showColumnSettings = !showColumnSettings)}>
    {showColumnSettings ? "Hide" : "Show"} Column Settings
  </button>
  <input type="text" class="filter-input" placeholder="Filter planets…" bind:value={filterText} />
</div>

{#if showColumnSettings}
  <div class="column-settings">
    <span class="column-settings-title">Drag to reorder, toggle to show/hide:</span>
    <ul>
      {#each columns as col, i (col.key)}
        <li
          draggable="true"
          class:drag-over={dragOverIndex === i && dragContext === "settings"}
          ondragstart={() => onDragStart(i, "settings")}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={(e) => onDropSettings(e, i)}
          ondragend={onDragEnd}
        >
          <span class="drag-handle">⠿</span>
          <label>
            <input type="checkbox" bind:checked={col.visible} />
            {col.label}
          </label>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<svelte:boundary>
  <table>
    <thead>
      <tr>
        {#each visibleColumns as col, i (col.key)}
          <th
            class:sortable={sortableColumns.has(col.key)}
            draggable="true"
            ondragstart={() => onDragStart(i, "header")}
            ondragover={(e) => onDragOver(e, i)}
            ondrop={(e) => onDropHeader(e, i)}
            ondragend={onDragEnd}
            class:drag-over={dragOverIndex === i && dragContext === "header"}
            onclick={() => sortableColumns.has(col.key) && toggleSort(col.key)}
          >
            {col.label}{sortIndicator(col.key)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody bind:this={tbodyEl}>
      {#each sortPlanets(filterPlanets(planets)) as planet (planet.url)}
        <tr>
          {#each visibleColumns as col (col.key)}
            <td>{cellValue(planet, col.key)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

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

  .column-settings {
    border: 1px solid #555;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    max-width: 320px;
  }

  .column-settings-title {
    font-size: 0.85rem;
    color: #aaa;
  }

  .column-settings ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
  }

  .column-settings li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.4rem;
    border-radius: 4px;
    cursor: grab;
  }

  .column-settings li:active {
    cursor: grabbing;
  }

  .column-settings li.drag-over {
    border-top: 2px solid #6cf;
  }

  .drag-handle {
    color: #777;
    font-size: 1rem;
    line-height: 1;
  }

  .column-settings label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  th[draggable="true"] {
    cursor: grab;
  }

  th[draggable="true"]:active {
    cursor: grabbing;
  }

  th.drag-over {
    border-left: 2px solid #6cf;
  }

  .filter-input {
    padding: 0.35rem 0.5rem;
    border: 1px solid #555;
    border-radius: 4px;
    background: inherit;
    color: inherit;
    font-size: 0.9rem;
    min-width: 180px;
  }

  ::highlight(filter-match) {
    background-color: #fbbf24;
    color: #000;
  }
</style>
