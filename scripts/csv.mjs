/** Minimal RFC-4180 reader/writer, enough for the translation tables. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ',') endField();
    else if (char === '\n') endRow();
    else if (char !== '\r') field += char;
  }
  if (field || row.length) endRow();
  return rows;
}

const cell = (value) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

export const writeCsv = (rows) => `${rows.map((row) => row.map(cell).join(',')).join('\n')}\n`;
