/* Ajustes: voz do aparelho, chave de IA (opcional) e as regras da casa.
 *
 * Nada aqui é obrigatório para estudar. A tela existe para dois casos: escolher
 * qual voz japonesa o navegador vai usar e, para quem quiser, ligar os extras de
 * IA colando a própria chave — que fica só neste navegador.
 *
 * Os campos gravam direto no Store a cada tecla e NÃO chamam recarregar():
 * a tela é redesenhada inteira, e redesenhar no meio da digitação roubaria o
 * foco do campo. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;

  /* ---------- voz ---------- */

  function secaoVoz() {
    var Speech = global.App.Speech;

    if (!Speech.suportado()) {
      return h('div.cartao', {}, [
        h('p.sub', {
          text: 'Este navegador não tem síntese de voz. Os exercícios de escuta ficam ' +
                'escondidos, mas todo o resto do app continua funcionando normalmente.'
        })
      ]);
    }

    var vozes = Speech.vozes();
    var escolhida = global.App.Store.ajustes().voz || '';

    var seletor = h('select', {
      'aria-label': 'Voz japonesa',
      onchange: function (ev) { Speech.usarVoz(ev.target.value); }
    }, [h('option', { value: '' }, 'Automática')].concat(vozes.map(function (v) {
      return h('option', { value: v.name }, v.name + ' (' + v.lang + ')');
    })));
    /* O valor precisa ser aplicado depois das opções existirem no elemento. */
    seletor.value = escolhida;
    if (seletor.value !== escolhida) seletor.value = '';

    return h('div.cartao', {}, [
      h('div.linha-campo', { style: 'margin-top:0' }, [
        h('label', { text: 'Voz japonesa' }),
        seletor
      ]),
      vozes.length
        ? null
        : h('p.mini', {
            style: 'margin-top:10px',
            text: 'Este aparelho ainda não listou vozes japonesas. Pode ser preciso instalar ' +
                  'o pacote de idioma japonês nas configurações do sistema — ou simplesmente ' +
                  'abrir esta tela de novo em alguns segundos.'
          }),
      h('div.acoes', { style: 'margin-top:14px' }, [
        h('button.btn.btn-largo', {
          type: 'button',
          onclick: function () {
            if (!Speech.falar('こんにちは')) {
              global.App.UI.toast('Não foi possível falar: nenhuma voz disponível.');
            }
          }
        }, 'Testar voz')
      ])
    ]);
  }

  /* ---------- IA opcional ---------- */

  function secaoIA() {
    var ajustes = global.App.Store.ajustes();
    var AI = global.App.AI;

    var campoChave = h('input', {
      type: 'password',
      placeholder: 'sk-ant-...',
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-label': 'Chave da API',
      value: ajustes.aiKey || '',
      oninput: function (ev) {
        global.App.Store.ajustes().aiKey = ev.target.value.trim();
        global.App.Store.save();
      }
    });

    var modeloAtual = ajustes.aiModel || AI.MODELO_PADRAO;
    var seletorModelo = h('select', {
      'aria-label': 'Modelo',
      onchange: function (ev) {
        global.App.Store.ajustes().aiModel = ev.target.value;
        global.App.Store.save();
      }
    }, AI.MODELOS.map(function (m) {
      return h('option', { value: m.id }, m.nome);
    }));
    seletorModelo.value = modeloAtual;
    if (!seletorModelo.value) seletorModelo.value = AI.MODELO_PADRAO;

    var botaoTestar = h('button.btn.btn-largo', {
      type: 'button',
      onclick: function () {
        botaoTestar.disabled = true;
        botaoTestar.textContent = 'Testando…';
        function restaurar() {
          botaoTestar.disabled = false;
          botaoTestar.textContent = 'Testar conexão';
        }
        AI.testar().then(function () {
          global.App.UI.toast('Conexão ok');
          restaurar();
        }, function (err) {
          global.App.UI.toast(err && err.message ? err.message : 'Falha na conexão.');
          restaurar();
        });
      }
    }, 'Testar conexão');

    return h('div.cartao', {}, [
      h('p.sub', {
        style: 'margin-top:0',
        text: 'Tudo neste app funciona sem IA: as dicas, as mnemônicas e a revisão são ' +
              'calculadas aqui mesmo, offline. Colando a sua própria chave da Anthropic ' +
              'aparecem dois extras: o botão "Enriquecer com IA" nas anotações e a tela Tutor. ' +
              'A chave fica guardada somente neste navegador — nunca vai para o repositório ' +
              'nem para servidor nenhum, porque este app não tem servidor. ' +
              'As chamadas de IA precisam de internet e são cobradas na sua conta da Anthropic.'
      }),
      h('div.linha-campo', {}, [
        h('label', { text: 'Chave da API' }),
        campoChave
      ]),
      h('div.linha-campo', {}, [
        h('label', { text: 'Modelo' }),
        seletorModelo
      ]),
      h('div.acoes', { style: 'margin-top:14px' }, [
        botaoTestar,
        h('button.btn.btn-perigo.btn-largo', {
          type: 'button',
          onclick: function () {
            campoChave.value = '';
            global.App.Store.ajustes().aiKey = '';
            global.App.Store.save();
            global.App.UI.toast('Chave removida deste navegador.');
            global.App.recarregar();
          }
        }, 'Remover chave')
      ]),
      h('p.nota-privacidade', {
        text: 'A chave é gravada no armazenamento local deste navegador (localStorage), ' +
              'junto com o seu progresso. Ela some se você limpar os dados do site, e só ' +
              'é enviada para a API da Anthropic no momento de cada pedido.'
      })
    ]);
  }

  /* ---------- sobre ---------- */

  function secaoSobre() {
    return h('div.cartao', {}, [
      h('p.mini', { style: 'margin-top:0', text: 'O seu progresso é salvo apenas neste navegador.' }),
      h('p.mini', { text: 'Depois do primeiro carregamento, o app funciona offline.' }),
      h('p.mini', { style: 'margin-bottom:0', text: 'Sem login, sem anúncios e sem coleta de dados.' })
    ]);
  }

  /* ---------- aparência ---------- */

  function secaoAparencia() {
    var atual = global.App.Themes.atual();
    var faixa = h('div.chips', { 'aria-label': 'Tema visual', style: 'flex-wrap:wrap' });

    global.App.Themes.LISTA.forEach(function (t) {
      faixa.appendChild(h('button.chip', {
        type: 'button',
        'aria-pressed': atual === t.id ? 'true' : 'false',
        title: t.desc,
        onclick: function () {
          global.App.Themes.aplicar(t.id);
          global.App.recarregar();
        }
      }, t.nome));
    });

    var escolhido = null;
    global.App.Themes.LISTA.forEach(function (t) { if (t.id === atual) escolhido = t; });

    return h('div.cartao', {}, [
      faixa,
      h('p.mini', { style: 'margin-top:10px', text: escolhido ? escolhido.desc : '' }),
      h('p.mini', {
        text: 'Os fundos são desenho vetorial feito para o app: não pesam, não pedem internet e ' +
              'ficam sempre atrás dos cartões, para o kana continuar sendo o que se lê primeiro.'
      })
    ]);
  }

  /* ---------- tela ---------- */

  function render(raiz) {
    raiz.appendChild(h('div', {}, [
      h('div.titulo-secao', { style: 'margin-top:0', text: 'Aparência' }),
      secaoAparencia(),
      h('div.titulo-secao', { text: 'Voz' }),
      secaoVoz(),
      h('div.titulo-secao', { text: 'IA (opcional)' }),
      secaoIA(),
      h('div.titulo-secao', { text: 'Sobre' }),
      secaoSobre()
    ]));
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.ajustes = { titulo: 'Ajustes', render: render };
})(window);
