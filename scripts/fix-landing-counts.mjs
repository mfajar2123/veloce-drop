import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/pages/[lang]/index.astro';
let source = await readFile(path, 'utf8');
const before = source;

source = source.replace(
  `aria-controls="home-tool-list" aria-expanded="false">{en ? 'Show 4 more tools' : 'Tampilkan 4 alat lain'}</button>`,
  `aria-controls="home-tool-list" aria-expanded="false">{en ? \`Show \${curated.length - 6} more tools\` : \`Tampilkan \${curated.length - 6} alat lain\`}</button>`,
);

source = source.replace(
  `        const toggle = root.querySelector<HTMLButtonElement>('[data-home-tool-toggle]')!;`,
  `        const toggle = root.querySelector<HTMLButtonElement>('[data-home-tool-toggle]')!;
        const shown = rows.filter(row => row.dataset.defaultHidden !== 'true').length;`,
);

source = source.replace(
  `          toggle.textContent = expanded ? (en ? 'Show fewer tools' : 'Tampilkan lebih sedikit') : (en ? 'Show 4 more tools' : 'Tampilkan 4 alat lain');`,
  `          toggle.textContent = expanded ? (en ? 'Show fewer tools' : 'Tampilkan lebih sedikit') : (en ? \`Show \${rows.length - shown} more tools\` : \`Tampilkan \${rows.length - shown} alat lain\`);`,
);

source = source.replace(
  `          count.textContent = searching ? (en ? \`\${visible} matching tools\` : \`\${visible} alat cocok\`) : (expanded ? (en ? 'All 10 tools' : 'Semua 10 alat') : (en ? '6 of 10 tools' : '6 dari 10 alat'));`,
  `          count.textContent = searching ? (en ? \`\${visible} matching tools\` : \`\${visible} alat cocok\`) : (expanded ? (en ? \`All \${rows.length} tools\` : \`Semua \${rows.length} alat\`) : (en ? \`\${shown} of \${rows.length} tools\` : \`\${shown} dari \${rows.length} alat\`));`,
);

await writeFile(path, source, 'utf8');
console.log('changed:', source !== before);
console.log('leftovers:', source.match(/all 10|Show 4 more|Tampilkan 4 alat|Semua 10|6 of 10/gi) ?? 'none');
