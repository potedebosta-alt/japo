/* Tela Músicas.
 *
 * DIREITOS AUTORAIS: este app não hospeda áudio nem letra. O que existe aqui é
 * a ficha factual da música (título, leitura, artista, ano, contexto) — que já
 * vive em js/data/songs.js — mais um link para a fonte oficial e um leitor que
 * só trabalha com o texto que a PRÓPRIA pessoa colar. Nada de letra embutida.
 *
 * O leitor é o coração da tela: ele pega o texto colado, marca os kana que a
 * pessoa reconhece (e destaca em vermelho os fracos, segundo o histórico dela)
 * e transforma isso em um baralho de prática. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var CHAVE = 'japo:letra:';
  var ESPERA = 300;

  var estado = { aberta: null };
  var timer = null;

  /* ---------- ajudantes ---------- */

  /* Todo acesso ao localStorage é protegido: aba anônima e cota cheia não
   * podem derrubar a tela — no pior caso o texto vale só para esta sessão. */
  function lerLetra(id) {
    try {
      return global.localStorage.getItem(CHAVE + id) || '';
    } catch (e) {
      return '';
    }
  }

  function gravarLetra(id, texto) {
    try {
      if (texto) global.localStorage.setItem(CHAVE + id, texto);
      else global.localStorage.removeItem(CHAVE + id);
    } catch (e) {
      /* Armazenamento bloqueado: segue sem salvar. */
    }
  }

  function agendar(fn) {
    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(function () { timer = null; fn(); }, ESPERA);
  }

  /* 'novo' e 'revisar' são exatamente os que valem destacar: os que ela não
   * sabe ainda e os que já venceram o prazo de revisão. */
  function ehFraco(e) {
    var st = global.App.SRS.status(global.App.Store.peek(e.system, e.kana));
    return st === 'novo' || st === 'revisar';
  }

  function ficha(e) {
    return e.kana + ' = ' + e.romaji + ' — ' + e.pron;
  }

  function anunciar(e) {
    global.App.Speech.falar(e.kana);
    global.App.UI.toast(ficha(e));
  }

  /* ---------- lista ---------- */

  function itemMusica(m) {
    var temTitulo = m.titulo !== m.kana;
    return h('button.item-musica', {
      type: 'button',
      onclick: function () {
        estado.aberta = m.id;
        global.App.recarregar();
      }
    }, [
      h('span.corpo', {}, [
        h('span.titulo-jp', { text: m.kana }),
        temTitulo ? h('b', { style: 'margin-left:8px;font-weight:600', text: m.titulo }) : null,
        h('span.meta', {
          style: 'display:block;margin-top:2px',
          text: m.romaji + ' · “' + m.pt + '”'
        }),
        h('span.meta', {
          style: 'display:block',
          text: m.artista + ' · ' + m.ano + ' · ' + m.contexto
        })
      ]),
      h('span.selo-foco', { text: m.foco })
    ]);
  }

  function lista(raiz) {
    raiz.appendChild(h('div', {}, [
      h('p.sub', {
        text: 'O app não guarda áudio nem letra — isso é obra protegida. Aqui ficam só a ficha ' +
              'da música e o link para a fonte oficial; o leitor trabalha com o texto que você colar.'
      }),
      h('div.lista-musicas', {}, global.App.Songs.lista.map(itemMusica))
    ]));
  }

  /* ---------- detalhe: kana do título ---------- */

  function bolha(e) {
    return h('button.kana-bolha' + (ehFraco(e) ? '.fraco' : ''), {
      type: 'button',
      'aria-label': 'Ouvir ' + e.kana,
      onclick: function () { anunciar(e); }
    }, [e.kana, h('small', { text: e.romaji })]);
  }

  /* ---------- detalhe: leitor da letra colada ---------- */

  function leitorDeLetra(m) {
    var leitor = h('div.leitor');
    var contagem = h('p.mini', { style: 'margin-top:8px' });
    var distintos = [];

    /* O botão entra e sai desta caixa: .btn tem display próprio, então o
     * atributo hidden não daria conta de escondê-lo. */
    var caixaPraticar = h('div', { style: 'margin-top:8px' });
    var praticar = h('button.btn.btn-largo', {
      type: 'button',
      onclick: function () {
        global.App.Practice.iniciar({ titulo: 'Letra: ' + m.titulo, kanas: distintos });
      }
    }, 'Praticar os kana da letra');

    var area = h('textarea.campo-texto', {
      placeholder: 'Cole aqui a letra que você quiser estudar',
      'aria-label': 'Letra para estudar',
      oninput: function () {
        /* Nada de recarregar() aqui: a tela inteira seria redesenhada e o
         * textarea perderia o foco no meio da digitação. Atualizamos só os
         * nós que mudam. */
        agendar(function () {
          gravarLetra(m.id, area.value);
          reconstruir();
        });
      },
      /* Ao sair do campo grava na hora: se a pessoa voltar para a lista antes
       * dos 300ms do debounce, o texto não se perde. */
      onchange: function () { gravarLetra(m.id, area.value); }
    });

    function reconstruir() {
      var texto = area.value || '';
      var vistos = {};
      var buffer = '';
      var i;

      distintos = [];
      global.App.UI.limpar(leitor);

      /* Texto puro vai como nó de texto (nunca innerHTML — é conteúdo do
       * usuário) e acumulado em buffer para não criar um nó por caractere.
       * O CSS do .leitor usa white-space: pre-wrap, então as quebras de
       * linha da letra colada são preservadas sozinhas. */
      function descarregar() {
        if (!buffer) return;
        leitor.appendChild(document.createTextNode(buffer));
        buffer = '';
      }

      for (i = 0; i < texto.length; i++) {
        var c = texto.charAt(i);
        var e = global.App.Kana.find(c);
        if (!e) { buffer += c; continue; }
        descarregar();
        if (!vistos[e.kana]) { vistos[e.kana] = 1; distintos.push(e.kana); }
        leitor.appendChild(h('span.tk' + (ehFraco(e) ? '.fraco' : ''), {
          title: ficha(e),
          onclick: (function (entrada) {
            return function () { anunciar(entrada); };
          })(e)
        }, c));
      }
      descarregar();

      if (!texto) {
        contagem.textContent = 'Cole um trecho acima e os kana ficam clicáveis aqui.';
      } else if (!distintos.length) {
        contagem.textContent = 'Nenhum kana encontrado neste texto.';
      } else if (distintos.length === 1) {
        contagem.textContent = '1 kana distinto encontrado.';
      } else {
        contagem.textContent = distintos.length + ' kana distintos encontrados.';
      }
      global.App.UI.limpar(caixaPraticar);
      if (distintos.length >= 4) caixaPraticar.appendChild(praticar);
    }

    area.value = lerLetra(m.id);
    reconstruir();

    return h('div', {}, [
      h('div.titulo-secao', { text: 'Leitor de letra' }),
      h('p.mini', {
        text: 'Cole a letra que você já tem (do encarte, do site oficial, do que você digitou). ' +
              'O texto fica salvo só neste navegador, no seu aparelho — não sai daqui.'
      }),
      area,
      leitor,
      contagem,
      caixaPraticar
    ]);
  }

  /* ---------- detalhe ---------- */

  function detalhe(raiz, m) {
    var entradas = global.App.Songs.kanaDe(m);
    var kanas = entradas.map(function (e) { return e.kana; });

    raiz.appendChild(h('div', {}, [
      h('div.kana-g.centro', { text: m.kana }),
      h('p.sub.centro', { text: m.titulo + ' · ' + m.romaji }),
      h('p.sub.centro', { style: 'margin-top:-6px', text: '“' + m.pt + '”' }),
      h('p.mini.centro', { text: m.artista + ' · ' + m.ano + ' · ' + m.contexto }),
      h('p.centro', {}, [global.App.UI.botaoSom(m.kana, 'Ouvir o título')]),

      h('p.dica-regra', { text: m.dica }),

      h('div.titulo-secao', { text: 'Kana deste título' }),
      h('div.kana-linha', {}, entradas.map(bolha)),

      h('div', { style: 'margin-top:16px' }, [
        h('button.btn.btn-primario.btn-largo', {
          type: 'button',
          onclick: function () {
            global.App.Practice.iniciar({ titulo: m.titulo, kanas: kanas });
          }
        }, 'Praticar os kana desta música')
      ]),

      h('div', { style: 'margin-top:10px' }, [
        h('a.btn.btn-largo', {
          href: global.App.Songs.linkBusca(m),
          target: '_blank',
          rel: 'noopener noreferrer',
          text: 'Ouvir na fonte oficial ↗'
        }),
        h('p.mini', {
          style: 'margin-top:6px',
          text: 'Este link abre um site de fora e precisa de internet — o resto da tela funciona offline.'
        })
      ]),

      leitorDeLetra(m),

      h('div', { style: 'margin-top:18px' }, [
        h('button.btn.btn-fantasma', {
          type: 'button',
          onclick: function () {
            estado.aberta = null;
            global.App.recarregar();
          }
        }, '← Todas as músicas')
      ])
    ]));
  }

  /* ---------- render ---------- */

  function render(raiz) {
    if (timer) { global.clearTimeout(timer); timer = null; }
    var m = estado.aberta ? global.App.Songs.get(estado.aberta) : null;
    if (m) detalhe(raiz, m);
    else { estado.aberta = null; lista(raiz); }
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.musicas = { titulo: 'Músicas', render: render };
})(window);
