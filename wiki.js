/* ================================================================
   Ninzard wiki: shared page template. Every page loads this file
   at the end of its <body>. It builds the header and footer, lays
   out the infobox, opening quote, contents box, quote boxes, tables
   and citations, makes party names glow (linking each party's first
   mention to its page), works out ages, and shows page previews when
   you hover a link to another page.
   ================================================================ */
(function () {
  'use strict';

  var SITE = {
    name: '41 52 43 48 49 56 45 53',
    tagline: "the community's encyclopedia",
    footerNote: 'Signal source withheld.',
    /* IMAGE CODES: the page that lists every image code and its link */
    imageCodes: 'Image_codes.html'
  };

  /* LOGO: drawn here rather than loaded as a picture, so it always shows. It sits at the top
     of every page and is the browser-tab icon; its glow is --logo-glow in wiki.css. */
  var LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" aria-hidden="true"><defs><linearGradient id="nz-g" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#523c7b"/><stop offset=".33" stop-color="#623869"/><stop offset=".58" stop-color="#70355d"/><stop offset=".8" stop-color="#7e3350"/><stop offset="1" stop-color="#8b3044"/></linearGradient><clipPath id="nz-c"><circle cx="150" cy="150" r="127"/></clipPath></defs><circle cx="150" cy="150" r="148" fill="url(#nz-g)" stroke="#07040a" stroke-width="4"/><circle cx="150" cy="150" r="141" fill="#1c1a1f"/><g clip-path="url(#nz-c)" fill="url(#nz-g)"><rect x="20" y="24.5" width="260" height="18"/><rect x="20" y="64.5" width="260" height="14"/><rect x="20" y="94.5" width="260" height="17"/><rect x="20" y="127.5" width="260" height="24"/><rect x="20" y="162.5" width="260" height="31"/><rect x="20" y="201.5" width="260" height="39"/><rect x="20" y="243.5" width="260" height="40"/></g><path fill="#d4d3d8" d="M137.5 40.5 67.5 117.5 137.5 194.5ZM162.5 95.5 231.5 169.5 162.5 248.5Z"/><path fill="#fff" d="M137.5 51.5 71.5 122.5 137.5 194.5ZM162.5 105.5 228.5 177.5 162.5 248.5Z"/></svg>';

  /* PICTURE SIZES: Imgur keeps smaller copies of every upload, so a page never has to download a
     full-size file just to show a small portrait. A letter added after the image's ID picks the copy:
     t = 160px, m = 320px, l = 640px, h = 1024px on the longest side, in the same proportions.
     The links in Image_codes.html stay the full-size originals and the uploaded files are never changed;
     if a smaller copy can't be had, the full-size picture is used. Change a letter here to make one
     kind of picture sharper (a later letter) or lighter (an earlier one). */
  var PICTURE_SIZE = {
    gallery: 'm',  /* the portrait tiles on Faces_of_Ninzard.html */
    infobox: 'l',  /* the portrait at the top of an article */
    preview: 'm',  /* the picture in a hover preview card */
    codes: 't',    /* the small pictures on the image codes page */
    article: 'h'   /* a picture placed inside an article with <img data-image="code"> */
  };

  /* PARTY GLOWS: any of these words outside quotes glows in its party's
     colour (colours live in wiki.css). Bare words such as "Original", "Home",
     "Resistance", "Poo", "Liberation" or "Independent" on their own are too
     common to match, so wrap those by hand: <span class="or">Original</span>. */
  var PARTIES = [
    { cls: 'or', terms: ['Original Party', 'Tomato Party', 'Ories', 'Orie', 'Orie Apparatus'] },
    { cls: 'pv', terms: ['Preservation Party', 'Preservates', 'Preservate', 'Preservate Apparatus'] },
    { cls: 'ds', terms: ['Disconic Party', 'Disco Party', 'Disconics', 'Disconic', 'Disco'] },
    { cls: 'al', terms: ['Alienova Party', 'Alienova', 'Revamp Party'] },
    { cls: 'hm', terms: ['Home Party'] },
    { cls: 'rs', terms: ['Resistance Party'] },
    { cls: 'bk', terms: ['Breakout Party', 'Celestial Party', 'Celestials', 'Celestial'] },
    { cls: 'in', terms: ['non-affiliated', 'Non-affiliated', 'unaffiliated', 'Unaffiliated'] },
    { cls: 'ug', terms: ['Unighted Party', 'Unighted', 'Grass Party'] },
    { cls: 'pp', terms: ['Poo Party', 'Poopulists', 'Poopulist'] },
    { cls: 'lb', terms: ['Liberation Party', 'Liberators'] }
  ];

  /* PARTY PAGES: the article about each party. As on Wikipedia, a party is linked the first
     time it is mentioned in an article's text, and again the first time in each infobox; later
     mentions only glow. Where one colour covers two parties (Breakout and the Celestial Party
     formed out of it, Unighted and the Grass Party), the later party's names go to its own page.
     Independents ("in") have no page. Rename a page here if its file is ever renamed. */
  var PARTY_PAGES = {
    or: 'Original_Party.html', pv: 'Preservation_Party.html', ds: 'Disco_Party.html',
    al: 'Alienova_Party.html', hm: 'Home_Party.html', rs: 'Resistance_Party.html',
    bk: 'Breakout_Party.html', ug: 'Unighted_Party.html', pp: 'Poo_Party.html', lb: 'Liberation_Party.html'
  };
  var PARTY_PAGES_BY_NAME = [
    { cls: 'bk', name: /^Celestial/, page: 'Celestial_Party.html' },
    { cls: 'ug', name: /^Grass/, page: 'Grass_Party.html' }
  ];

  var doc = document, body = doc.body;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* start connecting to the picture host straight away, while the image code list is still being read */
  if (!doc.querySelector('link[rel="preconnect"][href="https://i.imgur.com"]')) {
    var pre = doc.createElement('link'); pre.rel = 'preconnect'; pre.href = 'https://i.imgur.com';
    doc.head.appendChild(pre);
  }

  /* ---------- page frame: header, tabs, title, footer ---------- */
  var h1 = body.querySelector('h1');
  var titleHTML = h1 ? h1.innerHTML : doc.title;
  var titleText = h1 ? h1.textContent.trim() : doc.title;
  if (h1) h1.parentNode.removeChild(h1);

  var main = el('main', 'article');
  each(Array.prototype.slice.call(body.childNodes), function (n) {
    if (n.nodeType === 1 && n.tagName === 'SCRIPT') return;
    main.appendChild(n);
  });

  var tab = body.getAttribute('data-tab') || 'Article';
  var edited = body.getAttribute('data-edited');
  var fit = el('div'); fit.id = 'fit';
  var stage = el('div'); stage.id = 'stage';
  stage.innerHTML =
    '<header class="top"><a class="brand" href="index.html" aria-label="Home">' +
      '<span class="logo">' + LOGO + '</span>' +
      '<div><span class="brand-name">' + SITE.name + '</span><span class="brand-sub">' + SITE.tagline + '</span></div></a></header>' +
    '<nav class="tabs" aria-label="Page views"><div><span class="tab on">' + tab + '</span><span class="tab">Talk</span></div>' +
      '<div><span class="tab on">Read</span><span class="tab">View history</span></div></nav>' +
    '<div class="head"><h1 class="title">' + titleHTML + '</h1></div>' +
    '<p class="from">From the <span class="redact" aria-label="redacted"></span>, ' + SITE.tagline + '</p>';
  stage.appendChild(main);
  stage.appendChild(el('footer', 'foot',
    (edited ? '<p>This page was last edited on ' + edited + '.</p>' : '') + '<p>' + SITE.footerNote + '</p>'));
  fit.appendChild(stage);
  body.insertBefore(fit, body.firstChild);

  if (!doc.querySelector('link[rel~="icon"]')) {
    var icon = doc.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml';
    icon.href = 'data:image/svg+xml,' + encodeURIComponent(LOGO.replace(/nz-/g, 'i-'));
    doc.head.appendChild(icon);
  }

  /* ---------- opening quote: <blockquote class="hero" data-label="…"> ---------- */
  each(main.querySelectorAll('blockquote.hero'), function (bq) {
    var sec = el('section', 'hero'); sec.setAttribute('aria-label', 'Quote');
    var label = bq.getAttribute('data-label');
    if (label) { var lab = el('div', 'hero-label', '<i></i>'); lab.appendChild(doc.createTextNode(label)); sec.appendChild(lab); }
    var ps = bq.querySelectorAll(':scope > p:not(.orig)');
    var q = el('blockquote', 'hero-q');
    each(ps, function (p, i) {
      if (i) q.appendChild(doc.createElement('br'));
      while (p.firstChild) q.appendChild(p.firstChild);
    });
    trimBrackets(q);
    q.insertBefore(el('span', 'br o', '「'), q.firstChild).setAttribute('aria-hidden', 'true');
    q.appendChild(el('span', 'br x', '」')).setAttribute('aria-hidden', 'true');
    sec.appendChild(q);
    var by = bq.querySelector(':scope > footer');
    if (by) { var d = el('div', 'hero-by'); while (by.firstChild) d.appendChild(by.firstChild); sec.appendChild(d); }
    var orig = bq.querySelector(':scope > p.orig');
    if (orig) { orig.className = 'hero-orig'; sec.appendChild(orig); }
    bq.parentNode.replaceChild(sec, bq);
  });

  /* remove 「 」 typed at the ends of a quote, so they can be drawn in gold */
  function edgeText(node, last) {
    var w = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT, null), t, found = null;
    while ((t = w.nextNode())) { if (t.nodeValue.trim()) { found = t; if (!last) break; } }
    return found;
  }
  function trimBrackets(node) {
    var a = edgeText(node, false), b = edgeText(node, true), had = [false, false];
    if (a && /^\s*「/.test(a.nodeValue)) { a.nodeValue = a.nodeValue.replace(/^\s*「/, ''); had[0] = true; }
    if (b && /」\s*$/.test(b.nodeValue)) { b.nodeValue = b.nodeValue.replace(/」\s*$/, ''); had[1] = true; }
    return had;
  }

  /* ---------- quote boxes: any other <blockquote> ---------- */
  each(main.querySelectorAll('blockquote'), function (bq) {
    if (bq.classList.contains('hero-q')) return;
    bq.classList.add('qbox');
    each(bq.querySelectorAll(':scope > p'), function (p) {
      var had = trimBrackets(p);
      if (had[0]) p.insertBefore(el('span', 'br o', '「'), p.firstChild).setAttribute('aria-hidden', 'true');
      if (had[1]) p.appendChild(el('span', 'br x', '」')).setAttribute('aria-hidden', 'true');
    });
  });

  /* ---------- infobox: <aside class="infobox" data-image="code" data-caption="…"> ---------- */
  var pendingPortraits = [];
  var ORDINAL = /^\s*(\d+(?:st|nd|rd|th)(?:\s*(?:&|and)\s*\d+(?:st|nd|rd|th))*)\s+/;
  each(main.querySelectorAll('aside.infobox'), function (box) {
    var name = box.getAttribute('data-name') || titleText;
    var image = box.getAttribute('data-image');
    var caption = box.getAttribute('data-caption');
    box.setAttribute('aria-label', name + ' at a glance');

    var top = doc.createDocumentFragment();
    top.appendChild(el('div', 'ib-name')).textContent = name;
    var party = box.getAttribute('data-party'), fig;
    if (party && !image) {
      /* a party's infobox: <aside class="infobox" data-party="pv">. Instead of a portrait it shows
         the party's name on a field of its colour (the colour class is the party's glow class). */
      fig = el('figure', 'ib-fig', '<div class="frame-wrap"><div class="ib-emblem" role="img"><span></span><i aria-hidden="true"></i></div></div>');
      var emb = fig.querySelector('.ib-emblem');
      emb.classList.add(party);
      emb.setAttribute('aria-label', name + ' colours');
      emb.querySelector('span').textContent = name;
      if (caption) fig.appendChild(el('figcaption')).textContent = caption;
      top.appendChild(fig);
    } else {
      fig = el('figure', 'ib-fig',
        '<div class="frame-wrap"><div class="frame"><img alt="" referrerpolicy="no-referrer">' +
        '<div class="scan" aria-hidden="true"></div><div class="fallback" aria-hidden="true"></div></div></div>');
      fig.querySelector('img').alt = 'Portrait of ' + name;
      fig.querySelector('.fallback').textContent = name.charAt(0).toUpperCase();
      if (caption) fig.appendChild(el('figcaption')).textContent = caption;
      top.appendChild(fig);
      pendingPortraits.push([fig.querySelector('img'), image, fig.querySelector('.frame')]);
    }

    each(Array.prototype.slice.call(box.children), function (c) {
      if (c.tagName === 'H3') {
        var head = el('div', 'ib-head');
        while (c.firstChild) head.appendChild(c.firstChild);
        if (!c.classList.contains('plain')) {
          /* a leading ordinal ("10th", "2nd & 4th") stays white; the role name is link-coloured, up to any line break */
          var start = head.firstChild;
          if (start && start.nodeType === 3) {
            var m = start.nodeValue.match(ORDINAL);
            if (m) { head.insertBefore(doc.createTextNode(m[0]), start); start.nodeValue = start.nodeValue.slice(m[0].length); }
          }
          var lk = el('span', 'lk');
          head.insertBefore(lk, start || null);
          while (lk.nextSibling && lk.nextSibling.nodeName !== 'BR') lk.appendChild(lk.nextSibling);
        }
        box.replaceChild(head, c);
      } else if (c.tagName === 'P' && c.classList.contains('term')) {
        var term = el('div', 'ib-in', '<b></b>');
        term.firstChild.textContent = c.getAttribute('data-label') || 'Tenure';
        while (c.firstChild) term.appendChild(c.firstChild);
        box.replaceChild(term, c);
      } else if (c.tagName === 'P' && c.classList.contains('band')) {
        var band = el('div', 'ib-band');
        while (c.firstChild) band.appendChild(c.firstChild);
        box.replaceChild(band, c);
      } else if (c.tagName === 'DL') {
        c.classList.add('ib-rows');
      }
    });
    box.insertBefore(top, box.firstChild);
  });

  /* pictures: try Imgur's smaller copy (see PICTURE SIZES), then the full-size link, then an image
     proxy (asked to shrink it too), then the placeholder letter. `when` is 'first' for the picture
     that matters most on the page, 'now' to load at once, or left out to wait until the reader
     scrolls near the picture. */
  var PX = { t: 160, m: 320, l: 640, h: 1024 };
  function smallerCopy(url, size) {
    var m = PX[size] && url.match(/^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]{7}|[A-Za-z0-9]{5})\.(jpe?g|png)(?:[?#].*)?$/i);
    return m ? 'https://i.imgur.com/' + m[1] + size + '.' + m[2].toLowerCase().replace('jpeg', 'jpg') : null;
  }
  function loadImage(img, url, failTarget, size, when) {
    if (!url) { failTarget.classList.add('fail'); return; }
    var proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, ''));
    if (PX[size]) proxy += '&w=' + PX[size] + '&h=' + PX[size] + '&we';
    var sources = [smallerCopy(url, size), url, proxy].filter(Boolean), tried = 0;
    img.decoding = 'async';
    if (when === 'first') img.setAttribute('fetchpriority', 'high');
    else if (when !== 'now') img.loading = 'lazy';
    img.addEventListener('error', function () {
      tried++;
      if (tried < sources.length) img.src = sources[tried];
      else failTarget.classList.add('fail');
    });
    img.src = sources[0];
  }

  /* ---------- reading other pages of the wiki (for image codes and page previews) ---------- */
  var canFetch = !!(window.fetch && window.DOMParser);
  function fetchPage(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('fetch'); return r.text(); });
  }

  /* ---------- image codes: data-image="spinzle" is looked up in Image_codes.html ---------- */
  function readCodes(root) {
    var map = {};
    each(root.querySelectorAll('table.image-codes tr'), function (tr) {
      var c = tr.querySelectorAll('td'); if (c.length < 2) return;
      var code = c[0].textContent.trim().toLowerCase(), link = c[1].textContent.match(/https?:\/\/\S+/);
      if (code && link) map[code] = link[0];
    });
    return map;
  }
  var codesHere = main.querySelector('table.image-codes') ? readCodes(main) : null;
  var codeList = null;
  function imageCodes() {
    if (!codeList) {
      codeList = codesHere ? Promise.resolve(codesHere)
        : !canFetch ? Promise.resolve({})
        : fetchPage(new URL(SITE.imageCodes, location.href).href)
            .then(function (html) { return readCodes(new DOMParser().parseFromString(html, 'text/html')); })
            .catch(function () { codeList = null; return {}; });
    }
    return codeList;
  }
  function resolveImage(value) {
    if (!value) return Promise.resolve(null);
    if (/^(https?:)?\/\//i.test(value)) return Promise.resolve(value);
    return imageCodes().then(function (map) { return map[value.trim().toLowerCase()] || null; });
  }
  function showImage(img, value, failTarget, size, when) {
    resolveImage(value).then(function (url) { loadImage(img, url, failTarget, size, when); });
  }

  pendingPortraits.forEach(function (p) { showImage(p[0], p[1], p[2], PICTURE_SIZE.infobox, 'first'); });

  /* pictures elsewhere on a page: <img data-image="code" alt="…"> (the gallery tiles on Faces_of_Ninzard.html are these too) */
  each(main.querySelectorAll('img[data-image]'), function (img) {
    if (img.closest('.infobox')) return;
    showImage(img, img.getAttribute('data-image'), img, img.closest('.face-pic') ? PICTURE_SIZE.gallery : PICTURE_SIZE.article);
  });

  /* the image codes page itself: add a small preview of each picture */
  each(main.querySelectorAll('table.image-codes'), function (t) {
    each(t.querySelectorAll('tr'), function (tr) {
      var head = tr.querySelector('th');
      if (head) { tr.appendChild(el('th', null, 'Picture')); return; }
      var c = tr.querySelectorAll('td'); if (c.length < 2) return;
      var cell = el('td', 'code-pic', '<img alt="" referrerpolicy="no-referrer"><span>no picture</span>');
      tr.appendChild(cell);
      showImage(cell.querySelector('img'), c[0].textContent, cell, PICTURE_SIZE.codes);
    });
  });

  /* ---------- succession box: <table class="succession"> ---------- */
  each(main.querySelectorAll('table.succession'), function (t) {
    var box = el('div', 'succ'); box.setAttribute('role', 'table'); box.setAttribute('aria-label', 'Roles held');
    each(t.querySelectorAll('tr'), function (tr) {
      var c = tr.children, row = el('div', 'succ-row'); row.setAttribute('role', 'row');
      var before = el('div', null, '<small>Preceded by</small>'), mid = el('div', 'mid'), after = el('div', null, '<small>Succeeded by</small>');
      while (c[0].firstChild) before.appendChild(c[0].firstChild);
      while (c[1].firstChild) mid.appendChild(c[1].firstChild);
      while (c[2].firstChild) after.appendChild(c[2].firstChild);
      [before, mid, after].forEach(function (d) { d.setAttribute('role', 'cell'); row.appendChild(d); });
      box.appendChild(row);
    });
    t.parentNode.replaceChild(box, t);
  });

  /* ---------- other tables get the framed style ---------- */
  each(main.querySelectorAll('table'), function (t) {
    if (t.parentNode.classList.contains('tbl')) return;
    var wrap = el('div', 'tbl');
    t.parentNode.insertBefore(wrap, t); wrap.appendChild(t);
  });

  /* ---------- navbox: <nav class="navbox" data-title="…"> ---------- */
  each(main.querySelectorAll('nav.navbox[data-title]'), function (nav) {
    nav.setAttribute('aria-label', nav.getAttribute('data-title'));
    nav.insertBefore(el('div', 'navbox-title'), nav.firstChild).textContent = nav.getAttribute('data-title');
  });

  /* ---------- contents box, built from the h2/h3 headings: <nav class="toc"></nav> ---------- */
  each(main.querySelectorAll('nav.toc'), function (slot) {
    var heads = Array.prototype.filter.call(main.querySelectorAll('h2, h3'), function (h) {
      return !h.closest('aside, nav, blockquote, .hc');
    });
    var used = {};
    var html = '<summary>Contents</summary><ol>', open = false;
    heads.forEach(function (h, i) {
      if (!h.id) {
        var base = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 's' + i, id = base, n = 2;
        while (used[id] || doc.getElementById(id)) id = base + '-' + n++;
        h.id = id;
      }
      used[h.id] = true;
      var link = '<a href="#' + h.id + '">' + escapeHTML(h.textContent.trim()) + '</a>';
      if (h.tagName === 'H2') { html += (open ? '</ol></li>' : (i ? '</li>' : '')) + '<li>' + link; open = false; }
      else { html += (open ? '</li>' : '<ol>') + '<li>' + link; open = true; }
    });
    html += (open ? '</li></ol></li>' : (heads.length ? '</li>' : '')) + '</ol>';
    var toc = el('details', 'toc', html); toc.open = true;
    slot.parentNode.replaceChild(toc, slot);
  });
  function escapeHTML(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- citations: <sup class="ref">4</sup> or <sup class="ref">4,5</sup> ---------- */
  each(main.querySelectorAll('sup.ref'), function (sup) {
    if (sup.querySelector('a')) return;
    var nums = sup.textContent.split(/[,\s]+/).filter(Boolean), frag = doc.createDocumentFragment();
    nums.forEach(function (n) { frag.appendChild(el('sup', 'ref', '<a href="#r' + n + '">[' + n + ']</a>')); });
    sup.parentNode.replaceChild(frag, sup);
  });

  /* ---------- live ages: <span data-born="2003-06-12"></span> or data-born="1998" ---------- */
  var now = new Date();
  each(main.querySelectorAll('[data-born]'), function (s) {
    var b = s.getAttribute('data-born').split('-'), y = now.getFullYear() - Number(b[0]);
    if (b.length === 3) {
      var m = now.getMonth() + 1;
      if (m < Number(b[1]) || (m === Number(b[1]) && now.getDate() < Number(b[2]))) y--;
      s.textContent = '(age ' + y + ')';
    } else {
      s.textContent = '(age ' + (y - 1) + '–' + y + ')';
    }
    s.setAttribute('data-age', '');
  });

  /* ---------- party glows ---------- */
  var termClass = {}, terms = [];
  PARTIES.forEach(function (p) { p.terms.forEach(function (t) { termClass[t] = p.cls; terms.push(t); }); });
  terms.sort(function (a, b) { return b.length - a.length; });
  var GLOW = new RegExp('\\b(' + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b');
  /* not inside quotes, links (except the contents box and links to a party's page), or text that already glows */
  var NO_GLOW = 'blockquote, script, style, .no-glow, ' + PARTIES.map(function (p) { return '.' + p.cls; }).join(', ');
  var partyFiles = {};
  Object.keys(PARTY_PAGES).forEach(function (c) { partyFiles[PARTY_PAGES[c].toLowerCase()] = true; });
  PARTY_PAGES_BY_NAME.forEach(function (p) { partyFiles[p.page.toLowerCase()] = true; });
  function partyFile(href) {
    var m = (href || '').match(/^(?:\.\/)?([^\/?#]+\.html?)(?:#.*)?$/i);
    return m && partyFiles[m[1].toLowerCase()] ? m[1] : null;
  }
  function skipGlow(node) {
    var p = node.parentNode;
    if (!p.closest) return true;
    if (p.closest(NO_GLOW)) return true;
    var a = p.closest('a');
    return !!a && !a.closest('.toc, .hc') && !partyFile(a.getAttribute('href'));
  }
  function glow(root) {
    var w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], t;
    while ((t = w.nextNode())) {
      if (GLOW.test(t.nodeValue) && !skipGlow(t)) list.push(t);
    }
    list.forEach(function (node) {
      var parts = node.nodeValue.split(new RegExp(GLOW.source, 'g')), frag = doc.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (!part) return;
        if (i % 2) frag.appendChild(el('span', termClass[part])).textContent = part;
        else frag.appendChild(doc.createTextNode(part));
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  glow(main);

  /* ---------- party links: the first mention of each party links to its page (see PARTY PAGES) ---------- */
  var NO_PARTY_LINK = 'a, h1, h2, h3, h4, h5, h6, blockquote, nav, details, table, .tbl, .succ, .hatnote, .refs, .cats, ' +
    'figcaption, .hero, .ib-name, .ib-head, .ib-band, .ib-in, .ib-emblem, dt, .swatch, .no-link';
  function partyPageFor(span) {
    var text = span.textContent.trim();
    if (!text) return null;
    var cls = span.className.split(/\s+/).filter(function (c) { return PARTY_PAGES[c]; })[0];
    if (!cls) return null;
    for (var i = 0; i < PARTY_PAGES_BY_NAME.length; i++) {
      var p = PARTY_PAGES_BY_NAME[i];
      if (p.cls === cls && p.name.test(text)) return p.page;
    }
    return PARTY_PAGES[cls];
  }
  function thisPage(file) {
    var here = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    return here.toLowerCase() === file.replace(/\.html?$/i, '').toLowerCase();
  }
  /* each infobox links its own first mentions; everything else counts as the article's text */
  function partyRegion(node) {
    var box = node.closest('aside.infobox');
    if (box) return node.closest('dd') ? box : null;
    return main;
  }
  (function linkParties() {
    var regions = [], linked = [];
    function seen(region) {
      var i = regions.indexOf(region);
      if (i < 0) { regions.push(region); linked.push({}); i = regions.length - 1; }
      return linked[i];
    }
    /* links already written by hand count as the first mention */
    each(main.querySelectorAll('a[href]'), function (a) {
      var file = partyFile(a.getAttribute('href'));
      if (!file) return;
      a.classList.add('plink');
      if (a.parentNode.closest && a.parentNode.closest(NO_PARTY_LINK)) return;
      var region = partyRegion(a);
      if (region) seen(region)[file.toLowerCase()] = true;
    });
    var sel = Object.keys(PARTY_PAGES).map(function (c) { return 'span.' + c; }).join(', ');
    each(main.querySelectorAll(sel), function (span) {
      if (span.closest(NO_PARTY_LINK)) return;
      var region = partyRegion(span); if (!region) return;
      var file = partyPageFor(span); if (!file || thisPage(file)) return;
      var done = seen(region);
      if (done[file.toLowerCase()]) return;
      done[file.toLowerCase()] = true;
      var a = doc.createElement('a');
      a.setAttribute('href', file); a.className = 'plink';
      span.parentNode.insertBefore(a, span);
      a.appendChild(span);
    });
  })();

  /* ---------- keep each citation glued to the word before it ---------- */
  each(main.querySelectorAll('sup.ref'), function (sp) {
    var prev = sp.previousSibling;
    if (prev && prev.nodeType === 1 && prev.className === 'nw') { prev.appendChild(sp); return; }
    if (prev && prev.nodeType === 3) {
      var m = prev.textContent.match(/(\S+)$/);
      if (m) {
        prev.textContent = prev.textContent.slice(0, -m[1].length);
        var nw = el('span', 'nw'); nw.textContent = m[1];
        sp.parentNode.insertBefore(nw, sp); nw.appendChild(sp);
      }
    }
  });

  /* ---------- scale the whole page so the layout never changes between phone and desktop ---------- */
  var W = 900;
  function scale() {
    var vw = doc.documentElement.clientWidth || window.innerWidth;
    var s = Math.min(1, vw / W);
    if (s < 1) { stage.style.transform = 'scale(' + s + ')'; stage.style.margin = '0'; }
    else { stage.style.transform = ''; stage.style.margin = '0 auto'; }
    fit.style.height = Math.ceil(stage.offsetHeight * s) + 'px';
  }
  window.addEventListener('resize', scale);
  window.addEventListener('load', scale);
  if ('ResizeObserver' in window) new ResizeObserver(scale).observe(stage);
  scale();

  doc.documentElement.classList.add('wiki-ready');

  /* ================================================================
     PAGE PREVIEWS: hover a link to another page to see its opening
     lines.
     ================================================================ */
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover || !canFetch) return;

  function pathKey(p) { return p.replace(/\.html?$/i, '').replace(/\/index$/, '/'); }
  function wikiURL(a) {
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#' || a.closest('.hc')) return null;
    var u; try { u = new URL(h, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin || !/\.html?$/i.test(u.pathname)) return null;
    if (pathKey(u.pathname) === pathKey(location.pathname)) return null;
    return u.origin + u.pathname;
  }


  function readPreview(html) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    var head = d.querySelector('h1');
    var box = d.querySelector('aside.infobox');
    var role = box && Array.prototype.filter.call(box.querySelectorAll('h3'), function (h) { return !h.classList.contains('plain'); })[0];
    var lead = Array.prototype.filter.call(d.querySelectorAll('p'), function (p) {
      return p.textContent.trim() && !p.closest('aside, blockquote, nav, table, footer, .hatnote, .note, .toc') && !p.classList.contains('note');
    })[0];
    if (!lead) return null;
    var extract = lead.cloneNode(true);
    each(extract.querySelectorAll('sup, script, style'), function (n) { n.parentNode.removeChild(n); });
    each(extract.querySelectorAll('a'), function (a) { while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a); a.parentNode.removeChild(a); });
    each(extract.querySelectorAll('*'), function (n) {
      each(Array.prototype.slice.call(n.attributes), function (at) { if (at.name !== 'class' && at.name !== 'lang') n.removeAttribute(at.name); });
    });
    var name = (box && box.getAttribute('data-name')) || (head ? head.textContent.trim() : d.title);
    return {
      title: head ? head.textContent.trim() : d.title,
      desc: role ? role.textContent.replace(/\s+/g, ' ').trim() : '',
      image: box && box.getAttribute('data-image'),
      letter: (name || '?').charAt(0).toUpperCase(),
      extract: extract.innerHTML
    };
  }

  var cache = {};
  function getPreview(url) {
    if (!cache[url]) {
      cache[url] = fetchPage(url)
        .then(readPreview)
        .catch(function () { delete cache[url]; return null; });
    }
    return cache[url];
  }

  var card = el('div', 'hc', '<a class="hc-link"><div class="hc-text"><div class="hc-title"></div><div class="hc-desc"></div>' +
    '<div class="hc-extract"></div></div><div class="hc-pic"><img alt="" referrerpolicy="no-referrer"><div class="hc-letter" aria-hidden="true"></div></div></a>');
  card.setAttribute('role', 'tooltip');
  body.appendChild(card);

  var target = null, showTimer = 0, hideTimer = 0, mouse = { x: 0, y: 0 };
  function fill(p, url) {
    card.querySelector('.hc-link').href = url;
    card.querySelector('.hc-title').textContent = p.title;
    var desc = card.querySelector('.hc-desc'); desc.textContent = p.desc; desc.style.display = p.desc ? '' : 'none';
    var ex = card.querySelector('.hc-extract'); ex.innerHTML = p.extract; glow(ex);
    var pic = card.querySelector('.hc-pic'), img = pic.querySelector('img');
    pic.classList.remove('fail');
    card.classList.toggle('no-pic', !p.image);
    pic.querySelector('.hc-letter').textContent = p.letter;
    var fresh = img.cloneNode(false); fresh.removeAttribute('src'); img.parentNode.replaceChild(fresh, img);
    if (p.image) showImage(fresh, p.image, pic, PICTURE_SIZE.preview, 'now');
  }
  function place(a) {
    var rects = a.getClientRects(), r = rects[0] || a.getBoundingClientRect();
    for (var i = 0; i < rects.length; i++) if (mouse.y >= rects[i].top - 2 && mouse.y <= rects[i].bottom + 2) { r = rects[i]; break; }
    var w = card.offsetWidth, h = card.offsetHeight, vw = doc.documentElement.clientWidth, vh = window.innerHeight;
    var left = Math.max(8, Math.min(r.left, vw - w - 8)), top = r.bottom + 8;
    if (top + h > vh - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }
  function show(a) {
    var url = wikiURL(a);
    getPreview(url).then(function (p) {
      if (!p || target !== a) return;
      fill(p, url);
      place(a);
      card.classList.add('on');
    });
  }
  function enter(a) {
    clearTimeout(hideTimer);
    if (target === a) return;
    target = a;
    clearTimeout(showTimer);
    if (card.classList.contains('on')) card.classList.remove('on');
    showTimer = setTimeout(function () { show(a); }, 350);
  }
  function leave() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { target = null; card.classList.remove('on'); }, 300);
  }

  doc.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  doc.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && wikiURL(a)) enter(a);
  });
  doc.addEventListener('mouseout', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a !== target || (e.relatedTarget && a.contains(e.relatedTarget))) return;
    leave();
  });
  doc.addEventListener('focusin', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && wikiURL(a)) { mouse.y = -1; enter(a); }
  });
  doc.addEventListener('focusout', function (e) { if (e.target === target) leave(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { target = null; card.classList.remove('on'); } });
  doc.addEventListener('click', function () { clearTimeout(showTimer); target = null; card.classList.remove('on'); });
  window.addEventListener('scroll', function () { if (card.classList.contains('on')) { target = null; card.classList.remove('on'); } }, { passive: true });
  card.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
  card.addEventListener('mouseleave', leave);
})();
