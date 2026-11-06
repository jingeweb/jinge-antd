// Source modules register lazy, build-generated HTML. No parser runs in the browser.
type Entry = { load(): Promise<string>; pending?: Promise<string> };
const highlights = new Map<string, Entry>();
export function registerHighlight(code: string, language: string, load: () => Promise<string>) {
  highlights.set(`${language}\0${code}`, { load });
}
export function loadHighlight(code: string, language: string) {
  const entry = highlights.get(`${language}\0${code}`);
  if (!entry) return;
  return (entry.pending ??= entry.load());
}
