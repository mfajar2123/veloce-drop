export type Point = { x: number; y: number };
export type Quad = [Point, Point, Point, Point];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function toGray(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let index = 0, pixel = 0; index < gray.length; index++, pixel += 4) {
    gray[index] = 0.299 * data[pixel] + 0.587 * data[pixel + 1] + 0.114 * data[pixel + 2];
  }
  return gray;
}

function boxBlur(source: Float32Array, width: number, height: number): Float32Array {
  const horizontal = new Float32Array(source.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let total = 0;
      let count = 0;
      for (let dx = -1; dx <= 1; dx++) {
        const sampleX = x + dx;
        if (sampleX < 0 || sampleX >= width) continue;
        total += source[row + sampleX];
        count++;
      }
      horizontal[row + x] = total / count;
    }
  }
  const output = new Float32Array(source.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const sampleY = y + dy;
        if (sampleY < 0 || sampleY >= height) continue;
        total += horizontal[sampleY * width + x];
        count++;
      }
      output[y * width + x] = total / count;
    }
  }
  return output;
}

function gradientMagnitude(gray: Float32Array, width: number, height: number): Float32Array {
  const magnitude = new Float32Array(gray.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const topLeft = gray[index - width - 1];
      const top = gray[index - width];
      const topRight = gray[index - width + 1];
      const left = gray[index - 1];
      const right = gray[index + 1];
      const bottomLeft = gray[index + width - 1];
      const bottom = gray[index + width];
      const bottomRight = gray[index + width + 1];
      const gx = topRight + 2 * right + bottomRight - (topLeft + 2 * left + bottomLeft);
      const gy = bottomLeft + 2 * bottom + bottomRight - (topLeft + 2 * top + topRight);
      magnitude[index] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return magnitude;
}

function polygonArea(points: Point[]): number {
  let total = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    total += current.x * next.y - next.x * current.y;
  }
  return Math.abs(total) / 2;
}

function orderQuad(points: Point[]): Quad {
  let topLeft = points[0];
  let topRight = points[0];
  let bottomRight = points[0];
  let bottomLeft = points[0];
  let minSum = Number.POSITIVE_INFINITY;
  let maxSum = Number.NEGATIVE_INFINITY;
  let minDiff = Number.POSITIVE_INFINITY;
  let maxDiff = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const sum = point.x + point.y;
    const diff = point.x - point.y;
    if (sum < minSum) { minSum = sum; topLeft = point; }
    if (sum > maxSum) { maxSum = sum; bottomRight = point; }
    if (diff > maxDiff) { maxDiff = diff; topRight = point; }
    if (diff < minDiff) { minDiff = diff; bottomLeft = point; }
  }
  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Finds the outline of the largest paper-like quadrilateral in a frame.
 *
 * The pipeline is deliberately classical rather than learned: grayscale, blur,
 * Sobel magnitude, an adaptive threshold, the largest 4-connected component,
 * and finally the extreme-corner assignment that turns a blob into a quad.
 * It returns null when nothing convincing is found so the caller can fall back
 * to the full frame instead of warping a wrong crop.
 */
export function detectDocumentQuad(data: Uint8ClampedArray, width: number, height: number): Quad | null {
  if (width < 16 || height < 16) return null;
  const gray = boxBlur(toGray(data, width, height), width, height);
  const magnitude = gradientMagnitude(gray, width, height);

  let total = 0;
  let totalSquares = 0;
  let samples = 0;
  for (let index = 0; index < magnitude.length; index += 2) {
    total += magnitude[index];
    totalSquares += magnitude[index] * magnitude[index];
    samples++;
  }
  const mean = total / samples;
  const deviation = Math.sqrt(Math.max(0, totalSquares / samples - mean * mean));
  const threshold = Math.max(12, mean + 1.1 * deviation);

  const mask = new Uint8Array(magnitude.length);
  for (let index = 0; index < magnitude.length; index++) {
    if (magnitude[index] > threshold) mask[index] = 1;
  }

  // Join nearby edge pixels so a hairline outline becomes one component.
  const dilated = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!mask[index]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const sampleY = y + dy;
        if (sampleY < 0 || sampleY >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const sampleX = x + dx;
          if (sampleX < 0 || sampleX >= width) continue;
          dilated[sampleY * width + sampleX] = 1;
        }
      }
    }
  }

  const visited = new Uint8Array(dilated.length);
  const stack = new Int32Array(dilated.length);
  let best: Point[] | null = null;
  let bestCount = 0;

  for (let start = 0; start < dilated.length; start++) {
    if (!dilated[start] || visited[start]) continue;
    let top = 0;
    stack[top++] = start;
    visited[start] = 1;
    const points: Point[] = [];
    while (top > 0) {
      const index = stack[--top];
      const x = index % width;
      const y = (index - x) / width;
      points.push({ x, y });
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sampleX = x + dx;
          const sampleY = y + dy;
          if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
          const next = sampleY * width + sampleX;
          if (visited[next] || !dilated[next]) continue;
          visited[next] = 1;
          stack[top++] = next;
        }
      }
    }
    if (points.length > bestCount) {
      bestCount = points.length;
      best = points;
    }
  }

  // The component we just walked is the page *outline*, not a filled region, so
  // it only needs to be long enough to be a real outline. The meaningful area
  // test happens on the resulting quadrilateral below.
  const minimumOutline = Math.max(96, width * height * 0.0015);
  if (!best || best.length < minimumOutline) return null;

  const quad = orderQuad(best);
  const area = polygonArea(quad);
  if (area < width * height * 0.12) return null;

  const interior = new Set(quad.map(point => `${point.x},${point.y}`));
  if (interior.size < 4) return null;

  const scaleX = width;
  const scaleY = height;
  const normalised = quad.map(point => ({ x: point.x / scaleX, y: point.y / scaleY }));
  const minEdge = 0.12;
  for (let index = 0; index < 4; index++) {
    const current = normalised[index];
    const next = normalised[(index + 1) % 4];
    if (Math.hypot(current.x - next.x, current.y - next.y) < minEdge) return null;
  }

  return quad;
}

type Matrix = number[];

function solve(matrix: number[][], vector: number[]): number[] | null {
  const size = vector.length;
  const grid = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < size; column++) {
    let pivot = column;
    for (let row = column + 1; row < size; row++) {
      if (Math.abs(grid[row][column]) > Math.abs(grid[pivot][column])) pivot = row;
    }
    if (Math.abs(grid[pivot][column]) < 1e-10) return null;
    [grid[column], grid[pivot]] = [grid[pivot], grid[column]];
    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const factor = grid[row][column] / grid[column][column];
      if (!factor) continue;
      for (let columnIndex = column; columnIndex <= size; columnIndex++) {
        grid[row][columnIndex] -= factor * grid[column][columnIndex];
      }
    }
  }
  return grid.map((row, index) => row[size] / row[index]);
}

/** Homography that maps the destination rectangle back into the source quad. */
function inverseHomography(quad: Quad, width: number, height: number): Matrix | null {
  const destination: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const matrix: number[][] = [];
  const vector: number[] = [];
  for (let index = 0; index < 4; index++) {
    const { x, y } = destination[index];
    const { x: u, y: v } = quad[index];
    matrix.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    vector.push(v);
  }
  return solve(matrix, vector);
}

function sampleChannel(source: Uint8ClampedArray, width: number, height: number, x: number, y: number, channel: number): number {
  const clampedX = clamp(x, 0, width - 1);
  const clampedY = clamp(y, 0, height - 1);
  const left = Math.floor(clampedX);
  const top = Math.floor(clampedY);
  const right = Math.min(width - 1, left + 1);
  const bottom = Math.min(height - 1, top + 1);
  const fx = clampedX - left;
  const fy = clampedY - top;
  const topLeft = source[(top * width + left) * 4 + channel];
  const topRight = source[(top * width + right) * 4 + channel];
  const bottomLeft = source[(bottom * width + left) * 4 + channel];
  const bottomRight = source[(bottom * width + right) * 4 + channel];
  return (topLeft * (1 - fx) + topRight * fx) * (1 - fy) + (bottomLeft * (1 - fx) + bottomRight * fx) * fy;
}

export type WarpOptions = { maxLongSide?: number };

/**
 * Warps the detected quad onto a straight rectangle. The output size follows the
 * average edge length of the quad, so a sheet photographed at an angle keeps its
 * detail instead of being resampled up from a fixed guess.
 */
export function warpQuad(source: ImageData, quad: Quad, options: WarpOptions = {}): ImageData {
  const maxLongSide = options.maxLongSide ?? 2400;
  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const topWidth = distance(quad[0], quad[1]);
  const bottomWidth = distance(quad[3], quad[2]);
  const leftHeight = distance(quad[0], quad[3]);
  const rightHeight = distance(quad[1], quad[2]);
  const rawWidth = (topWidth + bottomWidth) / 2;
  const rawHeight = (leftHeight + rightHeight) / 2;
  const scale = Math.min(1, maxLongSide / Math.max(rawWidth, rawHeight));
  const width = Math.max(1, Math.round(rawWidth * scale));
  const height = Math.max(1, Math.round(rawHeight * scale));

  const matrix = inverseHomography(quad, width, height);
  const output = new ImageData(width, height);
  if (!matrix) {
    // Degenerate quad: fall back to a plain copy of the source region.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceX = Math.round((x / width) * source.width);
        const sourceY = Math.round((y / height) * source.height);
        const target = (y * width + x) * 4;
        const origin = (clamp(sourceY, 0, source.height - 1) * source.width + clamp(sourceX, 0, source.width - 1)) * 4;
        output.data[target] = source.data[origin];
        output.data[target + 1] = source.data[origin + 1];
        output.data[target + 2] = source.data[origin + 2];
        output.data[target + 3] = 255;
      }
    }
    return output;
  }

  const [a, b, c, d, e, f, g, h] = matrix;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const denominator = g * x + h * y + 1;
      const sourceX = (a * x + b * y + c) / denominator;
      const sourceY = (d * x + e * y + f) / denominator;
      const target = (y * width + x) * 4;
      output.data[target] = sampleChannel(source.data, source.width, source.height, sourceX, sourceY, 0);
      output.data[target + 1] = sampleChannel(source.data, source.width, source.height, sourceX, sourceY, 1);
      output.data[target + 2] = sampleChannel(source.data, source.width, source.height, sourceX, sourceY, 2);
      output.data[target + 3] = 255;
    }
  }
  return output;
}

function percentileBounds(histogram: number[], total: number, low: number, high: number): [number, number] {
  let running = 0;
  let lower = 0;
  let upper = 255;
  const lowTarget = total * low;
  const highTarget = total * high;
  for (let value = 0; value < 256; value++) {
    running += histogram[value];
    if (running >= lowTarget) { lower = value; break; }
  }
  running = 0;
  for (let value = 0; value < 256; value++) {
    running += histogram[value];
    if (running >= highTarget) { upper = value; break; }
  }
  return [lower, upper];
}

/**
 * White balance plus contrast stretch, the two adjustments a phone snapshot of a
 * page almost always needs: indoor light casts a colour, and the paper never
 * reaches pure white. Both are measured from the image, not hardcoded.
 */
export function enhanceDocument(image: ImageData): ImageData {
  const { data, width, height } = image;
  const total = width * height;
  if (!total) return image;
  const histograms = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)];
  for (let index = 0; index < data.length; index += 4) {
    histograms[0][data[index]]++;
    histograms[1][data[index + 1]]++;
    histograms[2][data[index + 2]]++;
  }

  const gains: number[] = [];
  for (let channel = 0; channel < 3; channel++) {
    const [lower, upper] = percentileBounds(histograms[channel], total, 0.02, 0.98);
    const span = Math.max(1, upper - lower);
    gains.push(255 / span);
    for (let value = 0; value < 256; value++) histograms[channel][value] = Math.round(clamp((value - lower) * gains[channel], 0, 255));
  }

  const output = new ImageData(width, height);
  for (let index = 0; index < data.length; index += 4) {
    output.data[index] = histograms[0][data[index]];
    output.data[index + 1] = histograms[1][data[index + 1]];
    output.data[index + 2] = histograms[2][data[index + 2]];
    output.data[index + 3] = 255;
  }
  return output;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(value => (value ? resolve(value) : reject(new Error('encode'))), type, quality);
  });
}

export const imageDataToCanvas = (image: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d')?.putImageData(image, 0, 0);
  return canvas;
};
