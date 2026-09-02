/* Utilitários mínimos de DOM. Nada de framework: o app inteiro cabe em
 * poucas funções e assim continua sem build step e sem dependências. */
(function (global) {
  'use strict';

  /* h('div.card', {text:'oi'}, [filhos]) — o seletor aceita tag + classes. */
  function h(seletor, props, filhos) {
    var partes = String(seletor).split('.');
    var tag = partes.shift() || 'div';
    var no = document.createElement(tag);
    if (partes.length) no.className = partes.join(' ');

    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') { no.textContent = v; return; }
      if (k === 'html') { no.innerHTML = v; return; }
      if (k === 'class') { no.className = (no.className ? no.className + ' ' : '') + v; return; }
      if (k === 'dataset') {
        Object.keys(v).forEach(function (d) { no.dataset[d] = v[d]; });
        return;
      }
      if (k.indexOf('on') === 0 && typeof v === 'function') {
        no.addEventListener(k.slice(2).toLowerCase(), v);
        return;
      }
      if (v === true) { no.setAttribute(k, ''); return; }
      no.setAttribute(k, v);
    });

    anexar(no, filhos);
    return no;
  }

  function anexar(pai, filhos) {
    if (filhos === null || filhos === undefined || filhos === false) return pai;
    if (Array.isArray(filhos)) {
      filhos.forEach(function (f) { anexar(pai, f); });
      return pai;
    }
    if (typeof filhos === 'string' || typeof filhos === 'number') {
      pai.appendChild(document.createTextNode(String(filhos)));
      return pai;
    }
    if (filhos.nodeType) pai.appendChild(filhos);
    return pai;
  }

  function limpar(no) {
    while (no.firstChild) no.removeChild(no.firstChild);
    return no;
  }

  var toastTimer = null;
  function toast(msg, tipo) {
    var alvo = document.getElementById('toast');
    if (!alvo) return;
    alvo.textContent = msg;
    alvo.className = 'toast visivel' + (tipo ? ' ' + tipo : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { alvo.className = 'toast'; }, 2600);
  }

  /* Botão de áudio reaproveitado em várias telas. */
  function botaoSom(texto, rotulo) {
    return h('button.som', {
      type: 'button',
      'aria-label': rotulo || ('Ouvir ' + texto),
      title: rotulo || ('Ouvir ' + texto),
      onclick: function (ev) {
        ev.stopPropagation();
        if (!global.App.Speech.falar(texto)) {
          toast('Este aparelho não tem voz japonesa instalada.');
        }
      }
    }, '🔊');
  }

  function pct(n) { return Math.round(n) + '%'; }

  /* Anel de progresso em SVG. */
  function anel(valor, tamanho) {
    var s = tamanho || 96;
    var r = (s / 2) - 7;
    var c = 2 * Math.PI * r;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + s + ' ' + s);
    svg.setAttribute('width', s);
    svg.setAttribute('height', s);
    svg.setAttribute('class', 'anel');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Progresso: ' + pct(valor));

    var base = document.createElementNS(ns, 'circle');
    base.setAttribute('cx', s / 2); base.setAttribute('cy', s / 2); base.setAttribute('r', r);
    base.setAttribute('class', 'anel-base');

    var arco = document.createElementNS(ns, 'circle');
    arco.setAttribute('cx', s / 2); arco.setAttribute('cy', s / 2); arco.setAttribute('r', r);
    arco.setAttribute('class', 'anel-arco');
    arco.setAttribute('stroke-dasharray', c);
    arco.setAttribute('stroke-dashoffset', c * (1 - Math.max(0, Math.min(100, valor)) / 100));
    arco.setAttribute('transform', 'rotate(-90 ' + (s / 2) + ' ' + (s / 2) + ')');

    var txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', s / 2); txt.setAttribute('y', s / 2);
    txt.setAttribute('class', 'anel-texto');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'central');
    txt.textContent = pct(valor);

    svg.appendChild(base); svg.appendChild(arco); svg.appendChild(txt);
    return svg;
  }

  global.App = global.App || {};
  global.App.UI = {
    h: h,
    limpar: limpar,
    toast: toast,
    botaoSom: botaoSom,
    anel: anel,
    pct: pct
  };
})(window);
