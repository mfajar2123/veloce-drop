import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const sitemap = readFileSync('dist/sitemap.xml','utf8');
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
for (const width of [320,390,768]) {
  test('public pages fit at '+width+'px',async({page})=>{
    test.setTimeout(240000);
    await page.setViewportSize({width,height:844});
    for(const path of [...routes,'/404.html','/']){
      await page.goto(path,{waitUntil:'domcontentloaded'});
      const issues=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth-innerWidth,
        viewport:!!document.querySelector('meta[name=viewport]'),
      }));
      expect.soft(issues,path).toEqual({overflow:0,viewport:true});
    }
  });
}
