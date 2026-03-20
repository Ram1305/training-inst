const COURSE_DESC_KV_LABELS = new Set(
  ['delivery', 'price', 'duration', 'location'].map((s) => s.toLowerCase())
);

function isCourseDescKvLabelLine(line: string): boolean {
  return COURSE_DESC_KV_LABELS.has(line.trim().toLowerCase());
}

/**
 * Converts simple markdown-style course description to safe HTML.
 * Supports: **bold**, *italic*, ## Heading 2, ### Heading 3, - bullets, 1. numbered list.
 * Consecutive "label / value" lines (Delivery, Price, Duration, Location) get CSS classes for blue styling on the course page.
 */
export function courseDescriptionToHtml(text: string): string {
  if (!text?.trim()) return '';

  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const applyInlineFormatting = (line: string) => {
    let out = escape(line);
    // Bold first (so ** doesn't get consumed by italic)
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    return out;
  };

  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let inList = false;
  let listTag = '';
  let expectKvValue = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimStart();
    const indent = raw.length - trimmed.length;

    // Heading 2: ## Text
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      if (inList) {
        result.push(listTag === 'ul' ? '</ul>' : '</ol>');
        inList = false;
      }
      expectKvValue = false;
      result.push('<h3 class="course-desc-h2">' + applyInlineFormatting(trimmed.slice(3)) + '</h3>');
      continue;
    }

    // Heading 3: ### Text
    if (trimmed.startsWith('### ')) {
      if (inList) {
        result.push(listTag === 'ul' ? '</ul>' : '</ol>');
        inList = false;
      }
      expectKvValue = false;
      result.push('<h4 class="course-desc-h3">' + applyInlineFormatting(trimmed.slice(4)) + '</h4>');
      continue;
    }

    // Unordered list: - item or * item (only at line start, with space after)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList || listTag !== 'ul') {
        if (inList) result.push(listTag === 'ul' ? '</ul>' : '</ol>');
        result.push('<ul class="course-desc-ul">');
        inList = true;
        listTag = 'ul';
      }
      expectKvValue = false;
      result.push('<li class="course-desc-li">' + applyInlineFormatting(bulletMatch[1]) + '</li>');
      continue;
    }

    // Ordered list: 1. 2. 3. (digit(s) + dot + space)
    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      if (!inList || listTag !== 'ol') {
        if (inList) result.push(listTag === 'ul' ? '</ul>' : '</ol>');
        result.push('<ol class="course-desc-ol">');
        inList = true;
        listTag = 'ol';
      }
      expectKvValue = false;
      result.push('<li class="course-desc-li">' + applyInlineFormatting(numMatch[1]) + '</li>');
      continue;
    }

    // Normal paragraph (or empty line)
    if (inList) {
      result.push(listTag === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
    if (trimmed === '') {
      result.push('<br />');
    } else if (isCourseDescKvLabelLine(trimmed)) {
      result.push(
        '<span class="course-desc-p course-desc-kv-label">' +
          applyInlineFormatting(trimmed) +
          '</span><br />'
      );
      expectKvValue = true;
    } else if (expectKvValue) {
      result.push(
        '<span class="course-desc-p course-desc-kv-value">' +
          applyInlineFormatting(trimmed) +
          '</span><br />'
      );
      expectKvValue = false;
    } else {
      result.push('<span class="course-desc-p">' + applyInlineFormatting(trimmed) + '</span><br />');
    }
  }

  if (inList) {
    result.push(listTag === 'ul' ? '</ul>' : '</ol>');
  }

  return result.join('');
}
