/* Áudio pela voz japonesa do próprio aparelho (Web Speech API).
 * Sem servidor e sem arquivos de som: funciona offline se o sistema tiver
 * uma voz ja-JP instalada. Se não tiver, o app esconde o exercício de escuta. */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis || null;
  var voz = null;
  var procurou = false;
  var ouvintes = [];

  function escolherVoz() {
    if (!synth) return null;
    var vozes = [];
    try { vozes = synth.getVoices() || []; } catch (e) { vozes = []; }
    if (!vozes.length) return null;
    procurou = true;

    var preferida = (global.App.Store && global.App.Store.ajustes().voz) || '';
    var achada = null;
    vozes.forEach(function (v) {
      if (achada) return;
      if (preferida && v.name === preferida) achada = v;
    });
    if (!achada) {
      vozes.forEach(function (v) {
        if (achada) return;
        var lang = (v.lang || '').toLowerCase().replace('_', '-');
        if (lang === 'ja-jp' || lang.indexOf('ja') === 0) achada = v;
      });
    }
    voz = achada;
    return voz;
  }

  function avisar() {
    var lista = ouvintes.slice();
    ouvintes.length = 0;
    lista.forEach(function (fn) { try { fn(!!voz); } catch (e) {} });
  }

  if (synth) {
    escolherVoz();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', function () {
        escolherVoz();
        avisar();
      });
    } else {
      synth.onvoiceschanged = function () { escolherVoz(); avisar(); };
    }
    /* Chrome às vezes só popula as vozes depois de um tick. */
    global.setTimeout(function () { if (!voz) { escolherVoz(); avisar(); } }, 400);
  }

  global.App = global.App || {};
  global.App.Speech = {
    suportado: function () { return !!synth; },
    disponivel: function () { return !!(synth && (voz || !procurou)); },
    vozes: function () {
      if (!synth) return [];
      try {
        return (synth.getVoices() || []).filter(function (v) {
          return (v.lang || '').toLowerCase().indexOf('ja') === 0;
        });
      } catch (e) { return []; }
    },
    /* Chama fn(disponivel) assim que as vozes carregarem. */
    aoCarregar: function (fn) {
      if (!synth) { fn(false); return; }
      if (procurou) { fn(!!voz); return; }
      ouvintes.push(fn);
    },
    usarVoz: function (nome) {
      global.App.Store.ajustes().voz = nome || '';
      global.App.Store.save();
      escolherVoz();
    },
    falar: function (texto, opcoes) {
      if (!synth || !texto) return false;
      opcoes = opcoes || {};
      try {
        synth.cancel();
        var u = new global.SpeechSynthesisUtterance(texto);
        u.lang = 'ja-JP';
        u.rate = opcoes.rate || 0.85;
        u.pitch = 1;
        if (!voz) escolherVoz();
        if (voz) u.voice = voz;
        synth.speak(u);
        return true;
      } catch (e) {
        return false;
      }
    },
    parar: function () { try { if (synth) synth.cancel(); } catch (e) {} }
  };
})(window);
