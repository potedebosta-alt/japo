/* Persistência local. Sem login, sem servidor: tudo em localStorage.
 * Se o storage estiver bloqueado (aba anônima, cota cheia), o app continua
 * funcionando em memória — só avisa que o progresso não será salvo. */
(function (global) {
  'use strict';

  var KEY = 'japo:v1';
  var SAVE_DELAY = 250;

  function base() {
    return {
      v: 1,
      sistema: 'hiragana',
      escopo: 'gojuon',
      tipo: 'misto',
      stats: { hiragana: {}, katakana: {} },
      totais: {
        hiragana: { resp: 0, certas: 0, streak: 0, melhor: 0 },
        katakana: { resp: 0, certas: 0, streak: 0, melhor: 0 }
      },
      notas: [],
      chat: [],
      ajustes: { aiKey: '', aiModel: 'claude-opus-5', voz: '', tema: 'auto' }
    };
  }

  var state = base();
  var storageOk = true;      /* o navegador deixa gravar? */
  var cotaCheia = false;     /* deixa, mas não cabe mais nada */
  var timer = null;
  var aoFalhar = null;       /* avisa a interface quando uma gravação falha */
  var aoMudarFora = null;    /* avisa quando OUTRA ABA alterou os dados */
  var escritaPropria = false;

  var SISTEMAS = ['hiragana', 'katakana'];
  var ESCOPOS = ['gojuon', 'dakuten', 'tudo'];
  var TIPOS = ['misto', 'k2r', 'r2k', 'digitar', 'audio'];

  function umDe(valor, lista, padrao) {
    return lista.indexOf(valor) === -1 ? padrao : valor;
  }

  function numero(v, minimo, maximo, padrao) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (!isFinite(n)) return padrao;
    return Math.max(minimo, Math.min(maximo, n));
  }

  function texto(v) { return typeof v === 'string' ? v : ''; }

  /* Um arquivo de backup editado à mão, um dado truncado ou um erro de outra
   * versão do app não podem deixar a pessoa com o app em branco e sem saída —
   * ainda mais porque o botão de restaurar backup vive DENTRO de uma tela.
   * Então tudo que entra é checado campo a campo e cai no padrão quando vem
   * torto, em vez de explodir na primeira leitura. */
  function saneado(bruto) {
    var limpo = base();
    if (!bruto || typeof bruto !== 'object') return limpo;

    limpo.sistema = umDe(bruto.sistema, SISTEMAS, 'hiragana');
    limpo.escopo = umDe(bruto.escopo, ESCOPOS, 'gojuon');
    limpo.tipo = umDe(bruto.tipo, TIPOS, 'misto');

    SISTEMAS.forEach(function (s) {
      var origem = bruto.stats && bruto.stats[s];
      if (!origem || typeof origem !== 'object' || Array.isArray(origem)) return;
      Object.keys(origem).forEach(function (kana) {
        var e = origem[kana];
        if (!e || typeof e !== 'object') return;
        limpo.stats[s][kana] = {
          n: numero(e.n, 0, 1e6, 0),
          ok: numero(e.ok, 0, 1e6, 0),
          no: numero(e.no, 0, 1e6, 0),
          lvl: Math.round(numero(e.lvl, 0, 7, 0)),
          due: numero(e.due, 0, 1e15, 0),
          last: numero(e.last, 0, 1e15, 0),
          lastWrong: numero(e.lastWrong, 0, 1e15, 0),
          streak: numero(e.streak, 0, 1e6, 0),
          rt: numero(e.rt, 0, 6e5, 0),
          hist: texto(e.hist).slice(-10),
          conf: (e.conf && typeof e.conf === 'object' && !Array.isArray(e.conf)) ? e.conf : {}
        };
      });

      var t = bruto.totais && bruto.totais[s];
      if (t && typeof t === 'object') {
        limpo.totais[s] = {
          resp: numero(t.resp, 0, 1e9, 0),
          certas: numero(t.certas, 0, 1e9, 0),
          streak: numero(t.streak, 0, 1e9, 0),
          melhor: numero(t.melhor, 0, 1e9, 0)
        };
      }
    });

    if (Array.isArray(bruto.notas)) {
      limpo.notas = bruto.notas.filter(function (n) {
        return n && typeof n === 'object';
      }).map(function (n) {
        return {
          id: texto(n.id) || uid(),
          titulo: texto(n.titulo),
          texto: texto(n.texto),
          sistema: umDe(n.sistema, SISTEMAS, 'hiragana'),
          criadaEm: numero(n.criadaEm, 0, 1e15, Date.now()),
          editadaEm: numero(n.editadaEm, 0, 1e15, Date.now()),
          itens: Array.isArray(n.itens)
            ? n.itens.filter(function (i) { return i && typeof i === 'object' && i.tipo; })
            : []
        };
      });
    }

    if (Array.isArray(bruto.chat)) {
      limpo.chat = bruto.chat.filter(function (m) {
        return m && typeof m === 'object' && texto(m.texto);
      }).map(function (m) {
        return {
          papel: m.papel === 'assistant' ? 'assistant' : 'user',
          texto: texto(m.texto),
          em: numero(m.em, 0, 1e15, Date.now())
        };
      }).slice(-40);
    }

    if (bruto.ajustes && typeof bruto.ajustes === 'object') {
      limpo.ajustes = {
        aiKey: texto(bruto.ajustes.aiKey),
        aiModel: texto(bruto.ajustes.aiModel) || 'claude-opus-5',
        voz: texto(bruto.ajustes.voz),
        tema: texto(bruto.ajustes.tema) || 'auto'
      };
    }

    return limpo;
  }

  function merge(target, src) {
    if (!src || typeof src !== 'object') return target;
    Object.keys(target).forEach(function (k) {
      if (!(k in src)) return;
      if (target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        merge(target[k], src[k]);
      } else {
        target[k] = src[k];
      }
    });
    return target;
  }

  function load() {
    var raw = null;
    try { raw = global.localStorage.getItem(KEY); } catch (e) { storageOk = false; }
    if (!raw) return;
    try {
      state = saneado(JSON.parse(raw));
    } catch (e) {
      /* Dados corrompidos: recomeça em vez de travar o app. */
      state = base();
    }
  }

  /* Grava na hora e diz se conseguiu. Cota estourada é o caso comum aqui:
   * uma imagem fixada numa anotação pode passar do limite do navegador. */
  function salvarAgora() {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
      cotaCheia = false;
      escritaPropria = true;
      return true;
    } catch (e) {
      /* Cota cheia não é o mesmo que storage bloqueado, mas as duas coisas
       * significam progresso perdido — e falhar calado é o pior desfecho
       * possível num app que promete guardar o seu estudo. */
      if (e && e.name === 'QuotaExceededError') cotaCheia = true;
      else storageOk = false;
      if (aoFalhar) {
        try { aoFalhar(cotaCheia ? 'cheio' : 'bloqueado'); } catch (err) { /* nada */ }
      }
      return false;
    }
  }

  function saveNow() { salvarAgora(); }

  function save() {
    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(function () { timer = null; saveNow(); }, SAVE_DELAY);
  }

  /* Duas abas abertas escreviam por cima uma da outra: cada uma tinha sua
   * cópia do estado em memória e regravava o arquivo inteiro. Agora, quando
   * outra aba grava, esta relê o que ficou no disco antes de escrever de novo. */
  function ligarSincronizacaoEntreAbas() {
    if (!global.addEventListener) return;
    global.addEventListener('storage', function (ev) {
      if (ev.key !== KEY || escritaPropria) { escritaPropria = false; return; }
      if (timer) { global.clearTimeout(timer); timer = null; }
      load();
      if (aoMudarFora) {
        try { aoMudarFora(); } catch (e) { /* nada */ }
      }
    });
  }

  /* Responder e recarregar em seguida perdia a resposta: a gravação tem 250ms
   * de espera. Ao sair ou esconder a página, grava na hora. */
  function ligarGravacaoAoSair() {
    if (!global.addEventListener) return;
    function agora() {
      if (!timer) return;
      global.clearTimeout(timer);
      timer = null;
      salvarAgora();
    }
    global.addEventListener('pagehide', agora);
    global.addEventListener('beforeunload', agora);
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.visibilityState === 'hidden') agora();
    });
  }

  function statsOf(system) {
    /* Um backup com o tipo trocado (stats.hiragana = 7) travava a prática a
     * cada resposta. Se não for objeto, recomeça em vez de quebrar. */
    var atual = state.stats[system];
    if (!atual || typeof atual !== 'object' || Array.isArray(atual)) {
      state.stats[system] = {};
    }
    return state.stats[system];
  }

  function entryFor(system, kana) {
    var s = statsOf(system);
    if (!s[kana]) {
      s[kana] = { n: 0, ok: 0, no: 0, lvl: 0, due: 0, last: 0, lastWrong: 0, streak: 0, rt: 0, hist: '', conf: {} };
    }
    if (!s[kana].conf) s[kana].conf = {};
    return s[kana];
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  global.App = global.App || {};
  global.App.Store = {
    KEY: KEY,
    init: function () {
      load();
      ligarSincronizacaoEntreAbas();
      ligarGravacaoAoSair();
      return this;
    },
    get state() { return state; },
    ok: function () { return storageOk && !cotaCheia; },
    /* 'ok' | 'bloqueado' | 'cheio' — o app precisa distinguir para explicar
     * o que fazer: liberar espaço é diferente de sair da aba anônima. */
    estadoArmazenamento: function () {
      if (!storageOk) return 'bloqueado';
      if (cotaCheia) return 'cheio';
      return 'ok';
    },
    aoFalharGravacao: function (fn) { aoFalhar = fn; },
    aoMudarEmOutraAba: function (fn) { aoMudarFora = fn; },
    save: save,
    saveNow: saveNow,

    sistema: function (v) {
      if (v && (v === 'hiragana' || v === 'katakana')) { state.sistema = v; save(); }
      return state.sistema;
    },
    escopo: function (v) { if (v) { state.escopo = v; save(); } return state.escopo; },
    tipo: function (v) { if (v) { state.tipo = v; save(); } return state.tipo; },
    ajustes: function () { return state.ajustes; },

    statsOf: statsOf,
    entryFor: entryFor,
    peek: function (system, kana) { return statsOf(system)[kana] || null; },
    totais: function (system) { return state.totais[system]; },

    /* --- anotações --- */
    notas: function () { return state.notas; },
    nota: function (id) {
      return state.notas.filter(function (n) { return n.id === id; })[0] || null;
    },
    novaNota: function (sistema) {
      var n = {
        id: uid(), titulo: '', texto: '', itens: [], sistema: sistema || state.sistema,
        criadaEm: Date.now(), editadaEm: Date.now()
      };
      state.notas.unshift(n);
      save();
      return n;
    },

    /* --- itens fixados numa anotação (imagem, letra, kana, recorte) --- */
    itensNota: function (id) {
      var n = this.nota(id);
      if (!n) return [];
      if (!n.itens) n.itens = [];
      return n.itens;
    },
    /* Devolve false quando o navegador recusa gravar (cota estourada) e
     * desfaz o que acabou de ser acrescentado, para a anotação não ficar
     * com um item que sumiria no próximo carregamento. */
    fixarNaNota: function (id, item) {
      var itens = this.itensNota(id);
      item.id = uid();
      item.em = Date.now();
      itens.push(item);
      var n = this.nota(id);
      if (n) n.editadaEm = Date.now();
      if (!salvarAgora()) {
        itens.pop();
        salvarAgora();
        return null;
      }
      return item;
    },
    desafixar: function (id, itemId) {
      var n = this.nota(id);
      if (!n || !n.itens) return;
      n.itens = n.itens.filter(function (i) { return i.id !== itemId; });
      n.editadaEm = Date.now();
      salvarAgora();
    },
    salvarNota: function (id, campos) {
      var n = this.nota(id);
      if (!n) return null;
      Object.keys(campos).forEach(function (k) { n[k] = campos[k]; });
      n.editadaEm = Date.now();
      save();
      return n;
    },
    apagarNota: function (id) {
      state.notas = state.notas.filter(function (n) { return n.id !== id; });
      save();
    },

    /* --- chat com o tutor --- */
    chat: function () { return state.chat; },
    addChat: function (papel, texto) {
      state.chat.push({ papel: papel, texto: texto, em: Date.now() });
      /* Histórico curto: o que interessa é a conversa atual, não o arquivo dela. */
      if (state.chat.length > 40) state.chat = state.chat.slice(-40);
      save();
      return state.chat[state.chat.length - 1];
    },
    limparChat: function () { state.chat = []; save(); },

    /* --- backup --- */
    /* O backup sai SEM a chave da API: é um arquivo que a pessoa manda por
     * e-mail, guarda na nuvem ou passa para outro aparelho, e uma credencial
     * não pode viajar junto por acidente. */
    exportar: function () {
      var copia = JSON.parse(JSON.stringify(state));
      if (copia.ajustes) copia.ajustes.aiKey = '';
      return JSON.stringify(copia, null, 2);
    },
    importar: function (json) {
      var parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.stats) throw new Error('Arquivo inválido');
      /* A chave que já está neste aparelho manda: um backup não sobrescreve
       * (nem apaga) a credencial de quem está importando. */
      var chaveLocal = state.ajustes && state.ajustes.aiKey;
      /* Mesmo saneamento da carga: um arquivo torto não pode deixar o app
       * em branco justamente na tela onde fica o botão de restaurar. */
      state = saneado(parsed);
      if (chaveLocal) state.ajustes.aiKey = chaveLocal;
      saveNow();
    },
    zerarProgresso: function (system) {
      if (system) {
        state.stats[system] = {};
        state.totais[system] = { resp: 0, certas: 0, streak: 0, melhor: 0 };
      } else {
        /* Zerar tudo apaga o progresso, não o que a pessoa escreveu. */
        var notas = state.notas, ajustes = state.ajustes, chat = state.chat;
        state = base();
        state.notas = notas;
        state.ajustes = ajustes;
        state.chat = chat;
      }
      saveNow();
    }
  };
})(window);
