/* Roteador e inicialização.
 * Rotas por hash para que o botão "voltar" do navegador e do Android funcionem
 * de graça, sem nenhuma biblioteca. */
(function (global) {
  'use strict';

  var ROTAS = ['home', 'tabela', 'estudar', 'praticar', 'revisao', 'notas', 'musicas', 'chat', 'progresso', 'ajustes'];
  var TITULO_BASE = 'かな — Hiragana e Katakana';

  var rotaAtual = 'home';
  var paramsAtuais = {};
  var paramsPendentes = null;

  function elTela() { return document.getElementById('tela'); }

  function lerHash() {
    var bruto = (global.location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROTAS.indexOf(bruto) !== -1 ? bruto : 'home';
  }

  function desenhar() {
    var tela = global.App.Screens[rotaAtual] || global.App.Screens.home;
    var alvo = elTela();
    global.App.UI.limpar(alvo);

    /* Reinicia a animação de entrada a cada troca de tela. */
    alvo.classList.remove('tela');
    void alvo.offsetWidth;
    alvo.classList.add('tela');

    var titulo = document.getElementById('titulo');
    global.App.UI.limpar(titulo);
    if (tela.titulo) {
      titulo.appendChild(document.createTextNode(tela.titulo));
      document.title = tela.titulo + ' · ' + TITULO_BASE;
    } else {
      titulo.appendChild(global.App.UI.h('span.marca', { text: 'かな' }));
      document.title = TITULO_BASE;
    }

    var voltar = document.getElementById('voltar');
    if (rotaAtual === 'home') voltar.setAttribute('hidden', '');
    else voltar.removeAttribute('hidden');

    tela.render(alvo, paramsAtuais);
    global.scrollTo(0, 0);
  }

  function aoTrocarHash() {
    var nova = lerHash();
    rotaAtual = nova;
    paramsAtuais = paramsPendentes || {};
    paramsPendentes = null;
    global.App.Speech.parar();
    desenhar();
  }

  function ir(rota, params) {
    if (ROTAS.indexOf(rota) === -1) rota = 'home';
    paramsPendentes = params || {};
    var destino = '#/' + rota;
    if (global.location.hash === destino) {
      aoTrocarHash();
    } else {
      global.location.hash = destino;
    }
  }

  function voltar() {
    if (global.history.length > 1) global.history.back();
    else ir('home');
  }

  function recarregar() { desenhar(); }

  function teclado(ev) {
    var alvo = ev.target || {};
    var tag = (alvo.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || alvo.isContentEditable) {
      /* Só o Escape escapa de dentro de um campo. */
      if (ev.key === 'Escape' && alvo.blur) alvo.blur();
      return;
    }
    if (ev.key === 'Escape' && rotaAtual !== 'home') { ir('home'); return; }
    var tela = global.App.Screens[rotaAtual];
    if (tela && typeof tela.teclado === 'function') tela.teclado(ev);
  }

  function registrarSW() {
    if (!('serviceWorker' in global.navigator)) return;
    if (global.location.protocol !== 'http:' && global.location.protocol !== 'https:') return;
    global.addEventListener('load', function () {
      global.navigator.serviceWorker.register('sw.js').catch(function () {
        /* Sem service worker o app continua funcionando, só não fica offline. */
      });
    });
  }

  function iniciar() {
    global.App.Store.init();

    var voz = global.App.Store.ajustes().voz;
    if (voz) global.App.Speech.usarVoz(voz);

    document.getElementById('voltar').addEventListener('click', voltar);
    global.addEventListener('hashchange', aoTrocarHash);
    document.addEventListener('keydown', teclado);

    if (!global.location.hash) global.location.replace('#/home');
    aoTrocarHash();

    if (!global.App.Store.ok()) {
      global.App.UI.toast('Este navegador está bloqueando o armazenamento: o progresso não será salvo.');
    }

    registrarSW();
  }

  global.App = global.App || {};
  global.App.ir = ir;
  global.App.voltar = voltar;
  global.App.recarregar = recarregar;
  global.App.rota = function () { return rotaAtual; };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);
