/* Builds the portfolio page from content.json.
   One renderer for everything: the editor uses it for the live preview and for Publish,
   and tools/build.mjs uses it to rebuild index.html from the command line. */
(function (rootObj, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { rootObj.SiteRender = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function t(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '’');
  }

  var A_ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
  var A_BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 8H3M7 4L3 8l4 4"/></svg>';
  var A_EXT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 3h7v7M13 3L4 12"/></svg>';
  var A_DL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 14h10"/></svg>';
  var A_NOTE = '<svg viewBox="0 0 34 26" aria-hidden="true"><path d="M2 21C9 22 20 19 27 8"/><path d="M19 8l8-1 1 8"/></svg>';

  /* ------------------------------------------------------------ defaults */
  var DEFAULT_ACCENT = '#f2c43a';
  /* Small fixed words around the site. [key, default text, where it shows] */
  var LABELS = [
    ['allProjects', 'All projects', 'Back link at the top of a project page'],
    ['sheet', 'Sheet', 'Page counter, as in "Sheet 3 of 17"'],
    ['of', 'of', 'Page counter, the word between the numbers'],
    ['prevProject', 'Previous project', 'Bottom of a project page'],
    ['nextProject', 'Next project', 'Bottom of a project page'],
    ['openProject', 'Open the project', 'On the full-width project card'],
    ['seeProjects', 'See {n} {skill} projects', 'Link under each skill area. Keep {n} and {skill}'],
    ['filterShow', 'Show', 'Before the filter buttons'],
    ['filterAll', 'All', 'First filter button'],
    ['colProject', 'Project', 'Column heading in the More projects list'],
    ['colWhat', 'What it is', 'Column heading in the More projects list'],
    ['colYear', 'Year', 'Column heading in the More projects list'],
    ['noCover', 'photos for this one are not in the folder yet', 'Project page with no cover photo'],
    ['noPhoto', 'photo coming soon', 'Home page while there is no photo of you'],
    ['draft', 'Draft placeholder', 'Title on a yellow draft story'],
    ['drawnBy', 'Drawn by', 'Contact block'],
    ['email', 'Email', 'Contact block'],
    ['copy', 'Copy address', 'Contact block, button under the email'],
    ['linkedin', 'LinkedIn', 'Contact block'],
    ['resume', 'Resume', 'Contact block'],
    ['resumeDownload', 'Download PDF', 'Contact block, when a resume is uploaded'],
    ['resumeSoon', 'PDF coming soon', 'Contact block, when there is no resume yet'],
    ['rev', 'Rev', 'Contact block, before the month'],
    ['shareCopy', 'Copy link to share', 'Button at the top of a project page'],
    ['shareOpen', 'Open', 'Shown only if a shared link cannot jump to the page by itself']
  ];
  var TABS = [['work', 'Projects'], ['about', 'About'], ['resume', 'Resume'], ['contact', 'Contact']];

  function fill(obj, defaults) {
    obj = obj && typeof obj === 'object' ? obj : {};
    Object.keys(defaults).forEach(function (k) { if (obj[k] === undefined) { obj[k] = defaults[k]; } });
    return obj;
  }

  /* Adds anything a content file from an older version of the editor is missing. Safe to run every time. */
  function normalize(c) {
    c.version = 2;
    c.site = fill(c.site, { name: '', mark: 'MS', role: '', tagline: '', lede: '', email: '', linkedin: '', resume: '', photo: null,
      photoCaption: '', rev: '', title: (c.site && c.site.name ? c.site.name + ' Portfolio' : 'Portfolio'),
      description: 'Moataz Sayed is a mechanical engineer at Boston University. Projects in CAD, electronics, and testing.',
      url: 'https://moatazbuilds.github.io/', shareImage: null });
    var nav = Array.isArray(c.nav) ? c.nav.filter(function (n) { return n && TABS.some(function (x) { return x[0] === n.key; }); }) : [];
    TABS.forEach(function (x) { if (!nav.some(function (n) { return n.key === x[0]; })) { nav.push({ key: x[0], label: x[1], show: true }); } });
    nav.forEach(function (n) { if (n.show === undefined) { n.show = true; } if (n.label === undefined) { n.label = ''; } });
    c.nav = nav;
    c.home = fill(c.home, { showPhoto: true, showSkills: true, showArcs: true });
    var btns = Array.isArray(c.home.buttons) ? c.home.buttons : [];
    [['work', 'See the projects'], ['resume', 'Resume'], ['linkedin', 'LinkedIn']].forEach(function (x) {
      if (!btns.some(function (b) { return b.key === x[0]; })) { btns.push({ key: x[0], label: x[1], show: true }); }
    });
    c.home.buttons = btns;
    c.work = fill(c.work, { heading: 'Projects', moreHeading: 'More projects', showFilter: true });
    c.pillars = c.pillars || [];
    c.about = fill(c.about, { heading: 'About', intro: [], facts: [], showFacts: true, experienceHeading: 'Experience', showExperience: true,
      jobs: [], skillsHeading: 'Skills', showSkills: true, skills: [] });
    c.resume = fill(c.resume, { heading: 'Resume', buttonLabel: 'Download resume (PDF)', showLinkedin: true, linkedinLabel: 'LinkedIn profile',
      hint: 'The download turns on as soon as the resume PDF is added.' });
    c.contact = fill(c.contact, { showEmail: true, showLinkedin: true, showResume: true });
    c.look = fill(c.look, { mode: 'dark', accent: DEFAULT_ACCENT });
    var labels = {};
    LABELS.forEach(function (l) { labels[l[0]] = l[1]; });
    c.labels = fill(c.labels, labels);
    c.projects = c.projects || [];
    return c;
  }
  function tabOf(c, key) { return c.nav.filter(function (n) { return n.key === key; })[0] || { key: key, label: '', show: false }; }

  /* ------------------------------------------------------------ pieces */
  function image(im, alt, eager, style) {
    var st = style ? ' style="' + style + '"' : '';
    return '<img src="' + t(im.src) + '" width="' + im.w + '" height="' + im.h + '" alt="' + t(alt) + '" ' +
      'loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async"' + st + '>';
  }

  /* Protractor fan like the ones printed in the corners of a cutting mat. */
  function fan(cls, corner) {
    var R = 480, n = 6, pad = 30, u = R / n, parts = [], i, d;
    function f(x) { var s = x.toFixed(1); return s === '-0.0' ? '0.0' : s; }
    for (i = 1; i <= n; i++) {
      var r = u * i;
      if (corner === 'tr') { d = 'M' + f(R - r) + ' 0A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + R + ' ' + f(r); }
      else { d = 'M' + f(r) + ' ' + R + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 0 ' + f(R - r); }
      parts.push('<path pathLength="1" style="--i:' + i + '" d="' + d + '"/>');
    }
    for (var k = 0, a = 0; a <= 90; a += 15, k++) {
      var c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), lx, ly;
      if (corner === 'tr') {
        d = 'M' + R + ' 0L' + f(R - R * c) + ' ' + f(R * s);
        lx = R - (R + 20) * c; ly = (R + 20) * s + 5;
      } else {
        d = 'M0 ' + R + 'L' + f(R * c) + ' ' + f(R - R * s);
        lx = (R + 20) * c; ly = R - (R + 20) * s + 5;
      }
      parts.push('<path pathLength="1" style="--i:' + (k + 2) + '" d="' + d + '"/>');
      if (a > 0 && a < 90) { parts.push('<text x="' + f(lx) + '" y="' + f(ly) + '" text-anchor="middle">' + a + '°</text>'); }
    }
    var vb = corner === 'tr' ? (-pad) + ' 0 ' + (R + pad) + ' ' + (R + pad) : '0 ' + (-pad) + ' ' + (R + pad) + ' ' + (R + pad);
    return '<svg class="' + cls + '" viewBox="' + vb + '" aria-hidden="true" focusable="false">' + parts.join('') + '</svg>';
  }

  function tags(items) {
    return '<ul class="tags">' + (items || []).map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>';
  }

  function figure(it) {
    var cls, capt = it.cap ? '<figcaption>' + t(it.cap) + '</figcaption>' : '';
    if (it.type === 'img') {
      cls = 'fig';
      if (it.fit === 'contain') { cls += ' fig--contain'; }
      if (it.phone) { cls += ' fig--phone'; }
      var style = it.pos ? 'object-position:' + it.pos : '';
      return '<figure class="' + cls + '"><button class="fig__frame" type="button" aria-label="Enlarge image: ' + t(it.alt) + '">' +
        image(it, it.alt, false, style) + '</button>' + capt + '</figure>';
    }
    cls = 'fig fig--video' + (it.portrait ? ' fig--portrait' : '');
    var attrs = it.loop
      ? 'muted loop playsinline preload="metadata" data-loop aria-label="' + t(it.cap) + '"'
      : 'controls playsinline preload="none"';
    var type = /\.webm$/i.test(it.src) ? 'video/webm' : 'video/mp4';
    var poster = it.poster ? ' poster="' + t(it.poster) + '"' : '';
    return '<figure class="' + cls + '"><video ' + attrs + poster + ' width="' + it.w + '" height="' + it.h + '">' +
      '<source src="' + t(it.src) + '" type="' + type + '"></video>' + capt + '</figure>';
  }

  function media(g) {
    var cls = 'media', cols = g.cols || 1, style = '--cols:' + cols;
    if (g.ratio) { cls += ' media--ratio'; style += ';--ratio:' + g.ratio; }
    if (g.size === 'medium') { cls += ' media--medium'; }
    var portraitish = g.items.filter(function (it) {
      return (it.type === 'video' && it.portrait) || (it.type === 'img' && it.phone);
    }).length;
    if (cols >= 2 && (portraitish >= 2 || g.ratio === '3/4' || g.ratio === '5/6')) { cls += ' media--keep'; }
    return '<div class="' + cls + '" style="' + style + '">' + g.items.map(figure).join('') + '</div>';
  }

  function link(l) {
    if (l.href.charAt(0) === '#') { return '<a class="textlink" href="' + t(l.href) + '">' + t(l.label) + '</a>'; }
    return '<a class="textlink" href="' + t(l.href) + '" target="_blank" rel="noopener">' + t(l.label) + '</a>';
  }

  function pad2(k) { return (k < 10 ? '0' : '') + k; }

  function step(p, k, s) {
    var numbered = p.numbered !== false;
    var groups = (s.media || []).filter(function (g) { return g.items && g.items.length; });
    var side = groups.length === 1 && groups[0].items.length === 1 && !groups[0].wide;
    var text = (s.body || []).map(function (x) { return '<p>' + t(x) + '</p>'; }).join('');
    if (s.bullets && s.bullets.length) { text += '<ul>' + s.bullets.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>'; }
    var links = (s.links || []).filter(function (l) { return l.label && l.href; });
    if (links.length) { text += '<p class="step__links">' + links.map(link).join('') + '</p>'; }
    if (s.note) { text += '<p class="note">' + A_NOTE + '<span>' + t(s.note) + '</span></p>'; }
    var num = numbered ? '<span class="step__num" aria-hidden="true">' + pad2(k) + '</span>' : '';
    return '<section class="step' + (side ? ' step--side' : '') + '" id="' + p.slug + '-s' + k + '">' +
      '<div class="step__head">' + num + '<h2 class="step__title">' + t(s.title) + '</h2></div>' +
      '<div class="step__body"><div class="step__text">' + text + '</div>' + groups.map(media).join('') + '</div></section>';
  }

  function projectView(p, idx, total, prev, nxt, shown, L, base) {
    var numbered = p.numbered !== false;
    var facts = (p.facts || []).filter(function (f) { return f[0] && f[1]; }).map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + t(f[1]) + '</dd>'; }).join('');
    var rel = p.related && p.related.slug && shown[p.related.slug] ? '<a class="textlink related" href="#' + p.related.slug + '">' + t(p.related.label) + '</a>' : '';
    var cover = p.cover
      ? '<figure class="pcover">' + image(p.cover, p.cover.alt, false) + '</figure>'
      : '<div class="pcover pcover--empty"><span>' + t(L.noCover) + '</span></div>';
    var proc = '', steps = '';
    (p.steps || []).filter(function (s) { return !s.hidden; }).forEach(function (s, i) {
      var k = i + 1, b = numbered ? '<b>' + k + '</b>' : '';
      proc += '<li><button type="button" data-jump="' + p.slug + '-s' + k + '">' + b + t(s.title) + '</button></li>';
      steps += step(p, k, s);
    });
    var longTitle = p.title.length > 14 ? ' ptitle--long' : '';
    return '\n<article id="' + p.slug + '" data-view="' + p.slug + '" data-title="' + t(p.title) + '">\n' +
      '<div class="wrap view-pad">\n' +
      '<div class="crumbs"><a class="back" href="#work">' + A_BACK + t(L.allProjects) + '</a><span class="crumbs__r">' +
      (L.shareCopy ? '<button class="copy copy--share" type="button" data-copy="' + t(base + p.slug + '/') + '">' + t(L.shareCopy) + '</button>' : '') +
      '<span class="sheet-no">' + t(L.sheet) + ' ' + idx + ' ' + t(L.of) + ' ' + total + '</span></span></div>\n' +
      '<div class="sheet">\n' +
      '<header class="phead">\n' +
      '<div>\n' +
      '<h1 class="ptitle' + longTitle + '">' + t(p.title) + '</h1>\n' +
      '<p class="pkicker">' + t(p.kicker) + '</p>\n' +
      '<p class="psum">' + t(p.summary) + '</p>\n' +
      '<dl class="facts">' + facts + '</dl>\n' +
      tags(p.tags) + '\n' +
      rel + '\n' +
      '</div>\n' +
      cover + '\n' +
      '</header>\n' +
      '<nav class="process" aria-label="Sections of this project"><ol>' + proc + '</ol></nav>\n' +
      '<div class="steps">' + steps + '</div>\n' +
      '</div>\n' +
      '<nav class="pager" aria-label="Other projects">\n' +
      '<a href="#' + prev.slug + '"><small>' + t(L.prevProject) + '</small><b>' + t(prev.title) + '</b></a>\n' +
      '<a href="#' + nxt.slug + '"><small>' + t(L.nextProject) + '</small><b>' + t(nxt.title) + '</b></a>\n' +
      '</nav>\n' +
      '</div>\n' +
      '</article>';
  }

  function card(p, L) {
    var variant = p.size || '', lead = variant === 'lead';
    var cls = 'card' + (variant ? ' card--' + variant : '');
    var cover = lead && p.lead ? p.lead : p.cover;
    var extra = '';
    if (lead) {
      if (p.strip && p.strip.length) {
        extra = '<ul class="strip">' + p.strip.map(function (s) { return '<li>' + image(s, '', false) + '<span>' + t(s.label) + '</span></li>'; }).join('') + '</ul>';
      }
      extra += '<span class="card__go">' + t(L.openProject) + A_ARROW + '</span>';
    }
    var pic = cover ? image(cover, p.cover ? p.cover.alt : '', lead) : '';
    return '<a class="' + cls + '" href="#' + p.slug + '" data-pillars="' + (p.pillars || []).join(' ') + '">\n' +
      '<span class="crop" aria-hidden="true"></span>\n' +
      '<div class="card__media">' + pic + '</div>\n' +
      '<div class="card__body">\n' +
      '<p class="card__meta"><span>' + (lead ? t(p.kicker) : '') + '</span><span>' + t(p.year) + '</span></p>\n' +
      '<h3 class="card__title"><span>' + t(p.title) + '</span></h3>\n' +
      '<p class="card__sum">' + t(p.card) + '</p>\n' +
      extra + '\n' +
      tags(lead ? p.tags : (p.tags || []).slice(0, 4)) + '\n' +
      '</div>\n' +
      '</a>';
  }

  function row(p) {
    var th = p.thumb ? '<span class="row__thumb">' + image(p.thumb, '', false) + '</span>' : '<span class="row__thumb"></span>';
    return '<a class="row" href="#' + p.slug + '" data-pillars="' + (p.pillars || []).join(' ') + '">' + th +
      '<span class="row__title">' + t(p.title) + '</span><span class="row__sum">' + t(p.card) + '</span>' +
      '<span class="row__year">' + t(p.year) + '</span></a>';
  }

  function visibleProjects(c) {
    var all = tabOf(c, 'work').show ? (c.projects || []).filter(function (p) { return !p.hidden; }) : [];
    var feat = all.filter(function (p) { return p.featured; });
    var more = all.filter(function (p) { return !p.featured; });
    return { all: all, feat: feat, more: more, order: feat.concat(more) };
  }

  /* ------------------------------------------------------------ link previews
     LinkedIn and other sites never see the part of a link after #, so each project also gets a
     small page at /<link name>/ that carries its own preview and then sends the visitor on. */
  function siteBase(c) { return String(c.site.url || '/').replace(/\/*$/, '/'); }
  function ogTags(c, o) {
    var base = siteBase(c), img = o.image || c.site.shareImage, m = [];
    m.push('<meta property="og:type" content="' + (o.type || 'article') + '">');
    m.push('<meta property="og:site_name" content="' + t(c.site.name) + '">');
    m.push('<meta property="og:title" content="' + t(o.title) + '">');
    if (o.desc) { m.push('<meta property="og:description" content="' + t(o.desc) + '">'); }
    m.push('<meta property="og:url" content="' + t(o.url) + '">');
    if (img && img.src) {
      m.push('<meta property="og:image" content="' + t(base + img.src) + '">');
      if (img.w && img.h) { m.push('<meta property="og:image:width" content="' + img.w + '">', '<meta property="og:image:height" content="' + img.h + '">'); }
      m.push('<meta name="twitter:card" content="summary_large_image">');
    }
    return m.join('\n');
  }
  function sharePage(c, o) {
    var dest = '../#' + o.hash;
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="generator" content="share-page">\n' +
      '<title>' + t(o.title + ' | ' + c.site.name) + '</title>\n' +
      (o.desc ? '<meta name="description" content="' + t(o.desc) + '">\n' : '') +
      ogTags(c, o) + '\n' +
      '<link rel="canonical" href="' + t(o.url) + '">\n' +
      '<link rel="icon" type="image/png" sizes="32x32" href="../assets/icons/favicon-32.png">\n' +
      '<script>location.replace(' + JSON.stringify(dest) + ');</script>\n' +
      '</head>\n<body style="margin:0;padding:40px 20px;background:#101d30;color:#e8eef5;font:18px/1.5 system-ui,sans-serif">\n' +
      '<p><a style="color:#f2c43a" href="' + t(dest) + '">' + t((c.labels.shareOpen || 'Open') + ' ' + o.title) + '</a></p>\n' +
      '</body>\n</html>\n';
  }
  /* Every preview page the site should have right now: one per visible project, plus About. */
  function sharePages(c) {
    normalize(c);
    var base = siteBase(c), out = [];
    visibleProjects(c).order.forEach(function (p) {
      out.push({ path: p.slug + '/index.html', html: sharePage(c, { title: p.title, desc: p.card || p.summary, url: base + p.slug + '/', image: p.share, hash: p.slug }) });
    });
    if (tabOf(c, 'about').show) {
      var a = c.about;
      out.push({ path: 'about/index.html', html: sharePage(c, { title: a.heading, desc: (a.intro || [])[0] || c.site.description, url: base + 'about/', image: null, hash: 'about' }) });
    }
    return out;
  }

  /* ------------------------------------------------------------ the page */
  function render(c) {
    normalize(c);
    var site = c.site, L = c.labels, vp = visibleProjects(c);
    var showWork = tabOf(c, 'work').show, showAbout = tabOf(c, 'about').show, showResume = tabOf(c, 'resume').show, showContact = tabOf(c, 'contact').show;
    var counts = {};
    c.pillars.forEach(function (pl) { counts[pl.key] = vp.all.filter(function (p) { return (p.pillars || []).indexOf(pl.key) > -1; }).length; });

    var cards = vp.feat.map(function (p) { return card(p, L); }).join('');
    var rows = vp.more.map(row).join('');
    var spans = c.pillars.map(function (pl) {
      var see = showWork ? '<button class="textlink" type="button" data-filter-go="' + pl.key + '">' +
        t(String(L.seeProjects).replace('{n}', counts[pl.key]).replace('{skill}', pl.word)) + '</button>' : '';
      return '<li class="span"><div class="span__dim"><span>' + t(pl.label) + '</span></div><p>' + t(pl.text) + '</p>' + see + '</li>';
    }).join('');
    var chips = '<button class="chip" type="button" data-filter="all" aria-pressed="true">' + t(L.filterAll) + '</button>' + c.pillars.map(function (pl) {
      return '<button class="chip" type="button" data-filter="' + pl.key + '" aria-pressed="false">' + t(pl.label) + '</button>';
    }).join('');

    var portrait;
    if (site.photo && site.photo.src) {
      portrait = '<img class="portrait__img" src="' + t(site.photo.src) + '" alt="' + t(site.name) + '"><figcaption>' + t(site.photoCaption || '') + '</figcaption>';
    } else {
      portrait = '<div class="portrait__empty" role="img" aria-label="Placeholder for a photo of Moataz">' +
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="38" r="17"/><path d="M16 92c2-22 16-33 34-33s32 11 34 33"/>' +
        '<path d="M50 6v10M50 60v0M6 38h10M84 38h10" stroke-dasharray="3 3"/></svg></div>' +
        '<figcaption>' + t(L.noPhoto) + '</figcaption>';
    }

    var R = c.resume, resumeBtn, resumeCell, resumeHint;
    if (site.resume) {
      resumeBtn = '<a class="btn btn--primary" href="' + t(site.resume) + '" download>' + A_DL + t(R.buttonLabel) + '</a>';
      resumeCell = '<a href="' + t(site.resume) + '" download>' + t(L.resumeDownload) + '</a>';
      resumeHint = '';
    } else {
      resumeBtn = '<span class="btn btn--primary" aria-disabled="true">' + A_DL + t(R.buttonLabel) + '</span>';
      resumeCell = '<span>' + t(L.resumeSoon) + '</span>';
      resumeHint = R.hint ? '<p class="hint">' + t(R.hint) + '</p>' : '';
    }
    var liText = site.linkedin.replace('https://www.', '').replace(/\/+$/, '');
    var nameSpans = site.name.split(/\s+/).filter(Boolean).map(function (w) { return '<span>' + t(w) + '</span>'; }).join(' ');

    /* buttons under the headline */
    var actions = c.home.buttons.map(function (b) {
      if (!b.show || !b.label) { return ''; }
      if (b.key === 'work') { return showWork ? '<a class="btn btn--primary" href="#work">' + t(b.label) + A_ARROW + '</a>\n' : ''; }
      if (b.key === 'resume') { return showResume ? '<a class="btn" href="#resume">' + t(b.label) + '</a>\n' : ''; }
      if (b.key === 'linkedin') { return site.linkedin ? '<a class="btn" href="' + t(site.linkedin) + '" target="_blank" rel="noopener">' + t(b.label) + A_EXT + '</a>\n' : ''; }
      return '';
    }).join('');

    var moreBlock = '<div id="more"' + (vp.more.length ? '' : ' hidden') + '>\n' +
      '<h2 class="h-mat more-title">' + t(c.work.moreHeading) + '</h2>\n' +
      '<div class="sheet index">\n' +
      '<div class="index__head" aria-hidden="true"><span></span><span>' + t(L.colProject) + '</span><span>' + t(L.colWhat) + '</span><span style="text-align:right">' + t(L.colYear) + '</span></div>\n' +
      rows + '\n' +
      '</div>\n' +
      '</div>\n';
    var filter = c.work.showFilter && c.pillars.length
      ? '<div class="filter" role="group" aria-label="Filter projects by skill">\n' +
        '<span class="filter__label">' + t(L.filterShow) + '</span>' + chips + '\n' +
        '<p class="filter__count" id="filter-count" aria-live="polite"></p>\n' +
        '</div>\n'
      : '';
    var workBlock = showWork
      ? '<div class="wrap projects" id="projects">\n' +
        '<div class="projects__head">\n' +
        '<h2 class="h-mat">' + t(c.work.heading) + '</h2>\n' +
        filter +
        '</div>\n' +
        '<div class="grid">' + cards + '</div>\n' +
        moreBlock +
        '</div>\n'
      : '';
    var showPhoto = c.home.showPhoto;

    var home = '\n<section id="home" data-view="home" data-title="Home">\n' +
      '<div class="hero">\n' +
      (c.home.showArcs ? fan('fan fan--draw', 'tr') : '') + '\n' +
      '<div class="wrap hero__grid' + (showPhoto ? '' : ' hero__grid--solo') + '">\n' +
      '<div class="hero__copy">\n' +
      '<h1 class="name">' + nameSpans + '</h1>\n' +
      '<p class="tagline">' + t(site.tagline) + '</p>\n' +
      '<p class="lede">' + t(site.lede) + '</p>\n' +
      '<div class="actions">\n' +
      actions +
      '</div>\n' +
      '</div>\n' +
      (showPhoto ? '<figure class="portrait">' + portrait + '</figure>\n' : '') +
      '</div>\n' +
      (c.home.showSkills && c.pillars.length ? '<div class="wrap"><ul class="spans">' + spans + '</ul></div>\n' : '') +
      '</div>\n' +
      workBlock +
      '</section>';

    /* About and Resume share one page. Either can be switched off. */
    var ab = c.about, about = '';
    if (showAbout || showResume) {
      var jobs = (ab.jobs || []).map(function (j) {
        var roles = (j.roles || []).map(function (r) {
          var stories = (r.stories || []).map(function (s) {
            return s.draft ? '<div class="draft"><b>' + t(L.draft) + '</b>' + t(s.text) + '</div>' : '<p class="story">' + t(s.text) + '</p>';
          }).join('\n');
          return '<div class="role"><b>' + t(r.title) + '</b><span>' + t(r.meta) + '</span></div>\n' + stories;
        }).join('\n');
        return '<div class="job">\n<h3 class="co">' + t(j.company) + '</h3>\n' + roles + '\n</div>';
      }).join('\n');
      var skills = (ab.skills || []).map(function (s) {
        return '<div><h3>' + t(s.title) + '</h3><ul>' + (s.items || []).map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul></div>';
      }).join('\n');
      var aboutFacts = (ab.facts || []).filter(function (f) { return f[0] && f[1]; }).map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + t(f[1]) + '</dd>'; }).join('\n');
      var pageName = showAbout ? ab.heading : R.heading;
      var aboutParts = '';
      if (showAbout) {
        aboutParts += '<header class="about__head">\n' +
          '<div class="about__intro">\n' +
          '<h1 class="ptitle">' + t(ab.heading) + '</h1>\n' +
          (ab.intro || []).map(function (x) { return '<p>' + t(x) + '</p>'; }).join('\n') + '\n' +
          '</div>\n' +
          (ab.showFacts && aboutFacts ? '<dl class="facts">\n' + aboutFacts + '\n</dl>\n' : '') +
          '</header>\n';
        if (ab.showExperience && (ab.jobs || []).length) {
          aboutParts += '<section class="block">\n' +
            '<h2 class="block__title">' + t(ab.experienceHeading) + '</h2>\n' +
            '<div>\n' + jobs + '\n</div>\n' +
            '</section>\n';
        }
        if (ab.showSkills && (ab.skills || []).length) {
          aboutParts += '<section class="block">\n' +
            '<h2 class="block__title">' + t(ab.skillsHeading) + '</h2>\n' +
            '<div class="skills">\n' + skills + '\n</div>\n' +
            '</section>\n';
        }
      }
      if (showResume) {
        aboutParts += '<section class="block" id="resume-block">\n' +
          '<h2 class="block__title">' + t(R.heading) + '</h2>\n' +
          '<div class="resume">\n' +
          resumeBtn + '\n' +
          (R.showLinkedin && site.linkedin ? '<a class="btn" href="' + t(site.linkedin) + '" target="_blank" rel="noopener">' + t(R.linkedinLabel) + A_EXT + '</a>\n' : '') +
          resumeHint + '\n' +
          '</div>\n' +
          '</section>\n';
      }
      about = '\n<section id="about" data-view="about" data-title="' + t(pageName) + '">\n' +
        '<div class="wrap view-pad">\n' +
        '<div class="crumbs"><a class="back" href="#work">' + A_BACK + t(L.allProjects) + '</a><span class="sheet-no">' + t(pageName) + '</span></div>\n' +
        '<div class="sheet">\n' +
        aboutParts +
        '</div>\n' +
        '</div>\n' +
        '</section>';
    }

    var views = '', n = vp.order.length, shown = {};
    vp.order.forEach(function (p) { shown[p.slug] = true; });
    vp.order.forEach(function (p, i) {
      views += projectView(p, i + 1, n, vp.order[(i - 1 + n) % n], vp.order[(i + 1) % n], shown, L, siteBase(c));
    });

    /* contact block */
    var foot;
    if (showContact) {
      var K = c.contact, cells = ['<div class="tb__cell"><span class="tb__label">' + t(L.drawnBy) + '</span><span class="tb__name">' + t(site.name) + '</span><span class="tb__sub">' + t(site.role) + '</span></div>'];
      if (K.showEmail && site.email) {
        cells.push('<div class="tb__cell"><span class="tb__label">' + t(L.email) + '</span><a href="mailto:' + t(site.email) + '">' + t(site.email) + '</a><br><button class="copy" type="button" data-copy="' + t(site.email) + '">' + t(L.copy) + '</button></div>');
      }
      if (K.showLinkedin && site.linkedin) {
        cells.push('<div class="tb__cell"><span class="tb__label">' + t(L.linkedin) + '</span><a href="' + t(site.linkedin) + '" target="_blank" rel="noopener">' + t(liText) + '</a></div>');
      }
      if (K.showResume && showResume) {
        cells.push('<div class="tb__cell"><span class="tb__label">' + t(L.resume) + '</span>' + resumeCell + '</div>');
      }
      foot = '<footer class="foot" id="contact">\n' +
        (c.home.showArcs ? fan('fan fan--foot', 'bl') : '') + '\n' +
        '<div class="wrap foot__in">\n' +
        '<div class="tb' + (cells.length < 4 ? ' tb--' + cells.length : '') + '">\n' +
        cells.join('\n') + '\n' +
        '<div class="tb__base"><span>' + t(L.sheet) + ': <span id="sheet-label">Home</span></span><span>' + t(L.rev) + ': ' + t(site.rev) + '</span></div>\n' +
        '</div>\n' +
        '</div>\n' +
        '</footer>';
    } else {
      foot = '<footer class="foot"></footer>';
    }

    /* top menu */
    var nav = c.nav.filter(function (nv) { return nv.show && nv.label; }).map(function (nv) {
      if (nv.key === 'contact') { return '<button type="button" data-jump="contact">' + t(nv.label) + '</button>'; }
      return '<a href="#' + nv.key + '" data-nav="' + nv.key + '">' + t(nv.label) + '</a>';
    }).join('\n');
    var brand = '<a class="brand" href="#home" aria-label="' + t(site.name) + ', home"><span class="brand__mark" aria-hidden="true">' + t(site.mark) + '</span><span class="brand__name">' + t(site.name) + '</span></a>';
    var accent = /^#[0-9a-f]{6}$/i.test(c.look.accent || '') ? c.look.accent.toLowerCase() : DEFAULT_ACCENT;
    var look = accent === DEFAULT_ACCENT ? '' : '\n<style>:root,:root[data-mode="dark"]{--mark:' + accent + ';--mark-hover:' + accent + ';--draft-label:' + accent + '}</style>';

    return {
      main: '\n' + home + (about ? '\n' + about : '') + '\n' + views + '\n', foot: foot, nav: nav, brand: brand,
      title: t(site.title), desc: t(site.description), mode: c.look.mode === 'light' ? 'light' : 'dark', look: look, counts: counts,
      og: ogTags(c, { title: site.title, desc: site.description, url: siteBase(c), image: site.shareImage, type: 'website' })
    };
  }

  /* Put the rendered content into the page shell (the HTML, CSS and script that never change). */
  function buildPage(content, shell) {
    var r = render(content), out = shell;
    [['<!--MAIN-->', r.main], ['<!--FOOT-->', r.foot], ['<!--NAV-->', r.nav], ['<!--BRAND-->', r.brand], ['<!--TITLE-->', r.title],
      ['<!--DESC-->', r.desc], ['<!--MODE-->', r.mode], ['<!--LOOK-->', r.look], ['<!--OG-->', r.og]].forEach(function (x) {
      if (out.indexOf(x[0]) < 0) { throw new Error('The page shell is out of date. Reload the editor. (Missing ' + x[0].replace(/[<!>-]/g, '') + ')'); }
      out = out.replace(x[0], function () { return x[1]; });
    });
    return out;
  }

  /* Every file under assets/ that the content points at. */
  function assetRefs(c) {
    var out = {};
    function add(x) { if (x && typeof x === 'string' && x.indexOf('assets/') === 0) { out[x] = true; } }
    add(c.site.resume); if (c.site.photo) { add(c.site.photo.src); } if (c.site.shareImage) { add(c.site.shareImage.src); }
    (c.projects || []).forEach(function (p) {
      ['cover', 'thumb', 'lead', 'share'].forEach(function (k) { if (p[k]) { add(p[k].src); } });
      (p.strip || []).forEach(function (s) { add(s.src); });
      (p.steps || []).forEach(function (s) {
        (s.media || []).forEach(function (g) { (g.items || []).forEach(function (it) { add(it.src); add(it.poster); }); });
      });
    });
    return Object.keys(out).sort();
  }

  /* Problems that would break the page. Returns a list of plain-language messages. */
  function check(c) {
    var errs = [], seen = {}, reserved = ['home', 'work', 'about', 'resume', 'contact', 'main', 'projects', 'more', 'edit', 'assets', 'src', 'tools', 'index'];
    (c.projects || []).forEach(function (p, i) {
      var name = p.title || 'Project ' + (i + 1);
      if (!p.title) { errs.push('Project ' + (i + 1) + ' needs a title.'); }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug || '')) { errs.push(name + ': the link name can only use lowercase letters, numbers and hyphens.'); }
      else if (reserved.indexOf(p.slug) > -1) { errs.push(name + ': the link name "' + p.slug + '" is used by the site itself. Pick another.'); }
      else if (seen[p.slug]) { errs.push(name + ': another project already uses the link name "' + p.slug + '".'); }
      seen[p.slug] = true;
      (p.steps || []).forEach(function (s, k) { if (!s.title) { errs.push(name + ': section ' + (k + 1) + ' needs a title.'); } });
    });
    if (!c.site || !String(c.site.name || '').trim()) { errs.push('The site needs your name. Add it under Home.'); }
    return errs;
  }

  return { render: render, buildPage: buildPage, assetRefs: assetRefs, check: check, normalize: normalize, escape: t, sharePages: sharePages,
    LABELS: LABELS, DEFAULT_ACCENT: DEFAULT_ACCENT };
});
