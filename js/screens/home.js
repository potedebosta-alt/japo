/* Tela inicial: o estado do estudo em uma olhada e um clique até o exercício. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;

  function seletorSistema(aoTrocar) {
    var atual = global.App.Store.sistema();
    function bt(id, rotulo) {
      return h('button', {
        type: 'button',
        'aria-pressed': atual === id ? 'true' : 'false',
        onclick: function () {
          global.App.Store.sistema(id);
          aoTrocar();
        }
      }, rotulo);
    }
    return h('div.segmento', {}, [bt('hiragana', 'ひらがな'), bt('katakana', 'カタカナ')]);
  }

  function painel(resumo) {
    function num(valor, rotulo) {
      return h('div.numero', {}, [h('b', { text: String(valor) }), h('span', { text: rotulo })]);
    }
    return h('div.cartao', {}, [
      h('div.painel-progresso', {}, [
        global.App.UI.anel(resumo.pct, 104),
        h('div.numeros', {}, [
          num(resumo.dominados, 'dominados'),
          num(resumo.aprendendo, 'em aprendizado'),
          num(resumo.revisar, 'para revisar'),
          num(resumo.acerto + '%', 'de acerto')
        ])
      ]),
      resumo.respondidas
        ? h('p.mini', {
            style: 'margin:14px 0 0',
            text: 'Sequência atual: ' + resumo.streak + ' · melhor: ' + resumo.melhor +
                  ' · ' + resumo.respondidas + ' respostas no total'
          })
        : h('p.mini', {
            style: 'margin:14px 0 0',
            text: 'Comece por Praticar: o app descobre sozinho o que você já sabe.'
          })
    ]);
  }

  function acao(opts) {
    return h('button.acao' + (opts.destaque ? '.acao-destaque' : ''), {
      type: 'button',
      onclick: opts.onclick
    }, [
      h('span.icone', { text: opts.icone }),
      h('span.texto', {}, [h('b', { text: opts.titulo }), h('span', { text: opts.sub })]),
      opts.selo ? h('span.selo', { text: String(opts.selo) }) : null
    ]);
  }

  function render(raiz) {
    var ir = global.App.ir;
    var sistema = global.App.Store.sistema();
    var pool = global.App.Kana.get(sistema).quiz;
    var resumo = global.App.SRS.resumo(sistema, pool);
    var paraRevisar = global.App.SRS.sessaoRevisao(sistema, pool, 14).length;

    raiz.appendChild(h('div', {}, [
      seletorSistema(function () { global.App.recarregar(); }),
      h('div', { style: 'height:14px' }),
      painel(resumo),
      h('div.acoes', {}, [
        acao({
          destaque: true, icone: '練', titulo: 'Praticar',
          sub: 'Exercícios misturados, do seu nível',
          onclick: function () { ir('praticar'); }
        }),
        acao({
          icone: '表', titulo: 'Tabela',
          sub: 'Os dois silabários e as regras de leitura',
          onclick: function () { ir('tabela'); }
        }),
        acao({
          icone: '学', titulo: 'Estudar',
          sub: 'Linha por linha, com som e mnemônica',
          onclick: function () { ir('estudar'); }
        }),
        acao({
          icone: '復', titulo: 'Revisão',
          sub: paraRevisar ? 'Sessão pronta com o que você errou' : 'Nada vencido por enquanto',
          selo: paraRevisar || null,
          onclick: function () { ir('revisao'); }
        }),
        acao({
          icone: '筆', titulo: 'Anotações',
          sub: 'Escreva e receba dicas automáticas',
          onclick: function () { ir('notas'); }
        }),
        acao({
          icone: '音', titulo: 'Músicas',
          sub: 'Estude com títulos e letras que você colar',
          onclick: function () { ir('musicas'); }
        }),
        acao({
          icone: '話', titulo: 'Tutor',
          sub: global.App.AI.configurado() ? 'Tire dúvidas conversando' : 'Requer sua chave de IA',
          onclick: function () { ir('chat'); }
        }),
        acao({
          icone: '図', titulo: 'Progresso',
          sub: 'Todos os kana, um a um',
          onclick: function () { ir('progresso'); }
        })
      ]),
      h('p.centro', { style: 'margin-top:16px' }, [
        h('button.btn.btn-fantasma', {
          type: 'button', onclick: function () { ir('ajustes'); }
        }, 'Ajustes')
      ])
    ]));
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.home = { titulo: null, render: render };
})(window);
