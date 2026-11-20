type Options = { mode: 'crop' | 'contain'; circle: boolean; x: number; y: number };

export function drawResized(ctx: CanvasRenderingContext2D, image: ImageBitmap, width: number, height: number, options: Options) {
  const fill = options.circle || options.mode === 'crop';
  const side = Math.min(width, height);
  const frameWidth = options.circle ? side : width;
  const frameHeight = options.circle ? side : height;
  const frameX = (width - frameWidth) / 2;
  const frameY = (height - frameHeight) / 2;
  const scale = (fill ? Math.max : Math.min)(frameWidth / image.width, frameHeight / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  if (options.circle) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, side / 2, 0, 2 * Math.PI);
    ctx.clip();
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    frameX + (frameWidth - drawnWidth) * (fill ? options.x / 100 : 0.5),
    frameY + (frameHeight - drawnHeight) * (fill ? options.y / 100 : 0.5),
    drawnWidth,
    drawnHeight,
  );
  ctx.restore();
}
