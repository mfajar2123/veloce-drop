export type SessionFile = { id: string; blob: Blob; name: string; width?: number; height?: number; created: number };
const MAX_FILES = 5;
const MAX_BYTES = 50_000_000;
const TTL = 30 * 60 * 1000;
type State = { files: SessionFile[]; pending: { id: string; path: string } | null; listeners: Set<() => void>; timer: ReturnType<typeof setTimeout> | null };
declare global { interface Window { __veloceSession?: State } }
function state(): State {
  return window.__veloceSession ??= {files: [], pending: null, listeners: new Set(), timer: null};
}
function emit(s: State) { for (const listener of s.listeners) listener(); }
function schedule(s: State) {
  if (s.timer) clearTimeout(s.timer);
  s.timer = s.files.length ? setTimeout(() => { prune(); }, Math.max(0, s.files[0].created + TTL - Date.now())) : null;
}
function prune() {
  const s = state(); const before = s.files.length;
  s.files = s.files.filter(file => file.created + TTL > Date.now());
  if (s.pending && !s.files.some(file => file.id === s.pending!.id)) s.pending = null;
  schedule(s); if (before !== s.files.length) emit(s);
}
export function listSessionFiles(): SessionFile[] { prune(); return state().files.slice().reverse(); }
export function subscribeSession(listener: () => void) { const s = state(); s.listeners.add(listener); return () => { s.listeners.delete(listener); }; }
export function addSessionFile(blob: Blob, width?: number, height?: number): string | null {
  if (!blob.size || blob.size > MAX_BYTES) return null;
  prune(); const s = state(); const id = crypto.randomUUID();
  const extension: Record<string,string> = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf','application/zip':'zip'};
  const name = `velocedrop.${extension[blob.type] ?? 'bin'}`;
  s.files.push({id, blob, name, width, height, created: Date.now()});
  while (s.files.length > MAX_FILES || s.files.reduce ( (sum, item) => sum + item.blob.size, 0) > MAX_BYTES) s.files.shift();
  if (s.pending && !s.files.some(file => file.id === s.pending!.id)) s.pending = null;
  schedule(s); emit(s); return id;
}
export function removeSessionFile(id: string) { const s=state(); s.files=s.files.filter(file=>file.id!==id); if(s.pending?.id===id)s.pending=null; schedule(s); emit(s); }
export function clearSessionFiles() { const s=state(); s.files=[]; s.pending=null; schedule(s); emit(s); }
export function handoffSessionFile(id: string, path: string): boolean { prune(); const s=state(); if(!s.files.some(file=>file.id===id))return false; s.pending={id,path}; return true; }
export function takeSessionFile(path: string): File | null {
  prune(); const s=state(); if(!s.pending || s.pending.path!==path)return null;
  const item=s.files.find(file=>file.id===s.pending!.id); s.pending=null;
  return item ? new File([item.blob], item.name, {type:item.blob.type}) : null;
}
