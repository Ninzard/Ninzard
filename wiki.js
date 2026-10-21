/* ================================================================
   Ninzard wiki: shared page template. Every page loads this file
   at the end of its <body>. It builds the header and footer, lays
   out the infobox, opening quote, contents box, quote boxes, tables
   and citations, makes party names glow (linking each party's first
   mention to its page), works out ages, links every Ninzard's name
   to their page with a small portrait, fills shared navboxes, opens
   the Talk chatroom behind every page's Talk tab, picks a random
   page, adds a portal bar to the pages of a portal's members, and shows
   page previews when you hover a link to another page.
   ================================================================ */
(function () {
  'use strict';

  var SITE = {
    name: '41 52 43 48 49 56 45 53',
    tagline: "the community's encyclopedia",
    footerNote: 'Signal source withheld.',
    /* IMAGE CODES: the page that lists every image code and its link */
    imageCodes: 'Image_codes.html',
    /* NAMES: everyone in the gallery, plus the extra names, other names and non-names on the names page */
    gallery: 'Faces_of_Ninzard.html',
    names: 'Names.html',
    /* NAVBOXES: the shared navboxes a page can summon with <nav class="navbox" data-box="…"></nav> */
    navboxes: 'Navboxes.html',
    /* PORTALS: every portal page. A portal lists its members in <ul data-portal-members> (links to
       their pages); each member's page then shows "Portal: <name>" above its categories. See PORTAL BAR. */
    portals: ['Portal_Christianity.html']
  };

  /* LOGO: drawn here rather than loaded as a picture, so it always shows. It sits at the top
     of every page and is the browser-tab icon; its glow is --logo-glow in wiki.css. */
  var LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" aria-hidden="true"><defs><linearGradient id="nz-g" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#523c7b"/><stop offset=".33" stop-color="#623869"/><stop offset=".58" stop-color="#70355d"/><stop offset=".8" stop-color="#7e3350"/><stop offset="1" stop-color="#8b3044"/></linearGradient><clipPath id="nz-c"><circle cx="150" cy="150" r="127"/></clipPath></defs><circle cx="150" cy="150" r="148" fill="url(#nz-g)" stroke="#07040a" stroke-width="4"/><circle cx="150" cy="150" r="141" fill="#1c1a1f"/><g clip-path="url(#nz-c)" fill="url(#nz-g)"><rect x="20" y="24.5" width="260" height="18"/><rect x="20" y="64.5" width="260" height="14"/><rect x="20" y="94.5" width="260" height="17"/><rect x="20" y="127.5" width="260" height="24"/><rect x="20" y="162.5" width="260" height="31"/><rect x="20" y="201.5" width="260" height="39"/><rect x="20" y="243.5" width="260" height="40"/></g><path fill="#d4d3d8" d="M137.5 40.5 67.5 117.5 137.5 194.5ZM162.5 95.5 231.5 169.5 162.5 248.5Z"/><path fill="#fff" d="M137.5 51.5 71.5 122.5 137.5 194.5ZM162.5 105.5 228.5 177.5 162.5 248.5Z"/></svg>';

  /* PICTURE SIZES: a page never downloads a full-size portrait just to show a small one.
     The portraits live on the site itself, in the Images folder of the repository
     (https://ninzard.pages.dev/Images/Portrait_Poka.jpg). Each has smaller copies with the same file name
     in Images/160, Images/320 and Images/640 (the width in pixels); SITE_PICTURES says which letter uses
     which folder. An Imgur link, if one is ever used, gets Imgur's own smaller copy instead.
     The letters: s = tiny, t = 160px, m = 320px, l = 640px, h = large.
     The links in Image_codes.html stay the full-size originals and the uploaded files are never changed;
     if a smaller copy can't be had, the full-size picture is used. Change a letter here to make one
     kind of picture sharper (a later letter) or lighter (an earlier one). */
  var PICTURE_SIZE = {
    gallery: 'm',  /* the portrait tiles on Faces_of_Ninzard.html */
    infobox: 'l',  /* the portrait at the top of an article */
    preview: 'm',  /* the picture in a hover preview card */
    codes: 't',    /* the small pictures on the image codes page */
    article: 'h',  /* a picture placed inside an article with <img data-image="code"> */
    talk: 't',     /* the round portraits beside messages in a Talk chatroom */
    name: 's'      /* the tiny round portrait before every Ninzard's name */
  };
  /* SITE PICTURES: the folder of the smaller copies for each letter, and the site's address (a link to it
     is read from whatever address the reader is using). These pictures never go through the outside
     image proxy: they are private behind Cloudflare Access, like the pages. */
  var SITE_PICTURES = {
    folder: 'Images/',
    sizes: { s: '160', t: '160', m: '320', l: '640', h: '640' },
    hosts: ['ninzard.pages.dev']
  };

  /* PARTY GLOWS: any of these words outside quotes glows in its party's
     colour (colours live in wiki.css). Bare words such as "Original", "Home",
     "Resistance", "Poo", "Liberation" or "Independent" on their own are too
     common to match, so wrap those by hand: <span class="or">Original</span>. */
  var PARTIES = [
    { cls: 'or', terms: ['Original Party', 'Tomato Party', 'Ories', 'Orie'] },
    { cls: 'pv', terms: ['Preservation Party', 'Preservates', 'Preservate'] },
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

  /* TALK FILES: the chat behind a page's Talk tab lives in a file of its own, named with this
     prefix and the page's file name: Talk_Liver.html for Liver.html, Talk_index.html for the
     main page. See TALK below. */
  var TALK_PREFIX = 'Talk_';

  /* ONLINE: the "N Ninzards here" count in a talk room is not real: it drifts up and down at random
     within a believable range, every few seconds, and is far lower on Sundays (Pacific time).
     Change the ranges here. */
  var ONLINE = { weekday: [26, 84], sunday: [2, 9], every: [6000, 14000] };

  var doc = document, body = doc.body;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* this page's file name without .html ("Liver"; "index" for the main page). Cloudflare drops
     .html from addresses, so /Liver and /Liver.html both give "Liver". */
  var PAGE_KEY = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.html?$/i, '') || 'index';

  /* a talk file opened directly sends the reader to its page, with the Talk tab open */
  if (PAGE_KEY.indexOf(TALK_PREFIX) === 0 && body.querySelector('.chat')) {
    location.replace(PAGE_KEY.slice(TALK_PREFIX.length) + '.html#talk');
    return;
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
  /* every page has a working Talk tab except the "Page not found" page (data-tab="Special page");
     data-no-talk on a page's <body> switches it off for that page too */
  var talkOn = tab !== 'Special page' && !body.hasAttribute('data-no-talk');
  var fit = el('div'); fit.id = 'fit';
  var stage = el('div'); stage.id = 'stage';
  stage.innerHTML =
    '<header class="top"><a class="brand" href="index.html" aria-label="Home">' +
      '<span class="logo">' + LOGO + '</span>' +
      '<div><span class="brand-name">' + SITE.name + '</span><span class="brand-sub">' + SITE.tagline + '</span></div></a></header>' +
    '<nav class="tabs" aria-label="Page views"><div>' +
      (talkOn
        ? '<a class="tab on" href="#" data-view="article">' + tab + '</a>' +
          '<a class="tab" href="#talk" data-view="talk">Talk<span class="tab-count" hidden></span></a>'
        : '<span class="tab on">' + tab + '</span><span class="tab">Talk</span>') +
      '</div><div><span class="tab on">Read</span><a class="tab" href="#random" data-view="random">Random page</a></div></nav>' +
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
          /* a leading ordinal ("10th", "2nd & 4th") stays white; the office name is link-coloured, up to any line break */
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
        term.firstChild.textContent = c.getAttribute('data-label') || 'In office';
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

  /* pictures: try the smaller copy (see PICTURE SIZES), then the full-size link, then (for pictures
     hosted elsewhere) an image proxy asked to shrink it too, then the placeholder letter. `when` is
     'first' for the picture that matters most on the page, 'now' to load at once, or left out to wait
     until the reader scrolls near the picture. */
  var PX = { s: 90, t: 160, m: 320, l: 640, h: 1024 };
  /* a picture kept on this site: its full-size address (on the address the reader is using) and file name */
  function sitePicture(url) {
    var u; try { u = new URL(url, location.href); } catch (e) { return null; }
    if (u.host !== location.host && SITE_PICTURES.hosts.indexOf(u.hostname) < 0) return null;
    var file = u.pathname.split('/').pop();
    if (!/\.(jpe?g|png|webp)$/i.test(file)) return null;
    return { full: new URL(u.pathname, location.href).href, file: file };
  }
  function smallerCopy(url, size) {
    var site = sitePicture(url), folder = SITE_PICTURES.sizes[size];
    if (site) return folder ? new URL('/' + SITE_PICTURES.folder + folder + '/' + site.file, location.href).href : null;
    var m = PX[size] && url.match(/^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]{7}|[A-Za-z0-9]{5})\.(jpe?g|png)(?:[?#].*)?$/i);
    return m ? 'https://i.imgur.com/' + m[1] + size + '.' + m[2].toLowerCase().replace('jpeg', 'jpg') : null;
  }
  function loadImage(img, url, failTarget, size, when) {
    if (!url) { failTarget.classList.add('fail'); return; }
    var site = sitePicture(url);
    var proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, ''));
    if (PX[size]) proxy += '&w=' + PX[size] + '&h=' + PX[size] + '&we';
    var sources = (site ? [smallerCopy(url, size), site.full] : [smallerCopy(url, size), url, proxy]).filter(Boolean), tried = 0;
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

  /* ---------- reading other pages of the wiki (for image codes, page previews and talk files) ---------- */
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
    var box = el('div', 'succ'); box.setAttribute('role', 'table'); box.setAttribute('aria-label', 'Offices held');
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

  /* ================================================================
     NAMES: every mention of a Ninzard links to their page by itself,
     glowing softly, with a tiny round portrait before the name. Nobody
     writes these links by hand. The names come from two pages:
       Faces_of_Ninzard.html  every gallery tile (name, page, image code)
       Names.html             <ul class="names">: Ninzards without a portrait,
                              and other names for someone (Cat → Catx3.html):
                              <li data-page="Catx3.html">Cat</li>
                              (data-image="code" sets a portrait if needed);
                              <ul class="not-names">: phrases that contain a
                              name but aren't about the person (Cat Files).
     Names are matched exactly, capitals included, as whole words. They are
     linked in the text, infoboxes, tables, navboxes, succession boxes, quote
     attributions and dialogue speakers, but not inside quoted words, headings,
     the contents box, hatnotes, references or categories, and a page never
     links its own subject. Links written by hand to a person's page get the
     same portrait and glow.
     ================================================================ */
  function nameKey(s) { return String(s || '').trim().toLowerCase().replace(/[\s_]+/g, ' '); }
  function pageFor(name) { return name.trim().replace(/\s+/g, '_') + '.html'; }
  function fileOf(href) { var m = (href || '').match(/^(?:\.\/|\/)?([^\/?#]+?)(?:\.html?)?(?:[?#].*)?$/i); return m ? m[1].toLowerCase() : ''; }
  function readDoc(page) {
    return fetchPage(new URL(page, location.href).href)
      .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); })
      .catch(function () { return null; });
  }
  var registry = null;
  function nameRegistry() {
    if (!registry) {
      registry = !canFetch ? Promise.resolve(null) : Promise.all([readDoc(SITE.gallery), readDoc(SITE.names)]).then(function (docs) {
        var reg = { list: [], by: {}, page: {}, not: [], random: [] };
        function add(name, page, code) {
          name = (name || '').replace(/\s+/g, ' ').trim();
          if (!name || reg.by[name]) return;
          var e = { name: name, page: page || pageFor(name), code: code || '' };
          reg.by[name] = e; reg.list.push(e);
          if (!reg.page[fileOf(e.page)]) reg.page[fileOf(e.page)] = e;
        }
        if (docs[0]) each(docs[0].querySelectorAll('.faces .face'), function (f) {
          var n = f.querySelector('.face-name'), img = f.querySelector('img[data-image]');
          if (!n) return;
          add(n.textContent, f.getAttribute('href'), img && img.getAttribute('data-image'));
          if (f.getAttribute('href')) reg.random.push(f.getAttribute('href'));
        });
        if (docs[1]) {
          each(docs[1].querySelectorAll('ul.names > li'), function (li) {
            add(li.textContent, li.getAttribute('data-page'), li.getAttribute('data-image'));
          });
          each(docs[1].querySelectorAll('ul.not-names > li'), function (li) {
            var t = li.textContent.replace(/\s+/g, ' ').trim(); if (t) reg.not.push(t);
          });
        }
        /* another name for someone shares their portrait */
        reg.list.forEach(function (e) { if (!e.code) { var o = reg.page[fileOf(e.page)]; if (o && o.code) e.code = o.code; } });
        return reg;
      });
    }
    return registry;
  }

  /* the tiny portrait: the person's image code, else their name as a code, else their first letter */
  function namePortrait(pic, e) {
    var base = nameKey(e.name), tries = e.code ? [e.code.trim().toLowerCase()] : [];
    tries.push(base.replace(/[^a-z0-9]+/g, ''), base.replace(/[^a-z0-9]+/g, '_'));
    imageCodes().then(function (map) {
      var url = null;
      for (var i = 0; i < tries.length && !url; i++) url = map[tries[i]] || null;
      loadImage(pic.querySelector('img'), url, pic, PICTURE_SIZE.name);
    });
  }
  function nameLink(e, a) {
    a = a || el('a');
    if (!a.getAttribute('href')) a.setAttribute('href', e.page);
    a.classList.add('nm');
    var label = el('span', 'nm-t');
    if (a.firstChild) { while (a.firstChild) label.appendChild(a.firstChild); } else label.textContent = e.name;
    var pic = el('span', 'nm-pic', '<img alt="" referrerpolicy="no-referrer"><b></b>');
    pic.setAttribute('aria-hidden', 'true');
    pic.lastChild.textContent = e.name.charAt(0).toUpperCase();
    a.appendChild(pic); a.appendChild(label);
    namePortrait(pic, e);
    return a;
  }

  var NO_NAME = 'h1, h2, h3, h4, h5, h6, .toc, .hatnote, .refs, .cats, .note, figcaption, dt, .ib-name, .ib-head, .ib-in, .ib-band, ' +
    '.navbox-title, li.self, code, pre, script, style, .faces, table.image-codes, .el-cands, .endorse, table.results, .election-map, ' +
    '.share-chart, .swatch, .nm, .no-name, ' + PARTIES.map(function (p) { return '.' + p.cls; }).join(', ');
  /* quoted words stay as they were; a quote's attribution and a dialogue's speakers do not */
  function quoted(node) {
    return !!node.closest('blockquote') && !node.closest('footer, .hero-by, .dialogue p > b:first-child');
  }
  function linkNames(root, reg) {
    if (!reg || !reg.list.length) return;
    var self = function (e) { return thisPage(e.page) || e.name === titleText; };
    /* links already written by hand to a person's page */
    each(root.querySelectorAll('a[href]'), function (a) {
      if (a.closest(NO_NAME) || quoted(a)) return;
      var e = reg.page[fileOf(a.getAttribute('href'))];
      if (e && !self(e) && !/^[a-z]+:/i.test(a.getAttribute('href'))) nameLink(e, a);
    });
    var names = reg.list.filter(function (e) { return !self(e); }).map(function (e) { return e.name; });
    if (!names.length) return;
    names.sort(function (a, b) { return b.length - a.length; });
    var RX = new RegExp('(^|[^A-Za-z0-9_@])(' + names.map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![A-Za-z0-9_])', 'g');
    var w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], t;
    while ((t = w.nextNode())) {
      var p = t.parentNode;
      if (!p.closest || p.closest('a') || p.closest(NO_NAME) || quoted(p)) continue;
      RX.lastIndex = 0;
      if (RX.test(t.nodeValue)) list.push(t);
    }
    list.forEach(function (node) {
      var s = node.nodeValue, blocked = [], frag = doc.createDocumentFragment(), last = 0, m;
      reg.not.forEach(function (phrase) {
        for (var i = s.indexOf(phrase); i >= 0; i = s.indexOf(phrase, i + 1)) blocked.push([i, i + phrase.length]);
      });
      RX.lastIndex = 0;
      while ((m = RX.exec(s))) {
        var start = m.index + m[1].length, end = start + m[2].length;
        if (blocked.some(function (r) { return start < r[1] && end > r[0]; })) continue;
        if (start > last) frag.appendChild(doc.createTextNode(s.slice(last, start)));
        frag.appendChild(nameLink(reg.by[m[2]]));
        last = end;
      }
      if (!last) return;
      if (last < s.length) frag.appendChild(doc.createTextNode(s.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------- shared navboxes: <nav class="navbox" data-box="Four RadicaLs"></nav> ----------
     The box with that data-title is copied from Navboxes.html, and this page's own entry is marked. */
  var boxSlots = main.querySelectorAll('nav.navbox[data-box]');
  var navboxesReady = !boxSlots.length ? Promise.resolve() : readDoc(SITE.navboxes).then(function (d) {
    each(boxSlots, function (slot) {
      var want = slot.getAttribute('data-box').replace(/\s+/g, ' ').trim(), src = null;
      if (d) each(d.querySelectorAll('nav.navbox[data-title]'), function (n) {
        if (!src && n.getAttribute('data-title').replace(/\s+/g, ' ').trim() === want) src = n;
      });
      if (!src || !src.querySelector('ol')) { slot.parentNode.removeChild(slot); return; }
      var ol = doc.importNode(src.querySelector('ol'), true);
      each(ol.querySelectorAll('li'), function (li) {
        var a = li.querySelector('a');
        if (li.textContent.trim() === titleText || (a && thisPage(a.getAttribute('href') || ''))) { li.className = 'self'; li.textContent = li.textContent.trim(); }
      });
      slot.setAttribute('aria-label', want);
      slot.appendChild(el('div', 'navbox-title')).textContent = want;
      slot.appendChild(ol);
    });
  });

  /* names are linked once the shared navboxes are in place */
  Promise.all([nameRegistry(), navboxesReady]).then(function (r) { linkNames(main, r[0]); });

  /* ---------- PORTAL BAR: "Portal: Christianity" above the categories of every member's page ----------
     Only the pages of Ninzards (people in the gallery or Names.html) look, and only when the
     portal lists them among its members (<ul data-portal-members> on the portal page). The bar
     carries a small copy of the portal's emblem (the element marked data-portal-icon) and the
     portal's name (its <h1> without "Portal:"). It sits just above the categories, as on Wikipedia. */
  function portalBar(reg) {
    if (!reg || !SITE.portals || !SITE.portals.length) return;
    if (/^portal_/i.test(PAGE_KEY) || tab === 'Special page' || !reg.page[PAGE_KEY.toLowerCase()]) return;
    Promise.all(SITE.portals.map(function (page, n) {
      return readDoc(page).then(function (d) {
        if (!d) return null;
        var member = Array.prototype.some.call(d.querySelectorAll('[data-portal-members] a[href]'), function (a) {
          return thisPage(a.getAttribute('href') || '');
        });
        if (!member) return null;
        var h = d.querySelector('h1');
        var name = h ? h.textContent.replace(/^\s*Portal\s*:\s*/i, '').trim() : page.replace(/^Portal_|\.html?$/gi, '').replace(/_/g, ' ');
        var icon = d.querySelector('[data-portal-icon] svg');
        /* the emblem's ids are prefixed so two emblems on one page never share them */
        var svg = icon ? icon.outerHTML.replace(/\bid="([^"]+)"/g, 'id="pb' + n + '-$1"').replace(/url\(#([^)]+)\)/g, 'url(#pb' + n + '-$1)') : '';
        return { page: page, name: name, svg: svg };
      });
    })).then(function (list) {
      list = list.filter(Boolean);
      if (!list.length) return;
      var bar = el('nav', 'portal-bar');
      bar.setAttribute('aria-label', list.length > 1 ? 'Portals' : 'Portal');
      bar.appendChild(el('span', 'pb-k')).textContent = list.length > 1 ? 'Portals' : 'Portal';
      list.forEach(function (p) {
        var a = el('a', 'pb-link'); a.setAttribute('href', p.page);
        var ic = el('span', 'pb-ic', p.svg); ic.setAttribute('aria-hidden', 'true');
        var svg = ic.querySelector('svg');
        if (svg) { svg.removeAttribute('role'); svg.removeAttribute('aria-label'); svg.setAttribute('focusable', 'false'); }
        else ic.textContent = p.name.charAt(0);
        a.appendChild(ic);
        a.appendChild(el('span', 'pb-t')).textContent = p.name;
        bar.appendChild(a);
      });
      var cats = main.querySelector('.cats');
      if (cats) cats.parentNode.insertBefore(bar, cats); else main.appendChild(bar);
    });
  }
  nameRegistry().then(portalBar);

  /* ---------- the Random page tab: a random Ninzard from the gallery ---------- */
  var tabRandom = stage.querySelector('.tabs [data-view="random"]');
  tabRandom.addEventListener('click', function (e) {
    e.preventDefault();
    nameRegistry().then(function (reg) {
      var pages = (reg ? reg.random : []).filter(function (h) { return !thisPage(h); });
      location.href = pages.length ? pages[Math.floor(Math.random() * pages.length)] : 'index.html';
    });
  });

  /* ================================================================
     TALK: the Talk tab on every page opens a chatroom of what Ninzards
     have said about the page, laid out like a Discord channel. Nothing
     goes into the article: the messages live in Talk_<Page>.html
     (Talk_Liver.html for Liver.html), read from the site when the page
     opens. A page without a talk file opens an empty room. The Talk tab's
     address is the page's own with #talk on the end (Liver#talk).

     A talk file is a short page whose <ol class="chat"> holds one <li>
     per message, in order:
       <li data-who="PluPlu" data-time="2:14 AM" data-party="pv">text</li>
         data-who    who said it (their portrait comes from their image code,
                     and their name links to their page)
         data-time   the time shown beside the name (any text)
         data-party  optional: the name is shown in that party's colour (or, pv, …)
         data-image  optional: an image code, when it isn't the name's own code
         data-reply  optional: "Name|the words being replied to"
         data-react  optional: reactions, split by | ("😭 9|💎 3")
       <li class="day">October 17, 2026</li>   a date divider
       <li class="sys">text</li>               a notice (joins, pins)
     An optional <p class="topic"> becomes the channel's topic. In a message,
     @Name becomes a mention that links to Name.html (write @Al_Commando for
     two-word names); a message that mentions the page's subject is highlighted.
     ================================================================ */
  var titleEl = stage.querySelector('.title');
  var tabArticle = stage.querySelector('.tabs [data-view="article"]');
  var tabTalk = stage.querySelector('.tabs [data-view="talk"]');
  var baseTitle = doc.title;
  var talkSec = null, talkData = null;
  var channel = (PAGE_KEY === 'index' ? 'main page' : PAGE_KEY).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* read the talk file once; resolves to its .chat list, or null when the page has none */
  function readTalk() {
    if (!talkData) {
      talkData = !canFetch ? Promise.resolve(null)
        : fetchPage(new URL(TALK_PREFIX + PAGE_KEY + '.html', location.href).href)
            .then(function (html) {
              var d = new DOMParser().parseFromString(html, 'text/html'), list = d.querySelector('.chat');
              if (!list) return null;
              var topic = d.querySelector('.topic');
              return { list: list, topic: topic ? topic.innerHTML : '', count: list.querySelectorAll('li[data-who]').length };
            })
            .catch(function () { return null; });
    }
    return talkData;
  }

  /* a round portrait: the message's data-image, else the name as an image code
     (PluPlu → pluplu; Al Commando → alcommando or al_commando), else its first letter */
  function talkPortrait(pic, who, code) {
    var base = nameKey(who), tries = code ? [code.trim().toLowerCase()] : [];
    tries.push(base.replace(/[^a-z0-9]+/g, ''), base.replace(/[^a-z0-9]+/g, '_'));
    imageCodes().then(function (map) {
      var url = null;
      for (var i = 0; i < tries.length && !url; i++) url = map[tries[i]] || null;
      loadImage(pic.querySelector('img'), url, pic, PICTURE_SIZE.talk, 'now');
    });
  }

  /* @Name → a mention; a mention of the page's subject (or @everyone) highlights its message */
  function mentions(text) {
    var w = doc.createTreeWalker(text, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) if (/@[A-Za-z0-9_]/.test(n.nodeValue) && !n.parentNode.closest('a')) list.push(n);
    list.forEach(function (node) {
      var parts = node.nodeValue.split(/@([A-Za-z0-9_]+)/), frag = doc.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (!(i % 2)) { if (p) frag.appendChild(doc.createTextNode(p)); return; }
        var everyone = /^(everyone|here)$/i.test(p), m = el(everyone ? 'span' : 'a', 'mention');
        m.textContent = '@' + p.replace(/_/g, ' ');
        if (!everyone) m.setAttribute('href', p + '.html');
        if (everyone || nameKey(p) === nameKey(titleText)) text.closest('.msg').classList.add('ping');
        frag.appendChild(m);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  function fillTalk(data) {
    var log = talkSec.querySelector('.talk-log'), people = {}, count = 0, last = null;
    if (data) {
      each(Array.prototype.slice.call(data.list.children), function (li) {
        if (li.tagName !== 'LI') return;
        if (li.classList.contains('day')) {
          log.appendChild(el('li', 'talk-day', '<span></span>')).firstChild.textContent = li.textContent.trim();
          last = null; return;
        }
        if (li.classList.contains('sys')) {
          log.appendChild(el('li', 'talk-sys', '<span>' + li.innerHTML + '</span>'));
          last = null; return;
        }
        var who = (li.getAttribute('data-who') || '').trim();
        if (!who) return;
        count++; people[nameKey(who)] = true;
        var reply = li.getAttribute('data-reply');
        var cont = !reply && last === nameKey(who);
        var m = el('li', 'msg' + (cont ? ' cont' : ''));
        if (reply) {
          var bar = reply.indexOf('|'), r = el('div', 'msg-reply', '<b></b><span></span>');
          r.firstChild.textContent = '@' + (bar < 0 ? reply : reply.slice(0, bar)).trim();
          r.lastChild.textContent = bar < 0 ? '' : reply.slice(bar + 1).trim();
          m.appendChild(r);
        }
        var pic = el('span', 'msg-pic', '<img alt="" referrerpolicy="no-referrer"><b aria-hidden="true"></b>');
        pic.lastChild.textContent = who.charAt(0).toUpperCase();
        m.appendChild(pic);
        var bodyEl = el('div', 'msg-body'), head = el('div', 'msg-head', '<a class="msg-who"></a>'), name = head.firstChild;
        name.textContent = who;
        name.setAttribute('href', pageFor(who));
        if (li.getAttribute('data-party')) name.classList.add(li.getAttribute('data-party'));
        if (li.getAttribute('data-time')) head.appendChild(el('time')).textContent = li.getAttribute('data-time');
        bodyEl.appendChild(head);
        var text = el('div', 'msg-text', li.innerHTML);
        bodyEl.appendChild(text);
        if (li.getAttribute('data-react')) {
          var rx = el('div', 'msg-react');
          li.getAttribute('data-react').split('|').forEach(function (x) { if (x.trim()) rx.appendChild(el('span')).textContent = x.trim(); });
          bodyEl.appendChild(rx);
        }
        m.appendChild(bodyEl);
        log.appendChild(m);
        mentions(text);
        if (!cont) talkPortrait(pic, who, li.getAttribute('data-image'));
        last = nameKey(who);
      });
      if (data.topic) talkSec.querySelector('.talk-topic').innerHTML = data.topic;
    }
    if (!count) log.appendChild(el('li', 'talk-quiet')).textContent = 'No one has said anything about ' + titleText + ' yet.';
    each(log.querySelectorAll('.msg-text img[data-image]'), function (img) { showImage(img, img.getAttribute('data-image'), img, PICTURE_SIZE.article); });
    glow(log);
  }

  /* the drifting "N Ninzards here" count (see ONLINE) */
  function startOnline(span) {
    function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function range() {
      var day = '';
      try { day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' }).format(new Date()); } catch (e) {}
      if (!day) day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
      return day === 'Sun' ? ONLINE.sunday : ONLINE.weekday;
    }
    var r = range(), n = rand(r[0], r[1]);
    function show() { span.textContent = n + (n === 1 ? ' Ninzard' : ' Ninzards') + ' here'; }
    show();
    (function drift() {
      setTimeout(function () {
        r = range();
        var step = Math.max(1, Math.round((r[1] - r[0]) / 15));
        n = Math.min(r[1], Math.max(r[0], n + rand(-step, step)));
        show(); drift();
      }, rand(ONLINE.every[0], ONLINE.every[1]));
    })();
  }

  function makeTalk() {
    talkSec = el('section', 'talk');
    talkSec.setAttribute('aria-label', 'Talk');
    talkSec.hidden = true;
    talkSec.innerHTML =
      '<div class="talk-bar"><span class="talk-hash" aria-hidden="true">#</span><b class="talk-name"></b>' +
        '<span class="talk-topic"></span><span class="talk-online"><i aria-hidden="true"></i><span></span></span></div>' +
      '<ol class="talk-log"><li class="talk-start"><span class="talk-big" aria-hidden="true">#</span><b></b><p></p></li></ol>' +
      '<div class="talk-input"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 1 1 8 0v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm2 0h4V5a2 2 0 1 0-4 0z"/></svg>' +
        '<span>You do not have permission to send messages in this channel.</span></div>';
    talkSec.querySelector('.talk-name').textContent = channel;
    startOnline(talkSec.querySelector('.talk-online').lastChild);
    talkSec.querySelector('.talk-topic').textContent = 'What Ninzards are saying about ' + titleText + '.';
    talkSec.querySelector('.talk-start b').textContent = 'Welcome to #' + channel + '!';
    talkSec.querySelector('.talk-start p').textContent = 'This is the start of the #' + channel + ' channel, where Ninzards talk about ' + titleText + '.';
    stage.insertBefore(talkSec, stage.querySelector('.foot'));
    readTalk().then(fillTalk);
  }

  /* the count of messages on the Talk tab, once the talk file has been read */
  function showCount(data) {
    var badge = tabTalk && tabTalk.querySelector('.tab-count');
    if (!badge || !data || !data.count) return;
    badge.textContent = data.count > 99 ? '99+' : data.count;
    badge.hidden = false;
    tabTalk.setAttribute('aria-label', 'Talk, ' + data.count + ' messages');
  }

  /* Article or Talk, by the address: #talk shows the chatroom, anything else the article */
  function showView() {
    var talk = location.hash === '#talk';
    if (talk && !talkSec) makeTalk();
    main.hidden = talk;
    if (talkSec) talkSec.hidden = !talk;
    tabArticle.classList.toggle('on', !talk);
    tabTalk.classList.toggle('on', talk);
    if (talk) tabTalk.setAttribute('aria-current', 'page'); else tabTalk.removeAttribute('aria-current');
    titleEl.innerHTML = (talk ? '<span class="talk-ns">Talk:</span>' : '') + titleHTML;
    doc.title = talk ? 'Talk:' + baseTitle : baseTitle;
  }
  /* the article tab goes back to the page's plain address (Liver, not Liver#) */
  function toArticle(e) {
    if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!location.hash) return;
    history.pushState(null, '', location.pathname + location.search);
    showView();
    window.scrollTo(0, 0);
  }
  function onRoute() {
    var wasArticle = !main.hidden;
    showView();
    if (wasArticle && main.hidden) window.scrollTo(0, 0);
  }
  if (talkOn) {
    showView();
    tabArticle.setAttribute('href', location.pathname + location.search);
    tabArticle.addEventListener('click', toArticle);
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('popstate', onRoute);
    /* look for the talk file soon after the page has loaded, to put the count on the tab */
    var countSoon = function () { setTimeout(function () { readTalk().then(showCount); }, 400); };
    if (doc.readyState === 'complete') countSoon(); else window.addEventListener('load', countSoon);
  }

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
    var office = box && Array.prototype.filter.call(box.querySelectorAll('h3'), function (h) { return !h.classList.contains('plain'); })[0];
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
      desc: office ? office.textContent.replace(/\s+/g, ' ').trim() : '',
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
