import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/tool-registry.ts';

test('the published catalog contains only the eleven selected tools', () => {
  assert.deepEqual(catalog.map(tool => tool.id), [
    'compress-image', 'batch', 'resize-image', 'image-converter', 'background',
    'logo-watermark', 'photo-pdf', 'pdf-jpg', 'pdf-500kb', 'print', 'document-scanner',
  ]);
  assert.equal(new Set(catalog.flatMap(tool => Object.values(tool.path))).size, 22);
});

test('every catalog entry has bilingual metadata, a category, an engine and route-specific guidance', () => {
  const ids = new Set();
  for (const tool of catalog) {
    assert.equal(ids.has(tool.id), false, `duplicate tool id: ${tool.id}`);
    ids.add(tool.id);
    for (const lang of ['id', 'en']) {
      assert.match(tool.path[lang], new RegExp(`^/${lang}/.+/$`), `${tool.id} ${lang} route`);
      assert.ok(tool.name[lang].trim(), `${tool.id} ${lang} name`);
      assert.ok(tool.seo?.title[lang].trim(), `${tool.id} ${lang} SEO title`);
      assert.ok(tool.seo?.description[lang].trim(), `${tool.id} ${lang} SEO description`);
      assert.ok(tool.faq?.every(item => item.question[lang].trim() && item.answer[lang].trim()), `${tool.id} ${lang} FAQ`);
      assert.ok(tool.nextSteps?.every(item => item.path[lang].startsWith(`/${lang}/`) && item.label[lang].trim()), `${tool.id} ${lang} next step`);
    }
    assert.ok(tool.category, `${tool.id} category`);
    assert.ok(tool.engine, `${tool.id} engine`);
    assert.ok(tool.faq?.length, `${tool.id} FAQ`);
    assert.ok(tool.nextSteps?.length, `${tool.id} next steps`);
  }
});

test('catalog routes and next steps do not collide or point to unregistered routes', () => {
  const routes = new Set();
  for (const tool of catalog) {
    for (const lang of ['id', 'en']) {
      assert.equal(routes.has(tool.path[lang]), false, `duplicate route: ${tool.path[lang]}`);
      routes.add(tool.path[lang]);
      for (const step of tool.nextSteps ?? []) {
        assert.ok(routes.has(step.path[lang]) || catalog.some(candidate => candidate.path[lang] === step.path[lang]), `${tool.id} next step points outside the catalog: ${step.path[lang]}`);
      }
    }
  }
});

test('each tool has at least two distinct, bilingual FAQs written for its actual workflow', () => {
  const localizedFaqs = new Set();
  for (const tool of catalog) {
    assert.ok(tool.faq?.length >= 2, `${tool.id} FAQ count`);
    for (const lang of ['id', 'en']) {
      const copy = tool.faq.map(item => `${item.question[lang]} ${item.answer[lang]}`).join('\n');
      assert.ok(!localizedFaqs.has(`${lang}:${copy}`), `${tool.id} repeats another tool's ${lang} FAQ`);
      localizedFaqs.add(`${lang}:${copy}`);
      for (const item of tool.faq) {
        assert.ok(item.question[lang].endsWith('?'), `${tool.id} ${lang} question punctuation`);
        assert.ok(item.answer[lang].length > 70, `${tool.id} ${lang} answer has useful detail`);
      }
    }
  }
});
