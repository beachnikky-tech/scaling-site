/* ============================================================
   FOCUS LIBERTÉ — PAGE DIAGNOSTIC (moteur d'affichage)
   ------------------------------------------------------------
   1. Construit le radar des 6 piliers à partir de la config
      <ul class="radar-config"> (aucune coordonnée à calculer
      à la main : change juste les notes).
   2. Déclenche les animations (étoile + barres) à l'entrée
      dans le viewport.

   Dépend de : focus-liberte.css + diag.css
   ============================================================ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 320;      // centre X du viewBox
  var CY = 255;      // centre Y du viewBox
  var R = 180;       // rayon max
  var RINGS = [0.25, 0.5, 0.75, 1];

  function polar(index, radius) {
    var a = (index * 60 - 90) * Math.PI / 180;
    return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
  }

  function polyPoints(radiusOf) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var p = polar(i, radiusOf(i));
      pts.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
    }
    return pts.join(' ');
  }

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function readPillars() {
    var nodes = document.querySelectorAll('.radar-config li');
    var pillars = [];
    Array.prototype.forEach.call(nodes, function (li) {
      pillars.push({
        label: li.getAttribute('data-label') || '',
        score: parseFloat(li.getAttribute('data-score')) || 0
      });
    });
    return pillars;
  }

  function buildRadar(svg, pillars) {
    var gridLayer = svg.querySelector('.radar-grid-layer');
    var dataLayer = svg.querySelector('.radar-data');
    if (!gridLayer || !dataLayer) return;

    // Anneaux de la grille
    RINGS.forEach(function (f) {
      gridLayer.appendChild(el('polygon', {
        class: 'radar-grid' + (f === 1 ? ' radar-grid--outer' : ''),
        points: polyPoints(function () { return R * f; })
      }));
    });

    // Axes
    for (var i = 0; i < 6; i++) {
      var o = polar(i, R);
      gridLayer.appendChild(el('line', {
        class: 'radar-axis',
        x1: CX, y1: CY, x2: o.x.toFixed(1), y2: o.y.toFixed(1)
      }));
    }

    // Le pilier le plus faible ressort en orange
    var scores = pillars.map(function (p) { return p.score; });
    var lowIndex = scores.indexOf(Math.min.apply(null, scores));

    // Forme des notes (rayon proportionnel à la note /10)
    dataLayer.appendChild(el('polygon', {
      class: 'radar-shape',
      points: polyPoints(function (i) { return R * (scores[i] / 10); })
    }));

    // Points
    pillars.forEach(function (p, i) {
      var pt = polar(i, R * (p.score / 10));
      dataLayer.appendChild(el('circle', {
        class: 'radar-dot' + (i === lowIndex ? ' radar-dot--low' : ''),
        cx: pt.x.toFixed(1), cy: pt.y.toFixed(1), r: 5
      }));
    });

    // Libellés + notes autour de l'étoile
    pillars.forEach(function (p, i) {
      var isSide = (i === 1 || i === 2 || i === 4 || i === 5);
      var lp = polar(i, R + (isSide ? 14 : 30));
      var anchor = Math.abs(lp.x - CX) < 20 ? 'middle' : (lp.x > CX ? 'start' : 'end');
      var g = el('g', { 'text-anchor': anchor });

      var name = el('text', { class: 'radar-label', x: lp.x.toFixed(1), y: lp.y.toFixed(1) });
      name.textContent = p.label;

      var score = el('text', {
        class: 'radar-score' + (i === lowIndex ? ' radar-score--low' : ''),
        x: lp.x.toFixed(1), y: (lp.y + 18).toFixed(1)
      });
      score.textContent = p.score;

      g.appendChild(name);
      g.appendChild(score);
      gridLayer.appendChild(g);
    });
  }

  function init() {
    var svg = document.querySelector('.radar-svg');
    if (svg) {
      var pillars = readPillars();
      if (pillars.length === 6) buildRadar(svg, pillars);
    }

    var targets = document.querySelectorAll('.radar-svg, .pillars');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (t) { t.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    Array.prototype.forEach.call(targets, function (t) { observer.observe(t); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
