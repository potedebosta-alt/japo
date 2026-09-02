/* Motor de dicas das anotações.
 *
 * Lê o que a pessoa escreveu e devolve complementos: leitura, pronúncia,
 * mnemônica, o equivalente no outro silabário, kana parecidos e — o que nenhum
 * livro faz — o desempenho real dela naquele kana.
 *
 * Tudo local e determinístico: nenhuma chamada de rede, funciona offline.
 * (A IA opcional em js/core/ai.js é um extra por cima disto, nunca um requisito.) */
(function (global) {
  'use strict';

  var GATILHOS_CONFUSAO = /(confund|confus|parecid|troco|troca|igual|semelhan|esque|dif[ií]cil|n[ãa]o lembro|nunca lembro|erro|errei)/i;
  var GATILHOS_SOM = /(pron[uú]nci|som|falar|fala|[aá]udio|escut)/i;

  function K() { return global.App.Kana; }

  function agora() { return Date.now(); }

  function haQuanto(ts) {
    if (!ts) return '';
    var d = agora() - ts;
    var min = Math.round(d / 60000);
    if (min < 1) return 'agora há pouco';
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + 'h';
    var dias = Math.round(h / 24);
    return dias === 1 ? 'ontem' : 'há ' + dias + ' dias';
  }

  /* Encontra os kana citados no texto, na ordem em que aparecem.
   * Testa dois caracteres primeiro para capturar きゃ, シュ etc. */
  function kanaNoTexto(texto) {
    var achados = [];
    var vistos = {};
    var i = 0;
    while (i < texto.length) {
      var par = texto.substr(i, 2);
      var e = par.length === 2 ? K().find(par) : null;
      var tam = 1;
      if (e) {
        tam = 2;
      } else {
        e = K().find(texto[i]);
      }
      if (e) {
        if (!vistos[e.kana]) { vistos[e.kana] = 1; achados.push(e); }
        i += tam;
      } else {
        i += 1;
      }
    }
    return achados;
  }

  /* Romaji escrito por extenso ("ka", "shi", "kya") que ainda não veio como kana. */
  function romajiNoTexto(texto, jaCitados, sistema) {
    var sys = K().get(sistema);
    var palavras = texto.toLowerCase().match(/[a-z]{1,4}/g) || [];
    var achados = [];
    var vistos = {};
    palavras.forEach(function (p) {
      var lista = sys.byRomaji[p];
      if (!lista || !lista.length) return;
      var e = lista[0];
      if (vistos[e.kana]) return;
      if (jaCitados.some(function (c) { return c.romaji === e.romaji; })) return;
      vistos[e.kana] = 1;
      achados.push(e);
    });
    return achados;
  }

  function palavrasNoTexto(texto) {
    var achadas = [];
    ['hiragana', 'katakana'].forEach(function (sid) {
      K().get(sid).all.forEach(function (e) {
        if (e.word && e.word.length > 1 && texto.indexOf(e.word) !== -1) {
          if (!achadas.some(function (x) { return x.word === e.word; })) achadas.push(e);
        }
      });
    });
    return achadas.slice(0, 3);
  }

  function desempenho(sistema, kana) {
    var st = global.App.Store.peek(sistema, kana);
    if (!st || !st.n) return { texto: 'Você ainda não praticou este kana.', status: 'novo' };
    var status = global.App.SRS.status(st);
    var rotulos = { novo: 'novo', aprendendo: 'em aprendizado', revisar: 'precisa de revisão', dominado: 'dominado' };
    var partes = ['Seu histórico: ' + st.ok + ' acertos e ' + st.no + ' erros (' + rotulos[status] + ')'];
    if (st.lastWrong) partes.push('errou ' + haQuanto(st.lastWrong));
    if (st.rt) partes.push('leva ~' + (st.rt / 1000).toFixed(1) + 's para responder');
    return { texto: partes.join(' · ') + '.', status: status };
  }

  function cardKana(e, sistema) {
    var par = K().counterpart(e.kana);
    var linhas = [];
    linhas.push(e.kana + ' = ' + e.romaji + ' — ' + e.pron);
    if (e.mnem) linhas.push('Mnemônica: ' + e.mnem);
    if (par) linhas.push('No outro silabário: ' + par);
    if (e.word) linhas.push('Exemplo: ' + e.word + ' (' + e.wordRomaji + ') = ' + e.meaning);

    var perf = desempenho(e.system, e.kana);
    var corpo = linhas.join('\n');

    return {
      id: 'kana-' + e.system + '-' + e.kana,
      tipo: 'kana',
      icone: e.kana,
      titulo: e.kana + ' · ' + e.romaji,
      corpo: corpo,
      nota: perf.texto,
      status: perf.status,
      inserir: e.kana + ' = ' + e.romaji + ' (' + e.pron + ')' + (e.word ? ' — ex.: ' + e.word + ' = ' + e.meaning : ''),
      kana: [e.kana],
      sistema: e.system
    };
  }

  function cardConfusao(e) {
    var pares = global.App.Confusions.forKana(e.system, e.kana);
    var meus = global.App.SRS.confusoes(e.system, e.kana);
    if (!pares.length && !meus.length) return null;

    var alvo = null, tip = '', motivo = '';
    if (meus.length) {
      alvo = meus[0].kana;
      tip = global.App.Confusions.tipFor(e.system, e.kana, alvo);
      motivo = 'Você já trocou ' + e.kana + ' por ' + alvo + ' ' + meus[0].vezes + 'x.';
    }
    if (!alvo) {
      alvo = pares[0].kana;
      tip = pares[0].tip;
      motivo = e.kana + ' costuma ser confundido com ' + alvo + '.';
    }
    if (!tip) tip = 'Compare os dois traço a traço.';

    return {
      id: 'conf-' + e.system + '-' + e.kana,
      tipo: 'confusao',
      icone: e.kana + '/' + alvo,
      titulo: 'Cuidado: ' + e.kana + ' × ' + alvo,
      corpo: motivo + '\n' + tip,
      inserir: e.kana + ' × ' + alvo + ': ' + tip,
      kana: [e.kana, alvo],
      sistema: e.system,
      acao: 'duelo'
    };
  }

  /* Kana mais fracos que a nota NÃO menciona — o complemento que faltou. */
  function cardLacuna(sistema, citados) {
    var pool = K().get(sistema).quiz;
    var fracos = global.App.SRS.errosRecentes(sistema, pool, 12).filter(function (e) {
      return citados.indexOf(e.kana) === -1;
    }).slice(0, 4);
    if (fracos.length < 2) return null;
    var lista = fracos.map(function (e) { return e.kana + ' (' + e.romaji + ')'; }).join(', ');
    return {
      id: 'lacuna-' + sistema,
      tipo: 'lacuna',
      icone: '◔',
      titulo: 'Você errou estes recentemente e não citou aqui',
      corpo: lista + '.\nVale anotar o que confunde em cada um — escrever com as próprias palavras fixa mais do que reler.',
      inserir: 'Revisar: ' + lista,
      kana: fracos.map(function (e) { return e.kana; }),
      sistema: sistema,
      acao: 'praticar'
    };
  }

  function cardVazio(sistema) {
    var sys = K().get(sistema);
    var alvo = global.App.SRS.errosRecentes(sistema, sys.quiz, 1)[0] || sys.quiz[0];
    return {
      id: 'vazio',
      tipo: 'modelo',
      icone: '✎',
      titulo: 'Comece por aqui',
      corpo: 'Escreva um kana (ex.: ' + alvo.kana + ') e as dicas aparecem sozinhas.\n' +
             'Anotar com as próprias palavras é o que transforma reconhecimento em memória.',
      inserir: alvo.kana + ' = ' + alvo.romaji + '\nCom o que eu confundo: \nComo eu lembro: ',
      kana: [alvo.kana],
      sistema: sistema
    };
  }

  function cardElaboracao(e) {
    return {
      id: 'elab-' + e.kana,
      tipo: 'modelo',
      icone: '?',
      titulo: 'Deixe a anotação mais forte',
      corpo: 'Responda em uma linha: que palavra do seu dia a dia lembra o som "' + e.romaji + '"?\n' +
             'Ligar o som a algo seu é mais eficaz do que decorar a mnemônica pronta.',
      inserir: 'O som "' + e.romaji + '" me lembra: ',
      kana: [e.kana],
      sistema: e.system
    };
  }

  function cardPalavra(e) {
    return {
      id: 'palavra-' + e.word,
      tipo: 'palavra',
      icone: '語',
      titulo: e.word,
      corpo: e.word + ' (' + e.wordRomaji + ') = ' + e.meaning + '.\nCada kana dessa palavra é uma chance de revisar.',
      inserir: e.word + ' = ' + e.meaning + ' (' + e.wordRomaji + ')',
      kana: kanaNoTexto(e.word).map(function (x) { return x.kana; }),
      sistema: e.system,
      acao: 'praticar'
    };
  }

  function cardSom(citados) {
    if (!citados.length) return null;
    var e = citados[0];
    return {
      id: 'som-' + e.kana,
      tipo: 'som',
      icone: '♪',
      titulo: 'Ouvir ' + e.kana,
      corpo: e.pron + (e.word ? '\nNa palavra ' + e.word + ' (' + e.wordRomaji + ').' : ''),
      falar: e.word || e.kana,
      kana: [e.kana],
      sistema: e.system
    };
  }

  function gerar(texto, opts) {
    opts = opts || {};
    var sistema = opts.sistema || global.App.Store.sistema();
    texto = String(texto || '');
    var cards = [];

    var citados = kanaNoTexto(texto);
    if (!citados.length) citados = romajiNoTexto(texto, [], sistema);

    if (texto.trim().length < 3 && !citados.length) {
      cards.push(cardVazio(sistema));
      var lac0 = cardLacuna(sistema, []);
      if (lac0) cards.push(lac0);
      return cards;
    }

    citados.slice(0, 5).forEach(function (e) {
      cards.push(cardKana(e, sistema));
    });

    if (GATILHOS_CONFUSAO.test(texto) || citados.length) {
      citados.slice(0, 3).forEach(function (e) {
        var c = cardConfusao(e);
        if (c) cards.push(c);
      });
    }

    if (GATILHOS_SOM.test(texto)) {
      var som = cardSom(citados);
      if (som) cards.push(som);
    }

    palavrasNoTexto(texto).forEach(function (e) { cards.push(cardPalavra(e)); });

    if (citados.length === 1 && texto.length < 160) cards.push(cardElaboracao(citados[0]));

    var lacuna = cardLacuna(sistema, citados.map(function (e) { return e.kana; }));
    if (lacuna) cards.push(lacuna);

    if (!cards.length) cards.push(cardVazio(sistema));

    /* Sem repetições e com um teto: sugestão demais vira ruído. */
    var vistos = {};
    return cards.filter(function (c) {
      if (vistos[c.id]) return false;
      vistos[c.id] = 1;
      return true;
    }).slice(0, 8);
  }

  global.App = global.App || {};
  global.App.Tips = {
    gerar: gerar,
    kanaNoTexto: kanaNoTexto,
    haQuanto: haQuanto
  };
})(window);
