import type { Snippet } from "svelte";

export interface ColumnConfig<T> {
  /** Property key on the row object */
  key: keyof T & string;
  /** Display label for the column header */
  label: string;
  /** Whether the column is visible (default: true) */
  visible?: boolean;
  /** Whether the column is sortable (default: false) */
  sortable?: boolean;
  /** Sort type: "text" for locale compare, "numeric" for number parsing (default: "text") */
  sortType?: "text" | "numeric";
  /** Optional render function — receives the cell value and the full row, returns display value */
  render?: (value: T[keyof T & string], row: T) => string | number;
  /** Optional Snippet for custom HTML cell rendering — takes priority over `render` */
  cell?: Snippet<[{ value: T[keyof T & string]; row: T }]>;
}
