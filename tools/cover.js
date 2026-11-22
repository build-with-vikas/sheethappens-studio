// node tools/cover.js out.png "pre" "Line1|Line2" "post" "preview" [tag]
const { chromium } = require('playwright');
(async () => {
  const [out, pre, main, post, prev, tag] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const qs = new URLSearchParams({ pre, main, post, prev, tag: tag || 'EXCEL TIP' }).toString();
  await p.goto('file://' + __dirname + '/cover.html?' + qs); await p.evaluate(() => document.fonts.ready);
  await (await p.$('.c')).screenshot({ path: out }); await b.close();
})();
