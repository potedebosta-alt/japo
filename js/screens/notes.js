/* Anotações com complemento automático.
 *
 * Escrever com as próprias palavras é uma das formas mais eficazes de fixar —
 * então em vez de só guardar o texto, o app lê o que você escreveu e devolve o
 * que falta: leitura, pronúncia, mnemônica, o kana parecido que você costuma
 * trocar e o seu próprio histórico naquele símbolo. Tudo offline. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var estado = { abertaId: null };
  var timerSalvar = null;
  var timerDicas = null;

  function data(ts) {
    try {
      return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch (e) { return ''; }
  }

  function resumo(nota) {
    var t = (nota.texto || '').replace(/\s+/g, ' ').trim();
    if (!t) return 'Vazia · ' + data(nota.editadaEm);
    return (t.length > 60 ? t.slice(0, 60) + '…' : t) + ' · ' + data(nota.editadaEm);
  }

  /* ---------- lista ---------- */

  function lista(raiz) {
    var notas = global.App.Store.notas();

    raiz.appendChild(h('div', {}, [
      h('button.btn.btn-primario.btn-largo', {
        type: 'button',
        onclick: function () {
          var n = global.App.Store.novaNota(global.App.Store.sistema());
          estado.abertaId = n.id;
          global.App.recarregar();
        }
      }, 'Nova anotação'),

      notas.length
        ? h('div.lista-notas', {}, notas.map(function (n) {
            return h('button.item-nota', {
              type: 'button',
              onclick: function () { estado.abertaId = n.id; global.App.recarregar(); }
            }, [
              h('span.corpo', {}, [
                h('b', { text: n.titulo || 'Sem título' }),
                h('span', { text: resumo(n) })
              ]),
              h('span.mini.kana-s', { text: n.sistema === 'katakana' ? 'カ' : 'ひ' })
            ]);
          }))
        : h('div.vazio', {}, [
            h('div.kana-g', { text: '筆' }),
            h('p', { text: 'Nenhuma anotação ainda.' }),
            h('p.mini', { text: 'Escreva um kana e o app completa com leitura, mnemônica e o que você costuma errar.' })
          ])
    ]));
  }

  /* ---------- editor ---------- */

  function cartaoSugestao(c, aoInserir) {
    var acoes = [];

    if (c.inserir) {
      acoes.push(h('button.mini-btn', {
        type: 'button',
        onclick: function () { aoInserir(c.inserir); }
      }, 'Inserir na nota'));
    }
    if (c.kana && c.kana.length > 1) {
      acoes.push(h('button.mini-btn', {
        type: 'button',
        onclick: function () {
          global.App.Practice.iniciar({ titulo: 'Kana da anotação', kanas: c.kana });
        }
      }, c.acao === 'duelo' ? 'Treinar o par' : 'Praticar'));
    }
    if (c.falar) {
      acoes.push(h('button.mini-btn', {
        type: 'button',
        onclick: function () {
          if (!global.App.Speech.falar(c.falar)) {
            global.App.UI.toast('Este aparelho não tem voz japonesa instalada.');
          }
        }
      }, 'Ouvir'));
    }

    return h('div.sugestao', {}, [
      h('span.marca', { text: c.icone }),
      h('div.conteudo', {}, [
        h('b.titulo-sug', { text: c.titulo }),
        c.nota ? h('div.desempenho', { text: c.nota }) : null,
        h('p', { text: c.corpo }),
        acoes.length ? h('div.rodape', {}, acoes) : null
      ])
    ]);
  }

  function editor(raiz, nota) {
    var caixaDicas = h('div.sugestoes');
    var caixaIA = h('div.sugestoes');
    var area;

    function inserir(texto) {
      var atual = area.value;
      area.value = atual && atual.trim() ? atual.replace(/\s*$/, '') + '\n' + texto : texto;
      salvar();
      atualizarDicas();
      area.focus();
      global.App.UI.toast('Adicionado à anotação.');
    }

    function atualizarDicas() {
      var cartoes = global.App.Tips.gerar(area.value, { sistema: nota.sistema });
      global.App.UI.limpar(caixaDicas);
      cartoes.forEach(function (c) { caixaDicas.appendChild(cartaoSugestao(c, inserir)); });
    }

    function salvar() {
      global.App.Store.salvarNota(nota.id, { titulo: campoTitulo.value, texto: area.value });
    }

    var campoTitulo = h('input.campo-titulo', {
      type: 'text',
      placeholder: 'Título',
      value: nota.titulo || '',
      oninput: agendarSalvar
    });

    area = h('textarea.campo-texto', {
      placeholder: 'Escreva o que entendeu, com o que confunde, como você lembra…\nDica: cite os kana (ex.: き, ぬ) e as sugestões aparecem sozinhas.',
      oninput: function () { agendarSalvar(); agendarDicas(); }
    });
    area.value = nota.texto || '';

    function agendarSalvar() {
      if (timerSalvar) clearTimeout(timerSalvar);
      timerSalvar = setTimeout(salvar, 400);
    }
    function agendarDicas() {
      if (timerDicas) clearTimeout(timerDicas);
      timerDicas = setTimeout(atualizarDicas, 400);
    }

    var botaoIA = global.App.AI.configurado()
      ? h('button.btn', {
          type: 'button',
          onclick: function () {
            var bt = botaoIA;
            bt.disabled = true;
            bt.textContent = 'Consultando…';
            global.App.AI.sugerir(area.value, nota.sistema).then(function (itens) {
              global.App.UI.limpar(caixaIA);
              itens.forEach(function (txt) {
                caixaIA.appendChild(cartaoSugestao({
                  icone: '✦', titulo: 'Sugestão da IA', corpo: txt, inserir: txt
                }, inserir));
              });
              if (!itens.length) global.App.UI.toast('A IA não devolveu sugestões desta vez.');
            }).catch(function (err) {
              global.App.UI.toast(err.message || 'Falha ao consultar a IA.');
            }).then(function () {
              bt.disabled = false;
              bt.textContent = 'Enriquecer com IA';
            });
          }
        }, 'Enriquecer com IA')
      : null;

    raiz.appendChild(h('div.editor-nota', {}, [
      campoTitulo,
      area,
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
        h('button.btn.btn-fantasma', {
          type: 'button',
          onclick: function () { salvar(); estado.abertaId = null; global.App.recarregar(); }
        }, '← Anotações'),
        botaoIA,
        h('button.btn', {
          type: 'button',
          onclick: function () { salvar(); global.App.ir('chat', { pergunta: area.value }); }
        }, 'Perguntar ao tutor'),
        h('button.btn.btn-perigo', {
          type: 'button',
          onclick: function () {
            if (!global.confirm('Apagar esta anotação?')) return;
            global.App.Store.apagarNota(nota.id);
            estado.abertaId = null;
            global.App.recarregar();
          }
        }, 'Apagar')
      ]),
      global.App.AI.configurado()
        ? null
        : h('p.mini', { text: 'Quer sugestões de IA além destas? Cole sua chave em Ajustes — as dicas abaixo continuam funcionando sem ela, offline.' }),
      h('div.titulo-secao', { text: 'Sugestões' }),
      caixaDicas,
      caixaIA
    ]));

    atualizarDicas();
  }

  function render(raiz) {
    var nota = estado.abertaId ? global.App.Store.nota(estado.abertaId) : null;
    if (nota) editor(raiz, nota);
    else { estado.abertaId = null; lista(raiz); }
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.notas = { titulo: 'Anotações', render: render };
})(window);
