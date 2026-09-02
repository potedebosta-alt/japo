/* Troca de tema visual.
 *
 * O tema é só um atributo no elemento raiz (data-tema); todo o resto é CSS em
 * css/temas.css. "auto" remove o atributo e devolve o comportamento padrão,
 * que segue o claro/escuro do sistema. */
(function (global) {
  'use strict';

  var CHAVE = 'japo:v1';

  var LISTA = [
    { id: 'auto', nome: 'Automático', desc: 'Segue o claro/escuro do sistema', cor: '#faf8f4' },
    { id: 'papel', nome: 'Papel', desc: 'Claro sempre, com grão de papel', cor: '#faf8f4' },
    { id: 'higanbana', nome: 'Higanbana', desc: 'Noite azul com lírios-aranha', cor: '#0d1020' },
    { id: 'cartaz', nome: 'Cartaz', desc: 'Ocre vintage com ondas seigaiha', cor: '#e5d5b8' },
    { id: 'kitsune', nome: 'Kitsune', desc: 'Preto e vermelho com sakura', cor: '#0a0a0c' }
  ];

  function valido(id) {
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return true;
    return false;
  }

  /* Lê a preferência mesmo antes do Store carregar, para o tema já entrar
   * na primeira pintura em vez de piscar o padrão. */
  function lerSalvo() {
    if (global.App && global.App.Store && global.App.Store.ajustes) {
      var a = global.App.Store.ajustes();
      if (a && a.tema) return a.tema;
    }
    try {
      var bruto = global.localStorage.getItem(CHAVE);
      if (!bruto) return 'auto';
      var dados = JSON.parse(bruto);
      return (dados && dados.ajustes && dados.ajustes.tema) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function corDe(id) {
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i].cor;
    return null;
  }

  /* Guarda o content de cada meta na primeira passada, antes de qualquer tema
   * sobrescrever. São duas metas no index.html — uma para o esquema claro e
   * outra para o escuro —, e cada uma precisa voltar ao valor dela. */
  function guardarCoresOriginais(metas) {
    for (var i = 0; i < metas.length; i++) {
      if (!metas[i].hasAttribute('data-cor-original')) {
        metas[i].setAttribute('data-cor-original', metas[i].getAttribute('content') || '');
      }
    }
  }

  function pintarBarraDoNavegador(id) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    if (!metas.length) return;
    guardarCoresOriginais(metas);
    if (id === 'auto') {
      /* Volta às duas metas originais (uma por esquema de cor). */
      for (var i = 0; i < metas.length; i++) {
        var original = metas[i].getAttribute('data-cor-original');
        if (original) metas[i].setAttribute('content', original);
        metas[i].removeAttribute('data-tema-forcado');
      }
      return;
    }
    var cor = corDe(id);
    if (!cor) return;
    for (var j = 0; j < metas.length; j++) {
      metas[j].setAttribute('content', cor);
      metas[j].setAttribute('data-tema-forcado', '');
    }
  }

  function marcar(id) {
    var raiz = document.documentElement;
    if (!id || id === 'auto') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', id);
    pintarBarraDoNavegador(id || 'auto');
  }

  global.App = global.App || {};
  global.App.Themes = {
    LISTA: LISTA,
    atual: function () {
      var id = lerSalvo();
      return valido(id) ? id : 'auto';
    },
    aplicar: function (id) {
      if (!valido(id)) id = 'auto';
      if (global.App.Store && global.App.Store.ajustes) {
        global.App.Store.ajustes().tema = id;
        global.App.Store.save();
      }
      marcar(id);
      return id;
    },
    iniciar: function () { marcar(this.atual()); }
  };

  /* Aplica na hora em que o arquivo carrega: o script fica antes do app.js,
   * então o tema já está valendo quando a primeira tela é desenhada. */
  global.App.Themes.iniciar();
})(window);
