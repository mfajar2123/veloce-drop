import { useState } from 'react';

type Props = {
  before: string;
  after: string;
  width: number;
  height: number;
  index: number;
  lang: string;
};

export default function BatchCompare({ before, after, width, height, index, lang }: Props) {
  const en = lang === 'en';
  const [comparison, setComparison] = useState(50);

  return <div>
    <div role="group" aria-label={`${en ? 'Before and after' : 'Sebelum dan sesudah'} ${index}`} style={{ maxWidth: 480, aspectRatio: `${width}/${height}`, overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
      <img src={after} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <img src={before} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', clipPath: `inset(0 ${100 - comparison}% 0 0)` }} />
      <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${comparison}%`, width: 2, background: '#065f46' }} />
    </div>
    <div className="controls">
      <label>{en ? 'Before / after' : 'Sebelum / sesudah'}<input type="range" min="0" max="100" value={comparison} aria-label={`${en ? 'Before and after comparison' : 'Perbandingan sebelum dan sesudah'} ${index}`} onChange={event => setComparison(Number(event.target.value))} /></label>
    </div>
    <p>{en ? 'Original on the left of the divider; compressed output on the right.' : 'Berkas asli berada di kiri garis; hasil kompresi berada di kanan.'}</p>
  </div>;
}
