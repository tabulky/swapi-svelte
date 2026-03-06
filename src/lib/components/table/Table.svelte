<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type ColumnType = "text" | "numeric";

  export interface ColumnConfig<
    TRow extends Record<string, unknown>,
    TKey extends keyof TRow & string = keyof TRow & string,
  > {
    /** Property key on the row object */
    key: TKey;
    /** Display label for the column header */
    label: string;
    /** Value type for the column */
    type?: ColumnType;
    /** Whether the column is visible (default: true) */
    visible?: boolean;
    /** Whether the column is sortable (default: false) */
    sortable?: boolean;
    /** Cell alignment (default: left) */
    align?: "left" | "center" | "right";
    /** Optional Snippet for custom HTML cell rendering */
    cell?: Snippet<[{ value: TRow[TKey]; row: TRow }]>;
  }

  const defaultColumnConfigByType: Record<
    ColumnType,
    Partial<ColumnConfig<Record<string, unknown>>>
  > = {
    text: {
      sortable: true,
      align: "left",
    },
    numeric: {
      sortable: true,
      align: "right",
    },
  };

  export function schemaColumn<TRow extends Record<string, unknown>>() {
    return <TKey extends keyof TRow & string>(
      key: TKey,
      config: Omit<ColumnConfig<TRow, TKey>, "key">,
    ): ColumnConfig<TRow> => {
      return {
        // default values
        visible: true,

        // by type default values
        ...(config.type ? defaultColumnConfigByType[config.type] : {}),

        // all can be overriden by config
        ...config,

        // key cannot be overridden
        key,
      } as ColumnConfig<TRow>;
    };
  }
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
  import { highlight } from "$lib/attachments/highlight";

  type Props = {
    data: T[];
    columns: ColumnConfig<T>[];
    rowKey: keyof T & string;
    filterPlaceholder?: string;
  };

  let { data, columns = $bindable(), rowKey, filterPlaceholder = "…" }: Props = $props();

  const columnByKey = $derived.by(() => {
    const map: Record<string, ColumnConfig<T>> = {};
    for (const col of columns) {
      map[col.key] = col;
    }
    return map;
  });

  const visibleColumns = $derived(columns.filter((c) => c.visible));

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

  function sortData(rows: T[]): T[] {
    if (!sortKey) return rows;
    const dir = sortDirection === "asc" ? 1 : -1;
    const col = columnByKey[sortKey!];
    const isNumeric = col?.type === "numeric";

    return rows.toSorted((a, b) => {
      const aVal = a[sortKey!];
      const bVal = b[sortKey!];

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

  function filterData(rows: T[]): T[] {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      visibleColumns.some((col) => {
        const val = String(row[col.key]).toLowerCase();
        return val.includes(q);
      }),
    );
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

  // --- Processed rows ---

  const processedRows = $derived(sortData(filterData(data)));
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
          class={[
            "px-1",
            {
              "text-left": col.align === "left",
              "text-right": col.align === "right",
              "text-center": col.align === "center",
              "drag-over": dragOverIndex === i && dragContext === "header",
              sortable: col.sortable,
            },
          ]}
          onclick={() => col.sortable && toggleSort(col.key)}
          draggable="true"
          ondragstart={() => onDragStart(i, "header")}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={(e) => onDropHeader(e, i)}
          ondragend={onDragEnd}
        >
          {col.label}{sortIndicator(col.key)}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody {@attach highlight(filterText, "search-match")}>
    {#each processedRows as row (row[rowKey])}
      <tr>
        {#each visibleColumns as col (col.key)}
          <td
            class={[
              "px-1",
              {
                "text-left": col.align === "left",
                "text-right": col.align === "right",
                "text-center": col.align === "center",
              },
            ]}
          >
            {#if col.cell}
              {@render col.cell({ value: row[col.key], row })}
            {:else}
              {row[col.key]}
            {/if}
          </td>
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

  thead {
    position: sticky;
    top: 0;
    background-color: rgba(255, 255, 255, 0.9);
  }

  th {
    text-align: left;
    border-bottom: 1px solid #555;
    user-select: none;
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

  ::highlight(search-match) {
    background-color: #fbbf24;
    color: #000;
  }
</style>
