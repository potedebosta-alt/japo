/* Tutor: conversa curta para tirar dúvidas de leitura, pronúncia e método.
 * Roda com a chave de IA do próprio usuário (Ajustes) — sem chave, a tela
 * apenas explica como ligar; o resto do app não depende disso em nada. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var rascunho = '';
  var carregando = false;

  var ATALHOS = [
    'Como eu diferencio シ de ツ?',
    'Qual a melhor ordem para aprender os kana?',
    'Me dá uma mnemônica para ぬ'
  ];

  function semChave(raiz) {
    raiz.appendChild(h('div.cartao', {}, [
      h('div.kana-g.centro', { text: '話' }),
      h('p', { style: 'margin-top:12px', text: 'O tutor conversa usando a sua própria chave de IA.' }),
      h('p.sub', { text: 'Ela fica guardada só neste navegador: não vai para o repositório, não passa por servidor nenhum (o app não tem servidor) e some se você limpar os dados do site. Precisa de internet só enquanto você conversa.' }),
      h('p.mini', { text: 'Sem a chave, tudo o mais continua funcionando — inclusive as dicas automáticas das anotações, que são offline.' }),
      h('button.btn.btn-primario.btn-largo', {
        style: 'margin-top:14px',
        type: 'button',
        onclick: function () { global.App.ir('ajustes'); }
      }, 'Abrir Ajustes')
    ]));
  }

  function balao(msg) {
    var euQueFalei = msg.papel === 'user';
    return h('div.cartao', {
      style: 'padding:14px 16px;' +
        (euQueFalei
          ? 'background:var(--acento-fraco);border-color:transparent;margin-left:24px'
          : 'margin-right:24px')
    }, [
      h('div.mini', { text: euQueFalei ? 'Você' : 'Tutor' }),
      h('div', { style: 'white-space:pre-wrap;margin-top:4px', text: msg.texto })
    ]);
  }

  function enviar(texto) {
    texto = (texto || '').trim();
    if (!texto || carregando) return;

    global.App.Store.addChat('user', texto);
    rascunho = '';
    carregando = true;
    global.App.recarregar();

    var historico = global.App.Store.chat().map(function (m) {
      return { papel: m.papel, texto: m.texto };
    });

    global.App.AI.conversar(historico, global.App.Store.sistema())
      .then(function (resposta) {
        global.App.Store.addChat('assistant', resposta || '(resposta vazia)');
      })
      .catch(function (err) {
        global.App.UI.toast(err.message || 'Falha ao falar com o tutor.');
      })
      .then(function () {
        carregando = false;
        global.App.recarregar();
      });
  }

  function render(raiz) {
    if (!global.App.AI.configurado()) { semChave(raiz); return; }

    var mensagens = global.App.Store.chat();
    var caixa = h('div', { style: 'display:grid;gap:10px' });

    if (!mensagens.length) {
      caixa.appendChild(h('div.vazio', {}, [
        h('div.kana-g', { text: '話' }),
        h('p', { text: 'Pergunte o que quiser sobre hiragana e katakana.' }),
        h('p.mini', { text: 'O tutor enxerga o seu progresso: ele sabe quais kana você anda errando.' })
      ]));
      var atalhos = h('div.chips', { style: 'justify-content:center;flex-wrap:wrap' });
      ATALHOS.forEach(function (p) {
        atalhos.appendChild(h('button.chip', {
          type: 'button', onclick: function () { enviar(p); }
        }, p));
      });
      caixa.appendChild(atalhos);
    } else {
      mensagens.forEach(function (m) { caixa.appendChild(balao(m)); });
    }

    if (carregando) {
      caixa.appendChild(h('div.cartao', {
        style: 'padding:14px 16px;margin-right:24px;color:var(--tinta-3)'
      }, 'digitando…'));
    }

    var campo = h('textarea.campo', {
      rows: 2,
      placeholder: 'Escreva sua dúvida…',
      style: 'resize:vertical;font-size:1rem',
      oninput: function (ev) { rascunho = ev.target.value; },
      onkeydown: function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          enviar(campo.value);
        }
      }
    });
    campo.value = rascunho;

    raiz.appendChild(h('div', {}, [
      caixa,
      h('div', { style: 'display:flex;gap:10px;align-items:flex-end;margin-top:14px' }, [
        campo,
        h('button.btn.btn-primario', {
          type: 'button',
          disabled: carregando ? true : null,
          onclick: function () { enviar(campo.value); }
        }, 'Enviar')
      ]),
      mensagens.length
        ? h('p.centro', { style: 'margin-top:12px' }, [
            h('button.btn.btn-fantasma', {
              type: 'button',
              onclick: function () {
                if (!global.confirm('Apagar toda a conversa?')) return;
                global.App.Store.limparChat();
                global.App.recarregar();
              }
            }, 'Limpar conversa')
          ])
        : null
    ]));

    setTimeout(function () {
      if (!rascunho && mensagens.length) campo.focus();
      var ultimo = caixa.lastChild;
      if (ultimo && ultimo.scrollIntoView) ultimo.scrollIntoView({ block: 'end' });
    }, 0);
  }

  function abrirCom(pergunta) {
    if (pergunta && !rascunho) {
      rascunho = 'Sobre esta anotação, o que você sugere?\n\n' + pergunta;
    }
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.chat = {
    titulo: 'Tutor',
    render: function (raiz, params) {
      if (params && params.pergunta) abrirCom(params.pergunta);
      render(raiz);
    }
  };
})(window);
