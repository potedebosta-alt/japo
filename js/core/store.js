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
  var storageOk = true;
  var timer = null;

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
      var parsed = JSON.parse(raw);
      state = merge(base(), parsed);
      /* Arrays não passam pelo merge campo a campo. */
      if (Array.isArray(parsed.notas)) state.notas = parsed.notas;
      if (Array.isArray(parsed.chat)) state.chat = parsed.chat;
      ['hiragana', 'katakana'].forEach(function (s) {
        if (parsed.stats && parsed.stats[s]) state.stats[s] = parsed.stats[s];
      });
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
      return true;
    } catch (e) {
      /* Cota cheia não significa storage bloqueado: o app continua salvando
       * o resto normalmente depois que o usuário liberar espaço. */
      if (!e || e.name !== 'QuotaExceededError') storageOk = false;
      return false;
    }
  }

  function saveNow() { salvarAgora(); }

  function save() {
    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(function () { timer = null; saveNow(); }, SAVE_DELAY);
  }

  function statsOf(system) {
    if (!state.stats[system]) state.stats[system] = {};
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
    init: function () { load(); return this; },
    get state() { return state; },
    ok: function () { return storageOk; },
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
      state = merge(base(), parsed);
      if (Array.isArray(parsed.notas)) state.notas = parsed.notas;
      if (Array.isArray(parsed.chat)) state.chat = parsed.chat;
      ['hiragana', 'katakana'].forEach(function (s) {
        if (parsed.stats[s]) state.stats[s] = parsed.stats[s];
      });
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
