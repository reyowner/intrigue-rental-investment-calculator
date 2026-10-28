// Run in a ready, disposable page at 320/375/768/896/1024/1440px in both themes.
export function runHeaderLogoChecks() {
  const checks = [];
  const check = (value, label) => {
    if (!value) throw new Error(`${innerWidth}px ${document.documentElement.dataset.theme}: ${label}`);
    checks.push(label);
  };
  const element = selector => document.querySelector(selector);
  const rect = selector => element(selector).getBoundingClientRect();
  const near = (a, b, tolerance = 0.15) => Math.abs(a - b) <= tolerance;
  const bar = rect('.header-bar');
  const brand = rect('.header-bar .brand');
  const logo = rect('.header-bar .header-logo');
  const mark = rect('.header-bar .header-mark');
  const desktop = matchMedia('(min-width: 56rem)').matches;
  check(near(logo.width, desktop ? 104 : 92), 'wordmark is modestly smaller without a larger phone override');
  check(brand.width >= 44 && brand.height >= 44, 'brand retains a 44px minimum hit area');
  check(near(brand.left - bar.left, desktop ? 39 : 29), 'only the brand gains an 8px left inset');
  check(near(brand.top + brand.height / 2, bar.top + bar.height / 2), 'brand hit area is vertically centered');
  check(near(logo.top + logo.height / 2, bar.top + bar.height / 2 + 1), 'wordmark has a 1px optical centering adjustment');
  check(near(logo.width / logo.height, 377 / 132, 0.01), 'wordmark intrinsic aspect ratio is preserved');
  const markImage = element('.header-bar .header-mark');
  check(near(mark.width / mark.height, markImage.naturalWidth / markImage.naturalHeight, 0.02), 'lime mark intrinsic aspect ratio is preserved');
  check(near(mark.width / logo.width, 0.108, 0.001), 'lime mark keeps its designed relative scale');
  check(near(mark.top, logo.top) && near(mark.left, logo.right), 'lime mark keeps its designed top-edge placement');
  check(brand.right < rect('.header-actions').left, 'brand does not overlap header actions');
  for (const control of document.querySelectorAll('.header-bar button, .header-bar .header-contact, .site-navigation a')) {
    if (!control.getClientRects().length) continue;
    const bounds = control.getBoundingClientRect();
    check(bounds.width >= 44 && bounds.height >= 44, `${control.className || control.textContent.trim()} retains a 44px hit area`);
  }
  if (desktop) {
    const navigation = rect('.site-navigation');
    const style = getComputedStyle(element('.header-bar'));
    // Existing asymmetric pill padding puts the grid's center 8px right of the pill center.
    const center = bar.left + (bar.width + parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) / 2;
    check(near(navigation.left + navigation.width / 2, center), 'desktop navigation stays in its original centered grid column');
  } else {
    check(getComputedStyle(element('.menu-toggle')).borderTopWidth === '0px', 'mobile hamburger remains borderless');
  }
  check(document.documentElement.scrollWidth <= document.documentElement.clientWidth, 'header introduces no page overflow');
  return { width: innerWidth, theme: document.documentElement.dataset.theme, passed: checks.length, checks,
    bounds: { bar: bar.toJSON(), brand: brand.toJSON(), logo: logo.toJSON(), mark: mark.toJSON(), navigation: rect('.site-navigation').toJSON(), actions: rect('.header-actions').toJSON() } };
}
