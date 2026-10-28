const assert = (value, text) => { if (!value) throw new Error(text); };
export async function runThemeChecks() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const form = document.querySelector('[data-calculator-form]');
  const original = [...form.elements].filter(e => e.name).map(e => e.value).join('|');
  const checks = [];
  const check = (value, text) => { assert(value, text); checks.push(text); };
  const mode = value => { if (document.documentElement.dataset.theme !== value) toggle.click(); };
  mode('light');
  const light = getComputedStyle(form).backgroundColor;
  check(Boolean(toggle.querySelector('[data-theme-icon="sun"]')), 'light mode displays the sun icon');
  mode('dark');
  check(getComputedStyle(form).backgroundColor !== light, 'dark mode changes actual financial form surfaces');
  check(Boolean(toggle.querySelector('[data-theme-icon="moon"]')), 'dark mode displays the moon icon');
  check(toggle.getAttribute('aria-label') === 'Switch to light mode', 'accessible toggle name describes its action');
  check([...form.elements].filter(e => e.name).map(e => e.value).join('|') === original, 'theme changes preserve all financial inputs');
  check(getComputedStyle(document.querySelector('.menu-toggle')).borderTopWidth === '0px', 'mobile menu has no border');
  check(toggle.getBoundingClientRect().width >= 44 && toggle.getBoundingClientRect().height >= 44, 'theme toggle retains a 44px hit area');
  for (const selector of ['.calculator-form','.contact-panel','.projection-charts','.calculator-derived']) {
    const element = document.querySelector(selector);
    const s = getComputedStyle(element);
    check(s.backgroundColor !== 'rgb(255, 255, 255)', `${selector} does not leave a white card in dark mode`);
  }
  mode('light');
  check(getComputedStyle(form).backgroundColor === light, 'returning to light restores the original form surface');
  return { passed: checks.length, checks };
}


export function runThemeContrastChecks() {
  const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function background(node){for(let n=node;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;const values=c.match(/[\d.]+/g).map(Number);if(values.length===3||values[3]===1)return c;}return 'rgb(255,255,255)';}
  const selectors=['.hero h1','.hero-description','.hero-secondary','.how-step p','.calculator-form h3','.calculator-field label','.calculator-field-help','.calculator-field input','.calculator-derived h4','.calculator-derived [data-result-value]','.calculator-results h3','.calculator-results-note','.projection-heading h3','.calculator-tools h4','.calculator-tools-privacy','.calculator-tools-actions button','.projection-charts > p','.projection-chart-header h4','.projection-chart-inspector strong','.projection-chart-table-link a','.projection-table th','.projection-table td','.contact-panel h3','.contact-demo-note','.form-field label','.form-field input','.field-help','.contact-deal-label','.contact-copy h2','.contact-alternative a'];
  const pairs=selectors.map(selector=>{const node=document.querySelector(selector);const style=getComputedStyle(node);const bg=background(node);return{selector,ratio:ratio(style.color,bg),foreground:style.color,background:bg};});
  for(const pair of pairs)assert(pair.ratio>=4.5,`text contrast below 4.5: ${pair.selector} (${pair.ratio})`);
  return{passed:pairs.length,pairs};
}
