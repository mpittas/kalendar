/**
 * A small, dependency-free markdown renderer for quick notes.
 * All source text is HTML-escaped before any markup is added, and links are limited to
 * http(s) and mailto, so the output is safe to use with v-html.
 */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderInline(raw: string): string {
  const codes: string[] = [];
  let text = escapeHtml(raw).replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  const link = (label: string, url: string) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;

  text = text
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, (_, label: string, url: string) => link(label, url))
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead: string, url: string) => `${lead}${link(url, url)}`)
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a: string, b: string) => `<strong>${a ?? b}</strong>`)
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, (_, lead: string, body: string) => `${lead}<em>${body}</em>`)
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?![_\w])/g, (_, lead: string, body: string) => `${lead}<em>${body}</em>`)
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return text.replace(/\u0000(\d+)\u0000/g, (_, index: string) => codes[Number(index)]);
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TASK = /^\[([ xX])\]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      flushParagraph();
      const code: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      html.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`);
      continue;
    }

    if (RULE.test(line)) {
      flushParagraph();
      html.push("<hr>");
      continue;
    }

    if (QUOTE.test(line)) {
      flushParagraph();
      const quoted: string[] = [];
      for (; i < lines.length && QUOTE.test(lines[i]); i++) quoted.push(QUOTE.exec(lines[i])![1]);
      i--;
      html.push(`<blockquote>${quoted.map(renderInline).join("<br>")}</blockquote>`);
      continue;
    }

    if (LIST_ITEM.test(line)) {
      flushParagraph();
      const ordered = /\d/.test(LIST_ITEM.exec(line)![2]);
      const items: string[] = [];
      const sameKind = (l: string) => LIST_ITEM.test(l) && /\d/.test(LIST_ITEM.exec(l)![2]) === ordered;
      for (; i < lines.length && sameKind(lines[i]); i++) {
        const [, indent, , content] = LIST_ITEM.exec(lines[i])!;
        const depth = Math.min(3, Math.floor(indent.replace(/\t/g, "  ").length / 2));
        const task = TASK.exec(content);
        const style = depth ? ` style="margin-left:${depth * 1.25}rem"` : "";
        items.push(
          task
            ? `<li class="task${task[1] === " " ? "" : " done"}"${style}><input type="checkbox" data-line="${i}"${task[1] === " " ? "" : " checked"}><span>${renderInline(task[2])}</span></li>`
            : `<li${style}>${renderInline(content)}</li>`,
        );
      }
      i--;
      html.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();
  return html.join("");
}

/** Flip the `[ ]` / `[x]` checkbox on one source line; returns the source unchanged if there isn't one. */
export function toggleTaskLine(source: string, lineIndex: number): string {
  const lines = source.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return source;
  lines[lineIndex] = line.replace(/\[([ xX])\]/, (_, mark: string) => (mark === " " ? "[x]" : "[ ]"));
  return lines.join("\n");
}
