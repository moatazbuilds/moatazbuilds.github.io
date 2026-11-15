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

  function projectView(p, idx, total, prev, nxt) {
    var numbered = p.numbered !== false;
    var facts = (p.facts || []).filter(function (f) { return f[0] && f[1]; }).map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + t(f[1]) + '</dd>'; }).join('');
    var rel = p.related && p.related.slug ? '<a class="textlink related" href="#' + p.related.slug + '">' + t(p.related.label) + '</a>' : '';
    var cover = p.cover
      ? '<figure class="pcover">' + image(p.cover, p.cover.alt, false) + '</figure>'
      : '<div class="pcover pcover--empty"><span>photos for this one are not in the folder yet</span></div>';
    var proc = '', steps = '';
    (p.steps || []).forEach(function (s, i) {
      var k = i + 1, b = numbered ? '<b>' + k + '</b>' : '';
      proc += '<li><button type="button" data-jump="' + p.slug + '-s' + k + '">' + b + t(s.title) + '</button></li>';
      steps += step(p, k, s);
    });
    var longTitle = p.title.length > 14 ? ' ptitle--long' : '';
    return '\n<article id="' + p.slug + '" data-view="' + p.slug + '" data-title="' + t(p.title) + '">\n' +
      '<div class="wrap view-pad">\n' +
      '<div class="crumbs"><a class="back" href="#work">' + A_BACK + 'All projects</a><span class="sheet-no">Sheet ' + idx + ' of ' + total + '</span></div>\n' +
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
      '<a href="#' + prev.slug + '"><small>Previous project</small><b>' + t(prev.title) + '</b></a>\n' +
      '<a href="#' + nxt.slug + '"><small>Next project</small><b>' + t(nxt.title) + '</b></a>\n' +
      '</nav>\n' +
      '</div>\n' +
      '</article>';
  }

  function card(p) {
    var variant = p.size || '', lead = variant === 'lead';
    var cls = 'card' + (variant ? ' card--' + variant : '');
    var cover = lead && p.lead ? p.lead : p.cover;
    var extra = '';
    if (lead) {
      if (p.strip && p.strip.length) {
        extra = '<ul class="strip">' + p.strip.map(function (s) { return '<li>' + image(s, '', false) + '<span>' + t(s.label) + '</span></li>'; }).join('') + '</ul>';
      }
      extra += '<span class="card__go">Open the project' + A_ARROW + '</span>';
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
    var all = (c.projects || []).filter(function (p) { return !p.hidden; });
    var feat = all.filter(function (p) { return p.featured; });
    var more = all.filter(function (p) { return !p.featured; });
    return { all: all, feat: feat, more: more, order: feat.concat(more) };
  }

  function render(c) {
    var site = c.site, vp = visibleProjects(c);
    var counts = {};
    c.pillars.forEach(function (pl) { counts[pl.key] = vp.all.filter(function (p) { return (p.pillars || []).indexOf(pl.key) > -1; }).length; });

    var cards = vp.feat.map(card).join('');
    var rows = vp.more.map(row).join('');
    var spans = c.pillars.map(function (pl) {
      return '<li class="span"><div class="span__dim"><span>' + t(pl.label) + '</span></div><p>' + t(pl.text) + '</p>' +
        '<button class="textlink" type="button" data-filter-go="' + pl.key + '">See ' + counts[pl.key] + ' ' + t(pl.word) + ' projects</button></li>';
    }).join('');
    var chips = '<button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>' + c.pillars.map(function (pl) {
      return '<button class="chip" type="button" data-filter="' + pl.key + '" aria-pressed="false">' + t(pl.label) + '</button>';
    }).join('');

    var portrait;
    if (site.photo && site.photo.src) {
      portrait = '<img class="portrait__img" src="' + t(site.photo.src) + '" alt="' + t(site.name) + '"><figcaption>' + t(site.photoCaption || '') + '</figcaption>';
    } else {
      portrait = '<div class="portrait__empty" role="img" aria-label="Placeholder for a photo of Moataz">' +
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="38" r="17"/><path d="M16 92c2-22 16-33 34-33s32 11 34 33"/>' +
        '<path d="M50 6v10M50 60v0M6 38h10M84 38h10" stroke-dasharray="3 3"/></svg></div>' +
        '<figcaption>photo coming soon</figcaption>';
    }

    var resumeBtn, resumeCell, resumeHint;
    if (site.resume) {
      resumeBtn = '<a class="btn btn--primary" href="' + t(site.resume) + '" download>' + A_DL + 'Download resume (PDF)</a>';
      resumeCell = '<a href="' + t(site.resume) + '" download>Download PDF</a>';
      resumeHint = '';
    } else {
      resumeBtn = '<span class="btn btn--primary" aria-disabled="true">' + A_DL + 'Download resume (PDF)</span>';
      resumeCell = '<span>PDF coming soon</span>';
      resumeHint = '<p class="hint">The download turns on as soon as the resume PDF is added.</p>';
    }
    var liText = site.linkedin.replace('https://www.', '').replace(/\/+$/, '');
    var nameSpans = site.name.split(/\s+/).map(function (w) { return '<span>' + t(w) + '</span>'; }).join(' ');

    var moreBlock = '<div id="more"' + (vp.more.length ? '' : ' hidden') + '>\n' +
      '<h2 class="h-mat more-title">More projects</h2>\n' +
      '<div class="sheet index">\n' +
      '<div class="index__head" aria-hidden="true"><span></span><span>Project</span><span>What it is</span><span style="text-align:right">Year</span></div>\n' +
      rows + '\n' +
      '</div>\n' +
      '</div>\n';

    var home = '\n<section id="home" data-view="home" data-title="Home">\n' +
      '<div class="hero">\n' +
      fan('fan fan--draw', 'tr') + '\n' +
      '<div class="wrap hero__grid">\n' +
      '<div class="hero__copy">\n' +
      '<h1 class="name">' + nameSpans + '</h1>\n' +
      '<p class="tagline">' + t(site.tagline) + '</p>\n' +
      '<p class="lede">' + t(site.lede) + '</p>\n' +
      '<div class="actions">\n' +
      '<a class="btn btn--primary" href="#work">See the projects' + A_ARROW + '</a>\n' +
      '<a class="btn" href="#resume">Resume</a>\n' +
      '<a class="btn" href="' + t(site.linkedin) + '" target="_blank" rel="noopener">LinkedIn' + A_EXT + '</a>\n' +
      '</div>\n' +
      '</div>\n' +
      '<figure class="portrait">' + portrait + '</figure>\n' +
      '</div>\n' +
      '<div class="wrap"><ul class="spans">' + spans + '</ul></div>\n' +
      '</div>\n' +
      '<div class="wrap projects" id="projects">\n' +
      '<div class="projects__head">\n' +
      '<h2 class="h-mat">Projects</h2>\n' +
      '<div class="filter" role="group" aria-label="Filter projects by skill">\n' +
      '<span class="filter__label">Show</span>' + chips + '\n' +
      '<p class="filter__count" id="filter-count" aria-live="polite"></p>\n' +
      '</div>\n' +
      '</div>\n' +
      '<div class="grid">' + cards + '</div>\n' +
      moreBlock +
      '</div>\n' +
      '</section>';

    var ab = c.about;
    var jobs = (ab.jobs || []).map(function (j) {
      var roles = (j.roles || []).map(function (r) {
        var stories = (r.stories || []).map(function (s) {
          return s.draft ? '<div class="draft"><b>Draft placeholder</b>' + t(s.text) + '</div>' : '<p class="story">' + t(s.text) + '</p>';
        }).join('\n');
        return '<div class="role"><b>' + t(r.title) + '</b><span>' + t(r.meta) + '</span></div>\n' + stories;
      }).join('\n');
      return '<div class="job">\n<h3 class="co">' + t(j.company) + '</h3>\n' + roles + '\n</div>';
    }).join('\n');
    var skills = (ab.skills || []).map(function (s) {
      return '<div><h3>' + t(s.title) + '</h3><ul>' + (s.items || []).map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('\n');
    var aboutFacts = (ab.facts || []).filter(function (f) { return f[0] && f[1]; }).map(function (f) { return '<dt>' + t(f[0]) + '</dt><dd>' + t(f[1]) + '</dd>'; }).join('\n');

    var about = '\n<section id="about" data-view="about" data-title="About">\n' +
      '<div class="wrap view-pad">\n' +
      '<div class="crumbs"><a class="back" href="#work">' + A_BACK + 'All projects</a><span class="sheet-no">About</span></div>\n' +
      '<div class="sheet">\n' +
      '<header class="about__head">\n' +
      '<div class="about__intro">\n' +
      '<h1 class="ptitle">About</h1>\n' +
      (ab.intro || []).map(function (x) { return '<p>' + t(x) + '</p>'; }).join('\n') + '\n' +
      '</div>\n' +
      '<dl class="facts">\n' + aboutFacts + '\n</dl>\n' +
      '</header>\n' +
      '<section class="block">\n' +
      '<h2 class="block__title">Experience</h2>\n' +
      '<div>\n' + jobs + '\n</div>\n' +
      '</section>\n' +
      '<section class="block">\n' +
      '<h2 class="block__title">Skills</h2>\n' +
      '<div class="skills">\n' + skills + '\n</div>\n' +
      '</section>\n' +
      '<section class="block" id="resume-block">\n' +
      '<h2 class="block__title">Resume</h2>\n' +
      '<div class="resume">\n' +
      resumeBtn + '\n' +
      '<a class="btn" href="' + t(site.linkedin) + '" target="_blank" rel="noopener">LinkedIn profile' + A_EXT + '</a>\n' +
      resumeHint + '\n' +
      '</div>\n' +
      '</section>\n' +
      '</div>\n' +
      '</div>\n' +
      '</section>';

    var views = '', n = vp.order.length;
    vp.order.forEach(function (p, i) {
      views += projectView(p, i + 1, n, vp.order[(i - 1 + n) % n], vp.order[(i + 1) % n]);
    });

    var foot = '<footer class="foot" id="contact">\n' +
      fan('fan fan--foot', 'bl') + '\n' +
      '<div class="wrap foot__in">\n' +
      '<div class="tb">\n' +
      '<div class="tb__cell"><span class="tb__label">Drawn by</span><span class="tb__name">' + t(site.name) + '</span><span class="tb__sub">' + t(site.role) + '</span></div>\n' +
      '<div class="tb__cell"><span class="tb__label">Email</span><a href="mailto:' + t(site.email) + '">' + t(site.email) + '</a><br><button class="copy" type="button" data-copy="' + t(site.email) + '">Copy address</button></div>\n' +
      '<div class="tb__cell"><span class="tb__label">LinkedIn</span><a href="' + t(site.linkedin) + '" target="_blank" rel="noopener">' + t(liText) + '</a></div>\n' +
      '<div class="tb__cell"><span class="tb__label">Resume</span>' + resumeCell + '</div>\n' +
      '<div class="tb__base"><span>Sheet: <span id="sheet-label">Home</span></span><span>Rev: ' + t(site.rev) + '</span></div>\n' +
      '</div>\n' +
      '</div>\n' +
      '</footer>';

    return { main: '\n' + home + '\n' + about + '\n' + views + '\n', foot: foot, counts: counts };
  }

  /* Put the rendered content into the page shell (the HTML, CSS and script that never change). */
  function buildPage(content, shell) {
    var r = render(content);
    if (shell.indexOf('<!--MAIN-->') < 0 || shell.indexOf('<!--FOOT-->') < 0) { throw new Error('The page shell is missing its content markers.'); }
    return shell.replace('<!--MAIN-->', function () { return r.main; }).replace('<!--FOOT-->', function () { return r.foot; });
  }

  /* Every file under assets/ that the content points at. */
  function assetRefs(c) {
    var out = {};
    function add(x) { if (x && typeof x === 'string' && x.indexOf('assets/') === 0) { out[x] = true; } }
    add(c.site.resume); if (c.site.photo) { add(c.site.photo.src); }
    (c.projects || []).forEach(function (p) {
      ['cover', 'thumb', 'lead'].forEach(function (k) { if (p[k]) { add(p[k].src); } });
      (p.strip || []).forEach(function (s) { add(s.src); });
      (p.steps || []).forEach(function (s) {
        (s.media || []).forEach(function (g) { (g.items || []).forEach(function (it) { add(it.src); add(it.poster); }); });
      });
    });
    return Object.keys(out).sort();
  }

  /* Problems that would break the page. Returns a list of plain-language messages. */
  function check(c) {
    var errs = [], seen = {}, reserved = ['home', 'work', 'about', 'resume', 'contact', 'main', 'projects', 'more', 'edit'];
    (c.projects || []).forEach(function (p, i) {
      var name = p.title || 'Project ' + (i + 1);
      if (!p.title) { errs.push('Project ' + (i + 1) + ' needs a title.'); }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug || '')) { errs.push(name + ': the link name can only use lowercase letters, numbers and hyphens.'); }
      else if (reserved.indexOf(p.slug) > -1) { errs.push(name + ': the link name "' + p.slug + '" is used by the site itself. Pick another.'); }
      else if (seen[p.slug]) { errs.push(name + ': another project already uses the link name "' + p.slug + '".'); }
      seen[p.slug] = true;
      if (p.related && p.related.slug && !(c.projects || []).some(function (q) { return q.slug === p.related.slug && !q.hidden; })) {
        errs.push(name + ': the related project link points at a project that does not exist or is hidden.');
      }
      (p.steps || []).forEach(function (s, k) { if (!s.title) { errs.push(name + ': section ' + (k + 1) + ' needs a title.'); } });
    });
    if (!(c.projects || []).some(function (p) { return !p.hidden; })) { errs.push('At least one project has to be visible.'); }
    return errs;
  }

  return { render: render, buildPage: buildPage, assetRefs: assetRefs, check: check, escape: t };
});
