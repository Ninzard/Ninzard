/* ================================================================
   Ninzard wiki: elections. Election pages load this file right after
   wiki.js. It builds three things:
     - the election infobox: the candidates side by side, with their
       portraits, their rows and a bar showing the share of the vote;
     - the district maps: every district shaded by the winner's
       margin, with a card showing the exact count when you hover,
       tap or tab to a district;
     - the results table: the winner's cells shaded in their colour,
       every candidate's numbers glowing in their party's colour, and
       each row lighting up its district on the map;
     - the portraits at the head of endorsement panels.
   Everything shown is read from the page itself: candidates and votes
   from the results table, district shapes from the map's <svg>, the
   map's title from its data-plate. No election is written in here.
   ================================================================ */
(function () {
  'use strict';

  var doc = document, body = doc.body;
  var main = doc.querySelector('main.article') || body;

  /* the page that lists every image code (the same one wiki.js reads) */
  var IMAGE_CODES = 'Image_codes.html';
  /* margins of victory, in percentage points, that separate the five shades of a map */
  var TIERS = [10, 20, 40, 60];
  /* the five shades, from the narrowest win to the widest: a close race is a pale tint of the
     winner's colour, a landslide a deep, dark shade of it. A negative number mixes the party's
     colour towards white by that much, a positive one towards black. */
  var SHADE = [-0.62, -0.4, -0.12, 0.25, 0.5];
  /* how much lighter a district turns while it is hovered */
  var LIFT = 0.2;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function sv(tag, attrs, parent) {
    var e = doc.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { return Number(n).toLocaleString('en-US'); }
  function pct(p) { return p.toFixed(1) + '%'; }

  /* ---------- reading other pages (image codes, maps shown on another page) ---------- */
  var canFetch = !!(window.fetch && window.DOMParser);
  var pages = {};
  function fetchDoc(url) {
    if (!canFetch) return Promise.reject(new Error('fetch'));
    if (!pages[url]) {
      pages[url] = fetch(url, { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('fetch'); return r.text(); })
        .then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); })
        .catch(function (e) { delete pages[url]; throw e; });
    }
    return pages[url];
  }

  /* ---------- pictures: an image code is looked up in Image_codes.html, as in wiki.js ---------- */
  var codeList = null;
  function imageCodes() {
    if (!codeList) {
      codeList = fetchDoc(new URL(IMAGE_CODES, location.href).href).then(function (d) {
        var map = {};
        each(d.querySelectorAll('table.image-codes tr'), function (tr) {
          var c = tr.querySelectorAll('td'); if (c.length < 2) return;
          var link = c[1].textContent.match(/https?:\/\/\S+/);
          if (link) map[c[0].textContent.trim().toLowerCase()] = link[0];
        });
        return map;
      }).catch(function () { codeList = null; return {}; });
    }
    return codeList;
  }
  var PX = { t: 160, m: 320, l: 640 };
  /* pictures kept on the site itself have smaller copies in Images/160, Images/320 and Images/640,
     as in wiki.js (SITE_PICTURES there); they never go through the outside image proxy */
  var SITE_HOSTS = ['ninzard.pages.dev'];
  function sitePicture(url) {
    var u; try { u = new URL(url, location.href); } catch (e) { return null; }
    if (u.host !== location.host && SITE_HOSTS.indexOf(u.hostname) < 0) return null;
    var file = u.pathname.split('/').pop();
    if (!/\.(jpe?g|png|webp)$/i.test(file)) return null;
    return { full: new URL(u.pathname, location.href).href, file: file };
  }
  function smallerCopy(url, size) {
    var site = sitePicture(url);
    if (site) return PX[size] ? new URL('/Images/' + PX[size] + '/' + site.file, location.href).href : null;
    var m = url.match(/^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]{7}|[A-Za-z0-9]{5})\.(jpe?g|png)(?:[?#].*)?$/i);
    return m ? 'https://i.imgur.com/' + m[1] + size + '.' + m[2].toLowerCase().replace('jpeg', 'jpg') : null;
  }
  /* img gets the picture for `code`; failTarget gets class "fail" (showing its letter) if there is none */
  function picture(img, code, failTarget, size) {
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    if (!code) { failTarget.classList.add('fail'); return; }
    imageCodes().then(function (map) {
      var url = map[code.trim().toLowerCase()];
      if (!url) { failTarget.classList.add('fail'); return; }
      var proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) +
        '&w=' + PX[size] + '&h=' + PX[size] + '&we';
      var site = sitePicture(url);
      var sources = (site ? [smallerCopy(url, size), site.full] : [smallerCopy(url, size), url, proxy]).filter(Boolean), tried = 0;
      img.addEventListener('error', function () {
        tried++;
        if (tried < sources.length) img.src = sources[tried];
        else failTarget.classList.add('fail');
      });
      img.src = sources[0];
    });
  }

  /* ---------- party colours, read from wiki.css ----------
     The colour comes from the party's own rule in wiki.css (.or{color:var(--orie)}) and the value of
     its variable on :root, not from the colour a test element ends up with on screen. A dark-mode
     browser extension (Dark Reader) rewrites the page's colours, and on some loads it had not finished
     when this ran: the test element came back in the extension's own text colour (#e8e6e3) and every
     map, bar and table turned grey and white (found 31 October 2026). A test element is still the
     fallback, used only when it shows a colour different from plain text. */
  var rgbOf = {}, NEUTRAL = [125, 106, 150], ctx2d = null;
  function toRGB(str) {
    str = (str || '').trim();
    if (!str) return null;
    try {
      if (!ctx2d) ctx2d = doc.createElement('canvas').getContext('2d');
      ctx2d.fillStyle = '#010203';
      ctx2d.fillStyle = str;
      var v = String(ctx2d.fillStyle);
      if (v === '#010203' && !/^#010203$/i.test(str)) return null;   /* not a colour */
      var hex = v.match(/^#([0-9a-f]{6})$/i);
      if (hex) return [0, 2, 4].map(function (i) { return parseInt(hex[1].substr(i, 2), 16); });
      var n = v.match(/[\d.]+/g);
      return n ? n.slice(0, 3).map(Number) : null;
    } catch (e) { return null; }
  }
  function ruleColour(cls) {
    var want = '.' + cls, found = null;
    function search(sheet) {
      var rules; try { rules = sheet.cssRules; } catch (e) { return; }
      if (rules) each(rules, function (r) { if (!found && r.selectorText === want && r.style && r.style.color) found = r.style.color; });
    }
    /* wiki.css first, so an extension's copies of the rule are never the ones read */
    each(doc.styleSheets, function (sh) { if (!found && /(^|\/)wiki\.css(\?|#|$)/.test(sh.href || '')) search(sh); });
    each(doc.styleSheets, function (sh) { if (!found && !(sh.ownerNode && /darkreader/i.test(sh.ownerNode.className || ''))) search(sh); });
    if (!found) return null;
    var v = found.trim(), m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
    if (m) v = getComputedStyle(doc.documentElement).getPropertyValue(m[1]).trim() || (m[2] || '');
    return toRGB(v);
  }
  function probeColour(cls) {
    var s = el('span', cls), plain = el('span');
    s.style.cssText = plain.style.cssText = 'position:absolute;left:-9999px;top:0;animation:none';
    body.appendChild(s); body.appendChild(plain);
    var a = getComputedStyle(s).color, b = getComputedStyle(plain).color;
    body.removeChild(s); body.removeChild(plain);
    return a !== b ? toRGB(a) : null;
  }
  function partyRGB(cls) {
    if (!cls || cls === 'none') return NEUTRAL;
    if (!rgbOf[cls]) {
      var c = ruleColour(cls) || probeColour(cls);
      if (!c) return NEUTRAL;   /* not cached, so a later call can still find the real colour */
      rgbOf[cls] = c;
    }
    return rgbOf[cls];
  }
  function rgb(c, a) { return a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')'; }
  function shade(c, k) {
    var to = k < 0 ? [255, 255, 255] : [6, 3, 12], a = Math.min(1, Math.abs(k));
    return rgb(c.map(function (v, i) { return Math.round(v + (to[i] - v) * a); }));
  }
  function tierOf(margin) { var t = 0; while (t < TIERS.length && margin >= TIERS[t]) t++; return t; }
  function tierLabels() {
    var out = ['< ' + TIERS[0]];
    for (var i = 1; i < TIERS.length; i++) out.push(TIERS[i - 1] + '–' + TIERS[i]);
    out.push(TIERS[TIERS.length - 1] + '+');
    return out;
  }

  /* ================================================================
     THE RESULTS TABLE: <table class="results" id="…">
       <thead><tr><th>District</th>
         <th class="cand" data-image="apollos" data-party="pv">Apollos</th><th>%</th> … </tr></thead>
       <tbody><tr data-district="main" data-note="…"><td>Main</td><td class="v">142</td><td>56.3%</td> … </tr>
     Vote cells are td.v, in the same order as the th.cand candidates.
     ================================================================ */
  function readResults(table) {
    var cands = Array.prototype.map.call(table.querySelectorAll('thead th.cand'), function (th) {
      return { name: th.textContent.trim(), image: th.getAttribute('data-image'), party: th.getAttribute('data-party') };
    });
    var rows = [], byKey = {};
    each(table.querySelectorAll('tbody tr[data-district]'), function (tr) {
      var v = Array.prototype.map.call(tr.querySelectorAll('td.v'), function (td) {
        return parseInt(td.textContent.replace(/[^\d]/g, ''), 10) || 0;
      });
      var total = v.reduce(function (a, b) { return a + b; }, 0);
      var order = v.map(function (x, i) { return i; }).sort(function (a, b) { return v[b] - v[a]; });
      var share = v.map(function (x) { return total ? x / total * 100 : 0; });
      var r = {
        key: tr.getAttribute('data-district'),
        name: (tr.cells[0] ? tr.cells[0].textContent : tr.getAttribute('data-district')).trim(),
        votes: v, share: share, total: total, win: order[0],
        margin: share[order[0]] - (order.length > 1 ? share[order[1]] : 0),
        note: tr.getAttribute('data-note'), tr: tr
      };
      rows.push(r); byKey[r.key] = r;
    });
    return { cands: cands, rows: rows, byKey: byKey };
  }

  function glowNumber(cell, party) {
    if (!cell || !party) return;
    cell.classList.add('pn');
    cell.setAttribute('data-party', party);
  }
  function decorateTable(table, res) {
    each(table.querySelectorAll('thead th.cand'), function (th, i) {
      var c = partyRGB(res.cands[i] && res.cands[i].party);
      th.style.boxShadow = 'inset 0 3px 0 ' + rgb(c);
    });
    /* each candidate's votes (td.v) and the share after them glow in the candidate's colour;
       the margin (td.mg) glows in the colour of whoever it favours: + the first candidate, − the second */
    each(table.querySelectorAll('tbody tr, tfoot tr'), function (tr) {
      each(tr.querySelectorAll('td.v'), function (td, i) {
        var party = res.cands[i] && res.cands[i].party;
        glowNumber(td, party);
        var next = td.nextElementSibling;
        if (next && !next.classList.contains('v') && !next.classList.contains('mg')) glowNumber(next, party);
      });
      var mg = tr.querySelector('td.mg'), text = mg ? mg.textContent.trim() : '';
      if (mg && /^[+]/.test(text) && res.cands[0]) glowNumber(mg, res.cands[0].party);
      if (mg && /^[−-]/.test(text) && res.cands[1]) glowNumber(mg, res.cands[1].party);
    });
    res.rows.forEach(function (r) {
      var cells = r.tr.querySelectorAll('td.v'), cell = cells[r.win];
      if (!cell || !r.total) return;
      var tint = rgb(partyRGB(res.cands[r.win].party), 0.17);
      cell.classList.add('ez-win'); cell.style.background = tint;
      var next = cell.nextElementSibling;
      if (next && !next.classList.contains('v')) { next.classList.add('ez-win'); next.style.background = tint; }
    });
  }

  /* ================================================================
     THE HOVER CARD: one card for the whole page, filled per district.
     ================================================================ */
  var card = null, cardFor = null;
  function cardEl() {
    if (!card) {
      card = el('div', 'ez-card');
      card.setAttribute('role', 'tooltip');
      card.setAttribute('aria-hidden', 'true');
      body.appendChild(card);
    }
    return card;
  }
  function buildCard(res, r) {
    var c = el('div', 'ez-c');
    c.appendChild(el('div', 'ez-c-head',
      '<div><span class="ez-c-kick">District</span><span class="ez-c-name">' + esc(r.name) + '</span></div>' +
      '<span class="ez-c-total">' + num(r.total) + ' votes</span>'));
    res.cands.forEach(function (cand, i) {
      var won = i === r.win && r.total > 0;
      var row = el('div', 'ez-c-row' + (won ? ' win' : ''));
      row.setAttribute('data-party', cand.party || 'none');
      var pic = el('span', 'ez-c-pic', '<img alt=""><b aria-hidden="true"></b>');
      pic.querySelector('b').textContent = cand.name.charAt(0).toUpperCase();
      picture(pic.querySelector('img'), cand.image, pic, 'm');
      var info = el('span', 'ez-c-info');
      var top = el('span', 'ez-c-top');
      var nm = el('b', cand.party && cand.party !== 'none' ? cand.party : '');
      nm.textContent = cand.name;
      top.appendChild(nm);
      if (won) top.appendChild(el('span', 'ez-c-tag', 'Carried'));
      top.appendChild(el('em', 'pn', num(r.votes[i])));
      info.appendChild(top);
      info.appendChild(el('span', 'ez-c-bar', '<i style="width:' + r.share[i].toFixed(2) + '%"></i>'));
      info.appendChild(el('span', 'ez-c-sub', '<span>' + (won ? 'Winner' : '&nbsp;') + '</span><strong class="pn">' + pct(r.share[i]) + '</strong>'));
      row.appendChild(pic); row.appendChild(info);
      c.appendChild(row);
    });
    var winner = res.cands[r.win] || {};
    var foot = '<b>' + esc(winner.name || '') + '</b> <b class="pn" data-party="' + esc(winner.party || 'none') + '">+' +
      r.margin.toFixed(1) + '</b> points';
    if (r.note) foot += ' · ' + esc(r.note);
    c.appendChild(el('div', 'ez-c-foot', foot));
    return c;
  }
  function showCard(res, r, x, y) {
    var k = cardEl();
    if (cardFor !== r) {
      if (!r.card) r.card = buildCard(res, r);
      k.innerHTML = '';
      k.appendChild(r.card);
      cardFor = r;
    }
    placeCard(x, y);
    k.classList.add('on');
  }
  function placeCard(x, y) {
    var k = cardEl();
    var w = k.offsetWidth, h = k.offsetHeight;
    var vw = doc.documentElement.clientWidth, vh = window.innerHeight;
    var left = x + 18, top = y + 18;
    if (left + w > vw - 8) left = x - 18 - w;
    if (top + h > vh - 8) top = y - 18 - h;
    k.style.left = Math.max(8, Math.min(left, vw - w - 8)) + 'px';
    k.style.top = Math.max(8, Math.min(top, vh - h - 8)) + 'px';
  }
  function hideCard() { if (card) card.classList.remove('on'); }

  /* ================================================================
     THE MAP: <figure class="election-map" id="…" data-results="table id"
                      data-plate="Line one|Line two">
       <svg viewBox="0 0 840 520">
         <g class="depth"><path …/>…</g>     (rings out at sea, decoration)
         <path class="coast" d="…"/>          (the outline of all the land)
         <g class="districts"><path data-district="main" data-x="409" data-y="275" d="…"/>…</g>
       </svg>
       <figcaption>…</figcaption></figure>
     data-x/data-y are where a district's label goes. A small copy elsewhere:
     <figure class="election-map mini" data-from="#map-id"> on the same page, or
     data-from="Other_page.html#map-id" for a map drawn on another page.
     ================================================================ */
  var maps = 0;
  function renderMap(fig, source, res, opt) {
    opt = opt || {};
    var id = 'ez' + (++maps);
    var svg = source.cloneNode(true);
    var vb = (svg.getAttribute('viewBox') || '0 0 840 520').split(/[\s,]+/).map(Number);
    var W = vb[2], H = vb[3];
    var depth = svg.querySelector('.depth'), coast = svg.querySelector('.coast'), shapes = svg.querySelector('.districts');
    if (!shapes) return;
    var label = svg.getAttribute('aria-label');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('viewBox', vb.join(' '));
    svg.setAttribute('class', 'ez-svg');
    svg.setAttribute('role', 'group');
    if (label) svg.setAttribute('aria-label', label);
    var coastD = coast ? coast.getAttribute('d') : '';

    var defs = sv('defs', null, svg);
    defs.innerHTML =
      '<radialGradient id="' + id + '-sea" cx="48%" cy="46%" r="72%">' +
        '<stop offset="0" stop-color="#1c0f2e"/><stop offset=".55" stop-color="#0e0619"/><stop offset="1" stop-color="#050209"/></radialGradient>' +
      '<pattern id="' + id + '-grid" width="28" height="28" patternUnits="userSpaceOnUse">' +
        '<path d="M28 0H0V28" fill="none" stroke="rgba(195,162,255,.065)" stroke-width="1"/></pattern>' +
      '<filter id="' + id + '-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<linearGradient id="' + id + '-sweep" x1="0" x2="1" y1="0" y2="0">' +
        '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity=".06"/>' +
        '<stop offset=".97" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>' +
      '<clipPath id="' + id + '-land"><path d="' + esc(coastD) + '"/></clipPath>';

    sv('rect', { 'class': 'ez-sea', width: W, height: H, fill: 'url(#' + id + '-sea)' }, svg);
    sv('rect', { 'class': 'ez-grid', width: W, height: H, fill: 'url(#' + id + '-grid)' }, svg);
    if (depth) { depth.setAttribute('class', 'ez-depth'); svg.appendChild(depth); }
    if (coastD) sv('path', { 'class': 'ez-halo', d: coastD, filter: 'url(#' + id + '-blur)' }, svg);

    var group = sv('g', { 'class': 'ez-districts' }, svg);
    var labels = sv('g', { 'class': 'ez-labels', 'aria-hidden': 'true' });
    var paths = {};
    each(Array.prototype.slice.call(shapes.querySelectorAll('path[data-district]')), function (p) {
      var key = p.getAttribute('data-district'), r = res.byKey[key];
      var path = sv('path', { 'class': 'ez-d', d: p.getAttribute('d'), 'data-district': key }, group);
      var x = +p.getAttribute('data-x'), y = +p.getAttribute('data-y');
      if (!r || !r.total) { path.setAttribute('fill', '#2a1a3d'); return; }
      var cand = res.cands[r.win], c = partyRGB(cand && cand.party), t = tierOf(r.margin);
      var base = shade(c, SHADE[t]), lit = shade(c, Math.max(-0.72, SHADE[t] - LIFT));
      path.setAttribute('fill', base);
      path._base = base; path._lit = lit; path._r = r;
      paths[key] = path;
      if (!opt.mini) {
        path.setAttribute('tabindex', '0');
        path.setAttribute('role', 'img');
        path.setAttribute('aria-label', r.name + ': ' + res.cands.map(function (cd, i) {
          return cd.name + ' ' + num(r.votes[i]) + ' (' + pct(r.share[i]) + ')';
        }).join(', '));
      }
      if (x || y) {
        var g = sv('g', { 'class': 'ez-lbl', 'data-district': key }, labels);
        var dy = opt.mini ? 0 : -24;
        sv('circle', { 'class': 'ez-ping', cx: x, cy: y + dy, r: opt.mini ? 4 : 3, style: 'animation-delay:' + (-((x * 7 + y * 3) % 2600)) + 'ms' }, g);
        sv('circle', { 'class': 'ez-dot', cx: x, cy: y + dy, r: opt.mini ? 3.2 : 2.6 }, g);
        if (!opt.mini) {
          sv('text', { 'class': 'ez-name', x: x, y: y - 2 }, g).textContent = r.name.toUpperCase();
          sv('text', { 'class': 'ez-pct', x: x, y: y + 14 }, g).textContent = (cand ? cand.name + ' ' : '') + pct(r.share[r.win]);
        }
        path._lbl = g;
      }
    });
    if (coastD) {
      sv('path', { 'class': 'ez-coast', d: coastD }, svg);
      var sweep = sv('g', { 'clip-path': 'url(#' + id + '-land)', 'class': 'ez-sweepclip', 'aria-hidden': 'true' }, svg);
      sv('rect', { 'class': 'ez-sweep', x: -180, y: 0, width: 180, height: H, fill: 'url(#' + id + '-sweep)', style: '--sweep:' + (W + 180) + 'px' }, sweep);
    }
    svg.appendChild(labels);
    if (!opt.mini) chrome(svg, W, H, fig, res);

    /* ---------- hover, tap and keyboard ----------
       With a mouse the card follows the pointer and disappears as soon as it leaves the district
       (or the map). Only a tap on a touch screen pins it; tapping again or anywhere else closes it.
       A keyboard user tabbing to a district sees the card until they tab away. */
    var active = null, pinned = false, lastPointer = 'mouse';
    function on(path) {
      if (active && active !== path) off(active);
      active = path;
      path.classList.add('on');
      path.setAttribute('fill', path._lit);
      group.appendChild(path);
      if (path._lbl) path._lbl.classList.add('on');
      svg.classList.add('dim');
      var tr = path._r.tr;
      if (tr && tr.ownerDocument === doc) tr.classList.add('ez-hl');
    }
    function off(path) {
      path.classList.remove('on');
      path.setAttribute('fill', path._base);
      if (path._lbl) path._lbl.classList.remove('on');
      var tr = path._r.tr;
      if (tr && tr.ownerDocument === doc) tr.classList.remove('ez-hl');
      if (active === path) { active = null; svg.classList.remove('dim'); }
    }
    Object.keys(paths).forEach(function (key) {
      var path = paths[key], r = path._r;
      path.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        pinned = false; on(path); showCard(res, r, e.clientX, e.clientY);
      });
      path.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' || pinned) return;
        placeCard(e.clientX, e.clientY);
      });
      path.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'touch') return;
        pinned = false; off(path); hideCard();
      });
      path.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; });
      /* a press never gives the district keyboard focus, so the card can't be left behind by it */
      path.addEventListener('mousedown', function (e) { e.preventDefault(); });
      path.addEventListener('click', function (e) {
        e.stopPropagation();
        if (lastPointer !== 'touch') return;
        if (pinned && active === path) { pinned = false; off(path); hideCard(); return; }
        pinned = true; on(path); showCard(res, r, e.clientX, e.clientY);
      });
      path.addEventListener('focus', function () {
        on(path);
        var b = path.getBoundingClientRect();
        showCard(res, r, b.left + b.width / 2, b.top + b.height / 2);
      });
      path.addEventListener('blur', function () { off(path); hideCard(); });
      var tr = r.tr;
      if (!opt.mini && tr && tr.ownerDocument === doc) {
        tr.addEventListener('mouseenter', function () { on(path); });
        tr.addEventListener('mouseleave', function () { off(path); });
      }
    });
    svg.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      pinned = false; if (active) off(active); hideCard();
    });
    window.addEventListener('blur', function () { pinned = false; if (active) off(active); hideCard(); });
    doc.addEventListener('click', function () { if (pinned) { pinned = false; if (active) off(active); hideCard(); } });
    window.addEventListener('scroll', function () { if (pinned) { pinned = false; if (active) off(active); hideCard(); } }, { passive: true });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) { pinned = false; off(active); hideCard(); } });

    /* ---------- put it in the figure ---------- */
    var frame = el('div', 'ez-frame');
    frame.appendChild(svg);
    var old = fig.querySelector(':scope > svg');
    if (old) fig.replaceChild(frame, old);
    else fig.insertBefore(frame, fig.querySelector(':scope > figcaption'));
    if (!opt.mini) fig.insertBefore(legend(res), frame.nextSibling);
    fig.classList.add('ez-ready');
  }

  /* the map's furniture: title plate, compass, edge ticks */
  function chrome(svg, W, H, fig, res) {
    var g = sv('g', { 'class': 'ez-chrome', 'aria-hidden': 'true' }, svg);
    var plate = (fig.getAttribute('data-plate') || '').split('|').filter(Boolean);
    var votes = res.rows.reduce(function (a, r) { return a + r.total; }, 0);
    var y = 26;
    if (plate[0]) { sv('text', { 'class': 'ez-p1', x: 18, y: y }, g).textContent = plate[0].toUpperCase(); y += 23; }
    if (plate[1]) { sv('text', { 'class': 'ez-p2', x: 18, y: y }, g).textContent = plate[1].toUpperCase(); y += 18; }
    sv('text', { 'class': 'ez-p3', x: 18, y: y }, g).textContent =
      res.rows.length + ' DISTRICTS  ·  ' + num(votes) + ' VOTES';
    sv('rect', { 'class': 'ez-p-rule', x: 18, y: y + 8, width: 46, height: 2 }, g);
    /* compass */
    var cx = W - 46, cy = 50;
    var k = sv('g', { 'class': 'ez-compass', transform: 'translate(' + cx + ' ' + cy + ')' }, g);
    sv('circle', { r: 24 }, k);
    sv('circle', { r: 17, 'class': 'in' }, k);
    sv('path', { 'class': 'n', d: 'M0 -27 L5 0 L0 4 L-5 0Z' }, k);
    sv('path', { 'class': 's', d: 'M0 27 L5 0 L0 -4 L-5 0Z' }, k);
    sv('path', { 'class': 's', d: 'M27 0 L0 3.5 L-4 0 L0 -3.5Z' }, k);
    sv('path', { 'class': 's', d: 'M-27 0 L0 3.5 L4 0 L0 -3.5Z' }, k);
    sv('text', { x: 0, y: -32 }, k).textContent = 'N';
    /* ticks along the frame */
    var t = '';
    for (var x = 28; x < W; x += 28) t += 'M' + x + ' 0v' + (x % 140 ? 4 : 9) + 'M' + x + ' ' + H + 'v-' + (x % 140 ? 4 : 9);
    for (var yy = 28; yy < H; yy += 28) t += 'M0 ' + yy + 'h' + (yy % 140 ? 4 : 9) + 'M' + W + ' ' + yy + 'h-' + (yy % 140 ? 4 : 9);
    sv('path', { 'class': 'ez-tick', d: t }, g);
  }

  /* the key under a full map: one ramp of shades per candidate */
  function legend(res) {
    var box = el('div', 'ez-legend');
    var key = el('div', 'ez-key');
    key.appendChild(el('span', 'ez-k-h', 'Margin'));
    tierLabels().forEach(function (t) { key.appendChild(el('span', 'ez-k-t', esc(t))); });
    res.cands.forEach(function (cand) {
      var n = el('span', 'ez-k-n');
      var s = el('span', cand.party && cand.party !== 'none' ? cand.party : '');
      s.textContent = cand.name;
      n.appendChild(s);
      key.appendChild(n);
      var c = partyRGB(cand.party);
      SHADE.forEach(function (k) { var i = el('i'); i.style.background = shade(c, k); key.appendChild(i); });
    });
    box.appendChild(key);
    box.appendChild(el('p', 'ez-hint', 'Shade shows the winner’s lead in percentage points. Hover, tap or tab to a district for its count.'));
    return box;
  }

  /* ================================================================
     THE ELECTION INFOBOX: <aside class="infobox election" …>
       <div class="el-cands">
         <div class="el-cand" data-image="apollos" data-party="pv" data-votes="471" data-won>
           <a href="Apollos.html">Apollos</a>
           <dl><dt>Party</dt><dd>…</dd> …</dl>
         </div> …
       </div>
     The rows are matched by position: give every candidate the same rows in the same order.
     ================================================================ */
  function buildCandidates(wrap) {
    var cands = Array.prototype.filter.call(wrap.children, function (c) { return c.classList.contains('el-cand'); });
    var frag = doc.createDocumentFragment();
    if (!cands.length) return frag;
    var grid = el('div', 'el-grid');
    grid.style.setProperty('--n', cands.length);
    var labels = Array.prototype.map.call(cands[0].querySelectorAll('dl > dt'), function (dt) { return dt.innerHTML; });
    var names = cands.map(function (c) { return c.querySelector(':scope > a, :scope > b, :scope > span'); });

    grid.appendChild(el('div', 'lab blank'));
    cands.forEach(function (c, i) {
      var party = c.getAttribute('data-party') || 'none';
      var pic = el('div', 'el-pic', '<div class="el-frame"><img alt=""><div class="fallback" aria-hidden="true"></div><div class="scan" aria-hidden="true"></div></div>');
      pic.setAttribute('data-party', party);
      var nm = names[i] ? names[i].textContent.trim() : '';
      pic.querySelector('img').alt = 'Portrait of ' + nm;
      pic.querySelector('.fallback').textContent = nm.charAt(0).toUpperCase();
      if (c.hasAttribute('data-won')) { pic.classList.add('won'); pic.appendChild(el('span', 'el-won', 'Elected')); }
      picture(pic.querySelector('img'), c.getAttribute('data-image'), pic.querySelector('.el-frame'), 'l');
      grid.appendChild(pic);
    });
    grid.appendChild(el('div', 'lab', 'Nominee'));
    cands.forEach(function (c, i) {
      var cell = el('div', 'val el-nm');
      cell.setAttribute('data-party', c.getAttribute('data-party') || 'none');
      if (names[i]) cell.appendChild(names[i]);
      grid.appendChild(cell);
    });
    labels.forEach(function (lab, row) {
      grid.appendChild(el('div', 'lab', lab));
      cands.forEach(function (c) {
        var dd = c.querySelectorAll('dl > dd')[row], cell = el('div', 'val');
        if (dd) { cell.className += dd.className ? ' ' + dd.className : ''; while (dd.firstChild) cell.appendChild(dd.firstChild); }
        if (cell.classList.contains('big')) glowNumber(cell, c.getAttribute('data-party'));
        grid.appendChild(cell);
      });
    });
    frag.appendChild(grid);

    /* the share of the vote as one bar, with the halfway mark */
    var votes = cands.map(function (c) { return Number(c.getAttribute('data-votes')) || 0; });
    var sum = votes.reduce(function (a, b) { return a + b; }, 0);
    if (sum) {
      var bar = el('div', 'el-bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', 'Share of the vote: ' + cands.map(function (c, i) {
        return (names[i] ? names[i].textContent.trim() : '') + ' ' + pct(votes[i] / sum * 100);
      }).join(', '));
      cands.forEach(function (c, i) {
        var col = partyRGB(c.getAttribute('data-party'));
        var seg = el('i');
        seg.style.width = (votes[i] / sum * 100) + '%';
        seg.style.background = rgb(col);
        seg.style.boxShadow = '0 0 10px ' + rgb(col, 0.55);
        bar.appendChild(seg);
      });
      frag.appendChild(bar);
      if (cands.length === 2) {
        frag.appendChild(el('div', 'el-bar-lbl',
          '<span class="pn" data-party="' + esc(cands[0].getAttribute('data-party') || 'none') + '">' + pct(votes[0] / sum * 100) + '</span>' +
          '<span class="half">50%</span>' +
          '<span class="pn" data-party="' + esc(cands[1].getAttribute('data-party') || 'none') + '">' + pct(votes[1] / sum * 100) + '</span>'));
      }
    }
    return frag;
  }

  each(main.querySelectorAll('aside.infobox.election'), function (box) {
    /* wiki.js gave every infobox a portrait frame; an election box shows its candidates instead */
    var fig = box.querySelector(':scope > .ib-fig');
    if (fig) fig.parentNode.removeChild(fig);
    each(box.querySelectorAll(':scope > .el-cands'), function (wrap) { wrap.parentNode.replaceChild(buildCandidates(wrap), wrap); });
  });

  /* ---------- endorsement panels: <span class="en-pic" data-image="poka" data-name="Poka"></span> ---------- */
  each(main.querySelectorAll('.endorse .en-pic[data-image]'), function (p) {
    p.innerHTML = '<img alt=""><b aria-hidden="true"></b>';
    var name = p.getAttribute('data-name') || '';
    p.querySelector('img').alt = name;
    p.querySelector('b').textContent = name.charAt(0).toUpperCase();
    picture(p.querySelector('img'), p.getAttribute('data-image'), p, 'm');
  });

  /* ---------- draw the maps: full maps first, then copies of them ---------- */
  var drawn = {};
  each(main.querySelectorAll('figure.election-map:not([data-from])'), function (fig) {
    var svg = fig.querySelector(':scope > svg');
    var table = doc.getElementById(fig.getAttribute('data-results'));
    if (!svg || !table) return;
    var res = readResults(table);
    if (fig.id) drawn['#' + fig.id] = { svg: svg.cloneNode(true), res: res };
    decorateTable(table, res);
    renderMap(fig, svg, res, { mini: fig.classList.contains('mini') });
  });
  each(main.querySelectorAll('figure.election-map[data-from]'), function (fig) {
    var from = fig.getAttribute('data-from'), hash = from.indexOf('#');
    if (hash === 0) {
      var src = drawn[from];
      if (src) renderMap(fig, src.svg, src.res, { mini: true });
      return;
    }
    var page = hash > 0 ? from.slice(0, hash) : from, id = hash > 0 ? from.slice(hash + 1) : '';
    fetchDoc(new URL(page, location.href).href).then(function (d) {
      var srcFig = id ? d.getElementById(id) : d.querySelector('figure.election-map:not([data-from])');
      var svg = srcFig && srcFig.querySelector('svg');
      var table = srcFig && d.getElementById(srcFig.getAttribute('data-results'));
      if (!svg || !table) return;
      renderMap(fig, doc.importNode(svg, true), readResults(table), { mini: true });
    }).catch(function () { /* the figure's caption still links to the page */ });
  });
})();
