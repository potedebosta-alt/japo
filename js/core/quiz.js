/* Geração das questões.
 *
 * Dois princípios de aprendizagem guiam este arquivo:
 *
 * 1. Dificuldade progressiva ("desirable difficulties"): kana novo entra em
 *    múltipla escolha (reconhecimento) e vai subindo até a digitação livre
 *    (recordação pura), que é onde a memória realmente se fixa.
 * 2. Distratores propositais: as alternativas erradas preferem os kana que
 *    SE PARECEM com o certo — e, melhor ainda, aqueles com que o próprio
 *    usuário já confundiu. Treinar a discriminação vale mais do que acertar fácil.
 */
(function (global) {
  'use strict';

  var TIPOS = {
    k2r: { id: 'k2r', nome: 'Kana → romaji', desc: 'Veja o kana, escolha a leitura' },
    r2k: { id: 'r2k', nome: 'Romaji → kana', desc: 'Veja a leitura, escolha o kana' },
    digitar: { id: 'digitar', nome: 'Digitar', desc: 'Escreva a leitura' },
    audio: { id: 'audio', nome: 'Ouvir', desc: 'Ouça e escolha o kana' }
  };

  function sorteio(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  function tipoPara(nivel, permitirAudio) {
    var opcoes;
    if (nivel <= 1) opcoes = ['k2r', 'k2r', 'r2k'];
    else if (nivel <= 3) opcoes = ['r2k', 'k2r', 'digitar', 'audio'];
    else opcoes = ['digitar', 'digitar', 'r2k', 'audio'];
    if (!permitirAudio) opcoes = opcoes.filter(function (t) { return t !== 'audio'; });
    return sorteio(opcoes);
  }

  /* Ordena candidatos a distrator: confusões do usuário > semelhança visual >
   * mesma linha > resto do baralho. */
  function distratores(system, alvo, pool, quantos) {
    var usados = {};
    usados[alvo.romaji] = 1;
    var escolhidos = [];
    var byKana = global.App.Kana.get(system).byKana;

    function tentar(kana) {
      if (escolhidos.length >= quantos || !kana) return;
      var e = byKana[kana];
      if (!e || !e.quiz || usados[e.romaji]) return;
      if (pool.indexOf(e) === -1 && pool.length > quantos + 1) return;
      usados[e.romaji] = 1;
      escolhidos.push(e);
    }

    global.App.SRS.confusoes(system, alvo.kana).forEach(function (c) { tentar(c.kana); });
    global.App.Confusions.forKana(system, alvo.kana).forEach(function (c) { tentar(c.kana); });

    var mesmaLinha = pool.filter(function (e) { return e.group === alvo.group; });
    embaralhar(mesmaLinha).forEach(function (e) { tentar(e.kana); });

    embaralhar(pool.slice()).forEach(function (e) { tentar(e.kana); });

    /* Baralho pequeno demais: completa com qualquer kana do silabário. */
    if (escolhidos.length < quantos) {
      embaralhar(global.App.Kana.get(system).quiz.slice()).forEach(function (e) {
        if (escolhidos.length >= quantos) return;
        if (usados[e.romaji]) return;
        usados[e.romaji] = 1;
        escolhidos.push(e);
      });
    }
    return escolhidos.slice(0, quantos);
  }

  function embaralhar(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function montar(system, alvo, pool, opts) {
    opts = opts || {};
    var e = global.App.Store.peek(system, alvo.kana);
    var nivel = e ? (e.lvl || 0) : 0;
    var permitirAudio = opts.permitirAudio !== false;
    var tipo = opts.tipo && opts.tipo !== 'misto' ? opts.tipo : tipoPara(nivel, permitirAudio);
    if (tipo === 'audio' && !permitirAudio) tipo = 'k2r';

    var q = { tipo: tipo, entry: alvo, system: system, criadoEm: Date.now(), opcoes: [] };
    if (tipo !== 'digitar') {
      q.opcoes = embaralhar(distratores(system, alvo, pool, 3).concat([alvo]));
    }
    return q;
  }

  function verificar(q, resposta) {
    if (q.tipo === 'digitar') {
      var texto = global.App.Kana.normalize(resposta);
      var certo = q.entry.accepts.some(function (a) {
        return global.App.Kana.normalize(a) === texto;
      });
      return { correto: certo, escolhido: null, texto: resposta };
    }
    var escolhido = resposta;
    /* Comparação pelo SOM, não pelo símbolo: じ e ぢ ("ji") são ambos válidos. */
    var ok = !!escolhido && escolhido.romaji === q.entry.romaji;
    return { correto: ok, escolhido: escolhido ? escolhido.kana : null };
  }

  global.App = global.App || {};
  global.App.Quiz = {
    TIPOS: TIPOS,
    montar: montar,
    verificar: verificar,
    embaralhar: embaralhar
  };
})(window);
