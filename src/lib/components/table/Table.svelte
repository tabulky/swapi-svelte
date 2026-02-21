<script lang="ts" generics="T extends Record<string, unknown>">
  import type { ColumnConfig } from "./types";

  interface Props {
    data: T[];
    columns: ColumnConfig<T>[];
    rowKey: keyof T & string;
    filterPlaceholder?: string;
  }

  let {
    data,
    columns: columnConfig,
    rowKey,
    filterPlaceholder = "Filter…",
  }: Props = $props();

  // --- Internal column state (adds runtime `visible` tracking) ---

  interface InternalColumn {
    key: keyof T & string;
    label: string;
    visible: boolean;
    sortable: boolean;
    sortType: "text" | "numeric";
    render?: (value: T[keyof T & string], row: T) => string | number;
  }

  function toInternal(configs: ColumnConfig<T>[]): InternalColumn[] {
    return configs.map((c) => ({
      key: c.key,
      label: c.label,
      visible: c.visible !== false,
      sortable: c.sortable ?? false,
      sortType: c.sortType ?? "text",
      render: c.render,
    }));
  }

  let columns = $state<InternalColumn[]>([]);

  // Initialize and re-sync columns when the config prop changes
  $effect.pre(() => {
    columns = toInternal(columnConfig);
  });

  const visibleColumns = $derived(columns.filter((c) => c.visible));
  const visibleCount = $derived(visibleColumns.length);

  // --- Column settings panel ---

  let showColumnSettings = $state(false);

  // --- Sorting ---

  let sortKey = $state<(keyof T & string) | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");

  function toggleSort(key: keyof T & string) {
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
  }

  function sortIndicator(key: keyof T & string): string {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function sortedData(rows: T[]): T[] {
    if (!sortKey) return rows;
    const key = sortKey;
    const dir = sortDirection === "asc" ? 1 : -1;
    const col = columns.find((c) => c.key === key);
    const isNumeric = col?.sortType === "numeric";

    return [...rows].sort((a, b) => {
      const aVal = cellValue(a, key);
      const bVal = cellValue(b, key);

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

  // --- Filtering ---

  let filterText = $state("");

  function filteredData(rows: T[]): T[] {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      visibleColumns.some((col) => {
        const val = String(cellValue(row, col.key)).toLowerCase();
        return val.includes(q);
      }),
    );
  }

  // --- Cell value rendering ---

  function cellValue(row: T, key: keyof T & string): string | number {
    const col = columns.find((c) => c.key === key);
    if (col?.render) {
      return col.render(row[key] as T[keyof T & string], row);
    }
    return String(row[key]);
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

  // --- Processed rows ---

  const processedRows = $derived(sortedData(filteredData(data)));
</script>

<div class="table-toolbar">
  <button onclick={() => (showColumnSettings = !showColumnSettings)}>
    {showColumnSettings ? "Hide" : "Show"} Column Settings
  </button>
  <input
    type="text"
    class="table-filter-input"
    placeholder={filterPlaceholder}
    bind:value={filterText}
  />
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

<table>
  <thead>
    <tr>
      {#each visibleColumns as col, i (col.key)}
        <th
          class:sortable={col.sortable}
          draggable="true"
          ondragstart={() => onDragStart(i, "header")}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={(e) => onDropHeader(e, i)}
          ondragend={onDragEnd}
          class:drag-over={dragOverIndex === i && dragContext === "header"}
          onclick={() => col.sortable && toggleSort(col.key)}
        >
          {col.label}{sortIndicator(col.key)}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody bind:this={tbodyEl}>
    {#each processedRows as row (row[rowKey])}
      <tr>
        {#each visibleColumns as col (col.key)}
          <td>{cellValue(row, col.key)}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .table-toolbar {
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

  .table-filter-input {
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
