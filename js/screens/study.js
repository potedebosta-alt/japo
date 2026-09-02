/* Estudar: codificação inicial, linha por linha.
 * Aqui é o único lugar do app com leitura passiva — e por isso ele tem o modo
 * flashcard, que transforma a leitura em recordação com um toque. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var estado = { grupo: 0, indice: 0, flash: false, revelado: false };

  function grupos() { return global.App.Kana.get(global.App.Store.sistema()).groups; }

  function atual() {
    var gs = grupos();
    var g = gs[Math.min(estado.grupo, gs.length - 1)];
    return { grupo: g, item: g.items[Math.min(estado.indice, g.items.length - 1)] };
  }

  function irPara(delta, redesenhar) {
    var gs = grupos();
    var g = gs[estado.grupo];
    var novo = estado.indice + delta;
    if (novo < 0) {
      estado.grupo = (estado.grupo - 1 + gs.length) % gs.length;
      estado.indice = gs[estado.grupo].items.length - 1;
    } else if (novo >= g.items.length) {
      estado.grupo = (estado.grupo + 1) % gs.length;
      estado.indice = 0;
    } else {
      estado.indice = novo;
    }
    estado.revelado = false;
    redesenhar();
  }

  function chips(redesenhar) {
    var faixa = h('div.chips', { role: 'tablist', 'aria-label': 'Linhas' });
    grupos().forEach(function (g, i) {
      faixa.appendChild(h('button.chip', {
        type: 'button',
        'aria-pressed': i === estado.grupo ? 'true' : 'false',
        onclick: function () {
          estado.grupo = i;
          estado.indice = 0;
          estado.revelado = false;
          redesenhar();
        }
      }, [h('span.kana-mini', { text: g.label })]));
    });
    return faixa;
  }

  function statusDoKana(item) {
    var e = global.App.Store.peek(item.system, item.kana);
    var st = global.App.SRS.status(e);
    var rotulos = {
      novo: 'ainda não praticado',
      aprendendo: 'em aprendizado',
      revisar: 'precisa de revisão',
      dominado: 'dominado'
    };
    return rotulos[st];
  }

  function cartao(par, redesenhar) {
    var item = par.item;
    var mostrar = !estado.flash || estado.revelado;

    var conteudo = [
      h('span.kana-xl', { text: item.kana })
    ];

    if (mostrar) {
      conteudo.push(h('div.linha-info', {}, [
        /* っ e ー não têm leitura própria: o travessão evita mostrar o nome
         * interno da marca ("sokuon") como se fosse pronúncia. */
        h('div.romaji', { text: global.App.Kana.leitura(item) || '—' }),
        global.App.UI.botaoSom(item.kana, 'Ouvir ' + item.kana)
      ]));
      conteudo.push(h('p.pron', { text: item.pron }));
      if (item.mnem) conteudo.push(h('p.mnem', { text: item.mnem }));
      if (item.word) {
        conteudo.push(h('div.exemplo', {}, [
          h('span.kana-s', { text: item.word }),
          h('span', { text: item.wordRomaji + ' — ' + item.meaning }),
          global.App.UI.botaoSom(item.word, 'Ouvir ' + item.word)
        ]));
      } else if (item.meaning) {
        conteudo.push(h('div.exemplo', {}, [h('span', { text: item.meaning })]));
      }
      conteudo.push(h('p.mini.centro', { text: statusDoKana(item) }));
    } else {
      conteudo.push(h('p.toque-revelar', { text: 'Toque para ver a resposta' }));
    }

    return h('div.cartao.cartao-estudo' + (estado.flash ? '.flash' : ''), {
      onclick: function () {
        if (!estado.flash) return;
        estado.revelado = !estado.revelado;
        redesenhar();
      }
    }, conteudo);
  }

  function avisoConfusao(item) {
    var pares = global.App.Confusions.forKana(item.system, item.kana);
    if (!pares.length) return null;
    var p = pares[0];
    return h('p.aviso-confusao', {}, [
      'Cuidado: ', h('b', { text: item.kana }), ' × ', h('b', { text: p.kana }), ' — ' + p.tip
    ]);
  }

  function render(raiz) {
    function redesenhar() { global.App.recarregar(); }

    var par = atual();
    var g = par.grupo;
    /* Os grupos especiais (っ, ッ e ー) não entram em exercício: sem pelo menos
     * dois kana treináveis o botão só conseguiria mostrar um aviso de erro. */
    var praticaveis = g.items.filter(function (i) { return i.quiz; }).map(function (i) { return i.kana; });

    raiz.appendChild(h('div', {}, [
      chips(redesenhar),
      h('div', { style: 'display:flex;justify-content:flex-end;margin:2px 0 10px' }, [
        h('label.interruptor', {}, [
          h('input', {
            type: 'checkbox',
            checked: estado.flash ? true : null,
            onchange: function (ev) {
              estado.flash = ev.target.checked;
              estado.revelado = false;
              redesenhar();
            }
          }),
          'Modo flashcard'
        ])
      ]),
      cartao(par, redesenhar),
      h('div.navegacao', {}, [
        h('button.btn', { type: 'button', onclick: function () { irPara(-1, redesenhar); } }, '← Anterior'),
        h('span.contador', { text: (estado.indice + 1) + ' / ' + g.items.length }),
        h('button.btn', { type: 'button', onclick: function () { irPara(1, redesenhar); } }, 'Próximo →')
      ]),
      g.hint ? h('p.dica-regra', { text: g.hint }) : null,
      avisoConfusao(par.item),
      praticaveis.length >= 2
        ? h('div', { style: 'margin-top:18px' }, [
            h('button.btn.btn-primario.btn-largo', {
              type: 'button',
              onclick: function () {
                global.App.Practice.iniciar({
                  titulo: 'Praticar ' + g.label,
                  kanas: praticaveis
                });
              }
            }, 'Praticar esta linha')
          ])
        : null
    ]));
  }

  function teclado(ev) {
    if (ev.key === 'ArrowLeft') { irPara(-1, global.App.recarregar); }
    else if (ev.key === 'ArrowRight') { irPara(1, global.App.recarregar); }
    else if (ev.key === ' ' || ev.key === 'Enter') {
      var par = atual();
      if (estado.flash) {
        estado.revelado = !estado.revelado;
        global.App.recarregar();
      } else {
        global.App.Speech.falar(par.item.kana);
      }
      ev.preventDefault();
    }
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.estudar = { titulo: 'Estudar', render: render, teclado: teclado };
})(window);
