export function renderRichText(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;u&gt;/g, "<u>")
    .replace(/&lt;\/u&gt;/g, "</u>")
    .replace(/&lt;span class="([^"]+)"&gt;/g, '<span class="$1">')
    .replace(/&lt;\/span&gt;/g, "</span>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='bg-gray-100 text-red-500 px-1.5 py-0.5 rounded text-[10px]'>$1</code>");
  return html;
}

export function wrapSelection(
  fullText: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = fullText.substring(start, end) || placeholder;
  const replacement = `${prefix}${selected}${suffix}`;
  const value = fullText.substring(0, start) + replacement + fullText.substring(end);
  const newStart = start + prefix.length;
  const newEnd = newStart + selected.length;
  return { value, selectionStart: newStart, selectionEnd: newEnd };
}
