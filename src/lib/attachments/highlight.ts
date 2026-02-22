import type { Attachment } from "svelte/attachments";

/**
 * Highlights occurrences of the text (trimmed, lowercased) within the element.
 *
 * @param highlightText The text to highlight.
 * @param cssHighlightsKey The key for the CSS highlights.
 * @returns An attachment function for Svelte.
 */
export const highlight = (highlightText: string, cssHighlightsKey = "search-match"): Attachment => {
  return (element) => {
    if (!CSS.highlights) return;
    if (!highlightText) return;

    const searchText = highlightText.trim().toLowerCase();

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const ranges: Range[] = [];
    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text)) {
      const text = textNode.textContent?.toLowerCase() ?? "";
      let start = 0;
      while (start < text.length) {
        const idx = text.indexOf(searchText, start);
        if (idx === -1) break;
        const range = new Range();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + searchText.length);
        ranges.push(range);
        start = idx + 1;
      }
    }

    if (!ranges.length) return;

    CSS.highlights.set(cssHighlightsKey, new Highlight(...ranges));
    return () => {
      CSS.highlights.delete(cssHighlightsKey);
    };
  };
};
