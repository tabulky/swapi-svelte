<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<span class="tag">{@render children()}</span>

<style>
  .tag {
    display: inline-block;
    padding: 0 0.5rem;
    /* margin: 0; */
    border-radius: 1rex 1rex;
    border: 1px solid rgba(0, 0, 0, 0.2);
    white-space: nowrap;
  }
</style>
