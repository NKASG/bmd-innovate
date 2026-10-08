// BMD Innovate: renders deals and shop details from data/*.json.
// The owner edits those files at /admin (Decap CMS); this script only reads them.
(function () {
  'use strict';

  var CAT = { phone: 'Phones', laptop: 'Laptops', tablet: 'Tablets', accessory: 'Accessories', other: 'Other' };
  var CAT1 = { phone: 'Phone', laptop: 'Laptop', tablet: 'Tablet', accessory: 'Accessory', other: 'Gadget' };
  var ILLUS = {
    phone: '<rect x="34" y="10" width="32" height="62" rx="7"></rect><path d="M45 16h10"></path>',
    laptop: '<rect x="22" y="18" width="56" height="38" rx="3"></rect><path d="M12 62h76l-5 8H17z"></path>',
    tablet: '<rect x="24" y="10" width="52" height="64" rx="6"></rect><path d="M47 67h6"></path>',
    accessory: '<path d="M28 56v-8a22 22 0 0 1 44 0v8"></path><rect x="22" y="52" width="12" height="20" rx="4"></rect><rect x="66" y="52" width="12" height="20" rx="4"></rect>',
    other: '<rect x="37" y="26" width="26" height="32" rx="7"></rect><path d="M42 26l2-14h12l2 14M42 58l2 14h12l2-14"></path>'
  };

  var settings = {}, deals = [], filter = 'all';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v) { return Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0; }
  function naira(n) { return '₦' + Math.round(num(n)).toLocaleString('en-NG'); }
  function short(n) {
    n = num(n);
    if (n >= 1e6) return '₦' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    if (n >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
    return naira(n);
  }
  function time(d) { var t = Date.parse(d.posted); return isNaN(t) ? 0 : t; }
  function ago(d) {
    var t = time(d); if (!t) return '';
    var m = Math.max(0, (Date.now() - t) / 60000);
    if (m < 2) return 'Posted just now';
    if (m < 60) return 'Posted ' + Math.round(m) + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return 'Posted ' + h + (h === 1 ? ' hour ago' : ' hours ago');
    var days = Math.round(h / 24); if (days === 1) return 'Posted yesterday';
    if (days < 14) return 'Posted ' + days + ' days ago';
    return 'Posted ' + new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function isNew(d) { var t = time(d); return t && Date.now() - t < 48 * 3600000; }

  function waNumber() {
    var d = String(settings.whatsapp || '').replace(/\D/g, '');
    if (d.charAt(0) === '0') d = '234' + d.slice(1);
    return d;
  }
  function waLink(text) { var n = waNumber(); return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(text) : ''; }

  function photoUrl(p) {
    if (!p) return '';
    if (/^https?:\/\//.test(p)) return p;
    return p.replace(/^\//, ''); // stored as /uploads/x.jpg -> relative, works in subfolders too
  }

  function sorted() {
    return deals.slice().sort(function (a, b) {
      if (!!a.sold !== !!b.sold) return a.sold ? 1 : -1;
      return time(b) - time(a);
    });
  }

  function card(d) {
    var price = num(d.price), old = num(d.old_price);
    var media = d.photo
      ? '<img src="' + esc(photoUrl(d.photo)) + '" alt="' + esc(d.title) + '" loading="lazy">'
      : '<svg class="illus" viewBox="0 0 100 84" aria-hidden="true">' + (ILLUS[d.category] || ILLUS.other) + '</svg>';
    var badges = d.sold ? '<span class="badge soldb">Sold out</span>' : (isNew(d) ? '<span class="badge new">New</span>' : '');
    if (d.condition) badges += '<span class="badge">' + esc(d.condition) + '</span>';
    var save = (!d.sold && old > price) ? '<s class="was">' + naira(old) + '</s><span class="save">Save ' + short(old - price) + '</span>' : '';
    var link = waLink('Hi BMD Innovate, is the ' + d.title + (d.specs ? ' (' + d.specs + ')' : '') + ' for ' + naira(price) + ' still available?');
    var btn = d.sold ? '<button class="btn btn-quiet btn-wa" type="button" disabled>Sold out</button>'
      : link ? '<a class="btn btn-accent btn-wa" href="' + esc(link) + '" target="_blank" rel="noopener">Ask on WhatsApp</a>'
      : '<a class="btn btn-quiet btn-wa" href="#visit">Contact the shop</a>';
    return '<article class="deal' + (d.sold ? ' sold' : '') + '" data-category="' + esc(d.category || 'other') + '">' +
      '<div class="deal-media">' + media + '<div class="badges">' + badges + '</div></div>' +
      '<div class="deal-body">' +
        '<p class="deal-cat">' + esc(CAT1[d.category] || 'Gadget') + '</p>' +
        '<h3>' + esc(d.title) + '</h3>' +
        (d.specs ? '<p class="deal-specs">' + esc(d.specs) + '</p>' : '') +
        '<div class="price-row"><span class="tag">' + naira(price) + '</span>' + save + '</div>' +
        (d.note ? '<p class="deal-note">' + esc(d.note) + '</p>' : '') +
        '<div class="deal-meta"><span>' + esc(ago(d)) + '</span>' + (d.swap && !d.sold ? '<span class="swap">Swap accepted</span>' : '') + '</div>' +
        btn +
      '</div></article>';
  }

  function renderHero() {
    var live = sorted().filter(function (d) { return !d.sold; });
    $('#hero-side').innerHTML = live.length
      ? '<p class="hero-label eyebrow"><span class="live-dot"></span>Latest deal</p>' + card(live[0])
      : '<div class="hero-empty">' + $('.brand .mark').outerHTML + '<p>New deals are posted here as they arrive. Check back soon, or message us for what you need.</p></div>';
    var phones = live.filter(function (d) { return d.category === 'phone'; }).length;
    var laptops = live.filter(function (d) { return d.category === 'laptop'; }).length;
    var facts = [live.length + (live.length === 1 ? ' deal available now' : ' deals available now')];
    if (phones) facts.push(phones + ' phone' + (phones > 1 ? 's' : ''));
    if (laptops) facts.push(laptops + ' laptop' + (laptops > 1 ? 's' : ''));
    $('#hero-facts').innerHTML = facts.map(function (f) { return '<span><i></i>' + esc(f) + '</span>'; }).join('');
  }

  function renderFilters() {
    var counts = { all: deals.length };
    deals.forEach(function (d) { var c = d.category || 'other'; counts[c] = (counts[c] || 0) + 1; });
    var keys = ['all'].concat(Object.keys(CAT).filter(function (k) { return counts[k]; }));
    $('#filters').innerHTML = deals.length ? keys.map(function (k) {
      return '<button class="chip" type="button" data-filter="' + k + '" aria-pressed="' + (filter === k) + '">' +
        (k === 'all' ? 'All deals' : CAT[k]) + ' <span class="n">' + counts[k] + '</span></button>';
    }).join('') : '';
  }

  function renderGrid() {
    var list = sorted().filter(function (d) { return filter === 'all' || (d.category || 'other') === filter; });
    $('#grid').innerHTML = list.length ? list.map(card).join('')
      : '<div class="empty"><h3>No deals up right now</h3><p>New phones and laptops are posted here as soon as they arrive. Message us on WhatsApp and we’ll tell you what’s in stock.</p></div>';
    var latest = deals.reduce(function (m, d) { return Math.max(m, time(d)); }, 0);
    $('#updated').textContent = latest ? 'Updated ' + new Date(latest).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  }

  function renderInfo() {
    var fallback = { address: 'Address coming soon', hours: 'Hours coming soon', phone: 'Number coming soon' };
    $$('[data-s]').forEach(function (el) {
      var k = el.getAttribute('data-s'), v = settings[k];
      el.textContent = v || fallback[k] || '';
      el.classList.toggle('placeholder', !v);
    });
    var tel = String(settings.phone || '').replace(/[^\d+]/g, '');
    if (tel) $('#phone-val').href = 'tel:' + tel; else $('#phone-val').removeAttribute('href');
    $('#copy-phone').hidden = !settings.phone;

    var link = waLink('Hi BMD Innovate, I’d like to ask about a device.');
    var ig = String(settings.instagram || '').replace(/^@/, '');
    var row = '';
    if (link) row += '<a class="btn btn-accent btn-sm" target="_blank" rel="noopener" href="' + esc(link) + '">WhatsApp</a>';
    if (ig) row += '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="https://instagram.com/' + esc(ig) + '">@' + esc(ig) + '</a>';
    $('#social-row').innerHTML = row || '<span class="val placeholder">Coming soon</span>';
    $$('[data-wa="general"]').forEach(function (a) {
      if (link) { a.href = link; a.target = '_blank'; a.rel = 'noopener'; }
    });

    var sells = settings.sells || [];
    if (typeof sells === 'string') sells = sells.split('\n');
    $('#sells').innerHTML = sells.map(function (x) { return typeof x === 'object' ? x.item : x; })
      .filter(Boolean).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  }

  function renderAll() { renderInfo(); renderHero(); renderFilters(); renderGrid(); }

  // ---- events ----
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-filter]');
    if (chip) { filter = chip.getAttribute('data-filter'); renderFilters(); renderGrid(); return; }
    if (e.target.closest('#copy-phone') && settings.phone && navigator.clipboard) {
      var b = $('#copy-phone');
      navigator.clipboard.writeText(settings.phone).then(function () {
        b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600);
      }, function () {});
    }
  });

  // ---- load data ----
  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  Promise.all([getJSON('data/settings.json'), getJSON('data/deals.json')]).then(function (res) {
    settings = res[0] || {};
    deals = ((res[1] && res[1].deals) || []).filter(function (d) { return d && d.title; });
    renderAll();
  }).catch(function (err) {
    console.error(err);
    $('#grid').innerHTML = '<p class="load-error">Deals couldn’t load. Refresh the page, or message us on WhatsApp: 0706 576 0854.' +
      (location.protocol === 'file:' ? ' (Opening the file directly doesn’t work. Run a local server; see README.)' : '') + '</p>';
    $('#hero-side').innerHTML = '';
  });
})();
