/* Repetição espaçada.
 *
 * Modelo Leitner com intervalos crescentes (inspirado no SM-2, sem a complexidade
 * do fator de facilidade, que rende pouco num baralho de 104 itens curtos):
 *
 *   nível 0 → 1 min (volta na mesma sessão)   nível 4 → 1 dia
 *   nível 1 → 10 min                          nível 5 → 3 dias
 *   nível 2 → 1 hora                          nível 6 → 7 dias
 *   nível 3 → 8 horas                         nível 7 → 21 dias
 *
 * Acerto sobe um nível; erro desce dois e devolve o kana para a fila imediata.
 * Acerto lento sobe de nível mas com metade do intervalo — o objetivo é
 * reconhecimento automático, não acerto sofrido.
 */
(function (global) {
  'use strict';

  var MIN = 60000, H = 60 * MIN, D = 24 * H;
  var INTERVALS = [1 * MIN, 10 * MIN, 1 * H, 8 * H, 1 * D, 3 * D, 7 * D, 21 * D];
  var MAX_LVL = INTERVALS.length - 1;
  var FAST_MS = 3000;   /* abaixo disso conta como fluente */
  var SLOW_MS = 5000;   /* acima disso o intervalo é cortado pela metade */
  var ERRO_QUENTE = 30 * MIN;
  var MASTER_LVL = 6;

  function Store() { return global.App.Store; }

  function acertoRecente(e) {
    var h = e.hist || '';
    if (!h) return 0;
    var ult = h.slice(-5);
    var certas = 0;
    for (var i = 0; i < ult.length; i++) if (ult[i] === '1') certas++;
    return certas / ult.length;
  }

  function dominado(e) {
    return !!e && e.lvl >= MASTER_LVL && e.rt > 0 && e.rt <= FAST_MS && acertoRecente(e) >= 0.8;
  }

  function status(e, now) {
    now = now || Date.now();
    if (!e || !e.n) return 'novo';
    if (dominado(e)) return 'dominado';
    if (e.lvl <= 1) return 'revisar';
    if (e.due && now >= e.due) return 'revisar';
    return 'aprendendo';
  }

  function registrar(system, kana, correto, rt, escolhido) {
    var e = Store().entryFor(system, kana);
    var t = Store().totais(system);
    var now = Date.now();
    rt = Math.max(200, rt || 0);

    e.n++;
    e.last = now;
    e.rt = e.rt ? Math.round(e.rt * 0.7 + rt * 0.3) : rt;
    e.hist = ((e.hist || '') + (correto ? '1' : '0')).slice(-10);

    if (correto) {
      e.ok++;
      e.streak = (e.streak || 0) + 1;
      e.lvl = Math.min(MAX_LVL, (e.lvl || 0) + 1);
      var iv = INTERVALS[e.lvl];
      if (rt > SLOW_MS) iv = Math.round(iv / 2);
      e.due = now + iv;
    } else {
      e.no++;
      e.streak = 0;
      e.lvl = Math.max(0, (e.lvl || 0) - 2);
      e.lastWrong = now;
      e.due = now;
      /* matriz de confusão: com o que este kana foi trocado */
      if (escolhido && escolhido !== kana) {
        e.conf[escolhido] = (e.conf[escolhido] || 0) + 1;
      }
    }

    t.resp++;
    if (correto) {
      t.certas++;
      t.streak++;
      if (t.streak > t.melhor) t.melhor = t.streak;
    } else {
      t.streak = 0;
    }
    Store().save();
    return e;
  }

  /* Peso da amostragem: quanto maior, mais chance de cair na próxima questão. */
  function peso(e, now) {
    if (!e || !e.n) return 5;
    var w = 1 + 2.2 * (MAX_LVL - Math.min(MAX_LVL, e.lvl));
    if (e.due && now >= e.due) {
      var atraso = (now - e.due) / (12 * H);
      w *= 1 + Math.min(3, atraso);
    } else {
      w *= 0.3; /* ainda não venceu: aparece pouco, mas não some */
    }
    if (e.lastWrong && now - e.lastWrong < ERRO_QUENTE) w *= 2.5;
    return w;
  }

  /* Escolhe o próximo kana de um conjunto.
   * opts: { evitar: [kana], permitirNovos: bool } */
  function escolher(system, pool, opts) {
    opts = opts || {};
    var now = Date.now();
    var evitar = opts.evitar || [];
    var candidatos = pool.filter(function (item) {
      if (evitar.indexOf(item.kana) !== -1) return false;
      if (!opts.permitirNovos) {
        var e = Store().peek(system, item.kana);
        if (!e || !e.n) return false;
      }
      return true;
    });
    /* Se filtrar demais (baralho pequeno ou tudo novo), afrouxa. */
    if (!candidatos.length) {
      candidatos = pool.filter(function (i) { return evitar.indexOf(i.kana) === -1; });
    }
    if (!candidatos.length) candidatos = pool.slice();
    if (!candidatos.length) return null;

    var pesos = candidatos.map(function (item) {
      return peso(Store().peek(system, item.kana), now);
    });
    var soma = pesos.reduce(function (a, b) { return a + b; }, 0);
    var alvo = Math.random() * soma;
    for (var i = 0; i < candidatos.length; i++) {
      alvo -= pesos[i];
      if (alvo <= 0) return candidatos[i];
    }
    return candidatos[candidatos.length - 1];
  }

  /* Kana vencidos (prontos para revisar), do mais atrasado para o menos. */
  function vencidos(system, pool) {
    var now = Date.now();
    return pool
      .filter(function (item) {
        var e = Store().peek(system, item.kana);
        return e && e.n && e.due && now >= e.due && !dominado(e);
      })
      .sort(function (a, b) {
        return Store().peek(system, a.kana).due - Store().peek(system, b.kana).due;
      });
  }

  /* Erros recentes, do mais recente para o mais antigo. */
  function errosRecentes(system, pool, limite) {
    return pool
      .filter(function (item) {
        var e = Store().peek(system, item.kana);
        return e && e.lastWrong;
      })
      .sort(function (a, b) {
        return Store().peek(system, b.kana).lastWrong - Store().peek(system, a.kana).lastWrong;
      })
      .slice(0, limite || 999);
  }

  /* Monta a sessão de revisão: erros recentes primeiro, depois vencidos,
   * depois os mais fracos. Nunca vazia se o usuário já praticou algo. */
  function sessaoRevisao(system, pool, tamanho) {
    tamanho = tamanho || 14;
    var vistos = {};
    var lista = [];
    function add(items) {
      items.forEach(function (i) {
        if (lista.length >= tamanho || vistos[i.kana]) return;
        vistos[i.kana] = 1;
        lista.push(i);
      });
    }
    add(errosRecentes(system, pool, tamanho));
    add(vencidos(system, pool));
    add(pool.filter(function (i) {
      var e = Store().peek(system, i.kana);
      return e && e.n && !dominado(e);
    }).sort(function (a, b) {
      var ea = Store().peek(system, a.kana), eb = Store().peek(system, b.kana);
      return (ea.lvl - eb.lvl) || (eb.no - ea.no);
    }));

    /* Quem praticou um kana só receberia esse mesmo kana oito vezes seguidas.
     * Completa com vizinhos de linha e, se ainda faltar, com kana novos —
     * revisar sozinho não é revisar, é repetir. */
    if (lista.length < 4) {
      var linhas = {};
      lista.forEach(function (i) { linhas[i.group] = 1; });
      add(pool.filter(function (i) { return linhas[i.group]; }));
      add(pool.filter(function (i) { return i.type === 'gojuon'; }));
      add(pool);
    }
    return lista;
  }

  function resumo(system, pool) {
    var now = Date.now();
    var r = { total: pool.length, novos: 0, aprendendo: 0, revisar: 0, dominados: 0, pontos: 0, devidos: 0 };
    pool.forEach(function (item) {
      var e = Store().peek(system, item.kana);
      var st = status(e, now);
      if (st === 'novo') r.novos++;
      else if (st === 'aprendendo') r.aprendendo++;
      else if (st === 'revisar') r.revisar++;
      else r.dominados++;
      if (e) {
        /* Nível corrompido (texto, negativo) virava "NaN%" no anel. */
        var lvl = Math.round(Number(e.lvl));
        r.pontos += Math.max(0, Math.min(MAX_LVL, isFinite(lvl) ? lvl : 0));
        if (e.n && e.due && now >= e.due && !dominado(e)) r.devidos++;
      }
    });
    r.pct = pool.length ? Math.round((r.pontos / (MAX_LVL * pool.length)) * 100) : 0;
    var t = Store().totais(system);
    r.respondidas = t.resp;
    r.acerto = t.resp ? Math.round((t.certas / t.resp) * 100) : 0;
    r.streak = t.streak;
    r.melhor = t.melhor;
    return r;
  }

  /* Com que kana este é mais confundido (dados do próprio usuário). */
  function confusoes(system, kana) {
    var e = Store().peek(system, kana);
    if (!e || !e.conf) return [];
    return Object.keys(e.conf)
      .map(function (k) { return { kana: k, vezes: e.conf[k] }; })
      .sort(function (a, b) { return b.vezes - a.vezes; });
  }

  global.App = global.App || {};
  global.App.SRS = {
    INTERVALS: INTERVALS, MAX_LVL: MAX_LVL, FAST_MS: FAST_MS,
    registrar: registrar,
    status: status,
    dominado: dominado,
    acertoRecente: acertoRecente,
    peso: peso,
    escolher: escolher,
    vencidos: vencidos,
    errosRecentes: errosRecentes,
    sessaoRevisao: sessaoRevisao,
    resumo: resumo,
    confusoes: confusoes
  };
})(window);
