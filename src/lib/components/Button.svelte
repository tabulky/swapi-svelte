<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  let { children, ...rest }: HTMLButtonAttributes = $props();
</script>

<button class="rounded bg-blue-500 px-2 py-1 font-bold text-white hover:bg-blue-600" {...rest}>
  {@render children?.()}
</button>
