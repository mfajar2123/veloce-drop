const elements = new Set(['svg','g','defs','path','rect','circle','ellipse','line','polyline','polygon','linearGradient','radialGradient','stop','clipPath','mask','title','desc']);
const attributes = new Set(['xmlns','width','height','viewBox','preserveAspectRatio','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points','fill','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','opacity','transform','gradientUnits','gradientTransform','offset','stop-color','stop-opacity','clip-path','clip-rule','fill-rule','id','version']);

function dimension(value: string | null) {
  if (!value) return undefined;
  const match = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/i.exec(value);
  if (!match) throw new Error('svg-dimensions');
  const result = Number(match[1]);
  if (!Number.isFinite(result) || result <= 0 || result > 6000) throw new Error('svg-dimensions');
  return result;
}

function inspect(node: Element, depth: number, count: { value: number }) {
  if (depth > 32 || ++count.value > 5000 || node.namespaceURI !== 'http://www.w3.org/2000/svg' || !elements.has(node.localName)) throw new Error('svg-content');
  for (const attribute of Array.from(node.attributes)) {
    const name = attribute.name;
    const value = attribute.value.trim();
    const allowedNamespace = name === 'xmlns' && value === 'http://www.w3.org/2000/svg';
    if (!attributes.has(name) || /^on/i.test(name) || (!allowedNamespace && /(?:javascript:|data:|https?:|\/\/|@import|expression\s*\()/i.test(value))) throw new Error('svg-content');
    if (/url\s*\(/i.test(value) && !/^url\(\s*#[\w:.-]+\s*\)$/.test(value)) throw new Error('svg-content');
    if (['transform','gradientTransform'].includes(name) && !/^[\w\s.,()+-]*$/.test(value)) throw new Error('svg-content');
  }
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) inspect(child as Element, depth + 1, count);
    else if (child.nodeType === 3 && child.textContent?.trim() && !['title','desc'].includes(node.localName)) throw new Error('svg-content');
    else if (![3, 8].includes(child.nodeType)) throw new Error('svg-content');
  }
}

export function sanitizeSvg(source: string) {
  if (!source.trim() || source.length > 5_000_000) throw new Error('svg-size');
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('svg-content');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = document.documentElement;
  if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg' || document.querySelector('parsererror')) throw new Error('svg-content');
  inspect(root, 0, { value: 0 });

  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (viewBox && (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0)) throw new Error('svg-dimensions');
  let width = dimension(root.getAttribute('width'));
  let height = dimension(root.getAttribute('height'));
  if (!width && !height && viewBox) { const scale = Math.min(1, 1024 / Math.max(viewBox[2], viewBox[3])); width = Math.max(1, Math.round(viewBox[2] * scale)); height = Math.max(1, Math.round(viewBox[3] * scale)); }
  else if (width && !height && viewBox) height = Math.round(width * viewBox[3] / viewBox[2]);
  else if (height && !width && viewBox) width = Math.round(height * viewBox[2] / viewBox[3]);
  else if (!width || !height) throw new Error('svg-dimensions');
  width = Math.round(width!); height = Math.round(height!);
  if (width < 1 || height < 1 || width * height > 40_000_000) throw new Error('svg-dimensions');
  return { source: new XMLSerializer().serializeToString(root), width, height };
}
