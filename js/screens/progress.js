/* Progresso: o mapa completo do silabário, kana a kana.
 *
 * A tela de início mostra o resumo; aqui a pessoa vê cada símbolo colorido pelo
 * estado real do SRS, descobre o que está pendurado e leva o backup embora.
 * Tudo local: o arquivo exportado é o mesmo JSON que vive no localStorage. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;

  var ROTULOS = {
    novo: 'nunca visto',
    aprendendo: 'em aprendizado',
    revisar: 'para revisar',
    dominado: 'dominado'
  };

  /* ---------- topo ---------- */

  function seletorSistema() {
    var atual = global.App.Store.sistema();
    function bt(id, rotulo) {
      return h('button', {
        type: 'button',
        'aria-pressed': atual === id ? 'true' : 'false',
        onclick: function () {
          global.App.Store.sistema(id);
          global.App.recarregar();
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
          num(resumo.novos, 'nunca vistos')
        ])
      ]),
      h('p.mini', {
        style: 'margin:14px 0 0',
        text: resumo.acerto + '% de acerto em ' + resumo.respondidas + ' respostas · ' +
              'sequência atual: ' + resumo.streak + ' · melhor: ' + resumo.melhor
      })
    ]);
  }

  /* ---------- o que está pendurado ---------- */

  function precisamAtencao(sistema, pool) {
    var fracos = global.App.SRS.errosRecentes(sistema, pool, 8);
    if (!fracos.length) return null;

    return h('div.cartao', {}, [
      h('div.titulo-secao', { style: 'margin-top:0', text: 'Precisam de atenção' }),
      h('div.kana-linha', {}, fracos.map(function (item) {
        return h('div.kana-bolha.fraco', {
          onclick: function () { global.App.Speech.falar(item.kana); }
        }, [item.kana, h('small', { text: item.romaji })]);
      })),
      h('button.btn.btn-primario.btn-largo', {
        type: 'button',
        style: 'margin-top:14px',
        onclick: function () { global.App.ir('revisao'); }
      }, 'Revisar agora')
    ]);
  }

  /* ---------- grade completa ---------- */

  function plural(n, singular, pluralForma) {
    return n + ' ' + (n === 1 ? singular : pluralForma);
  }

  function descrever(sistema, item) {
    var e = global.App.Store.peek(sistema, item.kana);
    var cabeca = item.kana + ' (' + item.romaji + ')';
    if (!e || !e.n) return cabeca + ' · ainda não praticado';
    return cabeca + ' · ' + plural(e.ok || 0, 'acerto', 'acertos') +
      ', ' + plural(e.no || 0, 'erro', 'erros') +
      ' · ' + ROTULOS[global.App.SRS.status(e)];
  }

  function celula(sistema, item) {
    var estado = global.App.SRS.status(global.App.Store.peek(sistema, item.kana));
    return h('button.celula.' + estado, {
      type: 'button',
      title: item.kana + ' (' + item.romaji + ')',
      'aria-label': item.kana + ' — ' + item.romaji + ', ' + ROTULOS[estado],
      onclick: function () {
        global.App.Speech.falar(item.kana);
        global.App.UI.toast(descrever(sistema, item));
      }
    }, item.kana);
  }

  function grade(sistema) {
    var grupos = global.App.Kana.get(sistema).groups;
    var blocos = [];
    grupos.forEach(function (g) {
      blocos.push(h('div.titulo-secao', { text: g.label }));
      blocos.push(h('div.grade-kana', {}, g.items.map(function (item) {
        return celula(sistema, item);
      })));
    });
    return h('div', {}, blocos);
  }

  function legenda() {
    function item(classe, rotulo) {
      return h('span', {}, [h('i.' + classe), rotulo]);
    }
    return h('div.legenda', {}, [
      item('l-novo', 'nunca visto'),
      item('l-aprendendo', 'em aprendizado'),
      item('l-revisar', 'para revisar'),
      item('l-dominado', 'dominado')
    ]);
  }

  /* ---------- backup ---------- */

  function exportar() {
    try {
      var blob = new global.Blob([global.App.Store.exportar()], { type: 'application/json' });
      var url = global.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'japo-backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      /* A revogação espera um instante: alguns navegadores só leem o blob
       * depois que o clique termina de propagar. */
      global.setTimeout(function () { global.URL.revokeObjectURL(url); }, 1000);
      global.App.UI.toast('Backup gerado: japo-backup.json');
    } catch (err) {
      global.App.UI.toast('Não foi possível gerar o arquivo: ' + err.message);
    }
  }

  function importar(arquivo) {
    if (!arquivo) return;
    var leitor = new global.FileReader();
    leitor.onload = function () {
      try {
        global.App.Store.importar(String(leitor.result || ''));
        global.App.UI.toast('Backup importado.');
      } catch (err) {
        global.App.UI.toast('Arquivo inválido: ' + err.message);
      }
      global.App.recarregar();
    };
    leitor.onerror = function () {
      global.App.UI.toast('Não foi possível ler o arquivo.');
    };
    leitor.readAsText(arquivo);
  }

  function rodape(sistema) {
    var seletorArquivo = h('input', {
      type: 'file',
      accept: '.json',
      style: 'display:none',
      onchange: function (ev) {
        var arquivo = ev.target.files && ev.target.files[0];
        /* Zera o campo para que escolher o mesmo arquivo de novo dispare o evento. */
        ev.target.value = '';
        importar(arquivo);
      }
    });

    return h('div.acoes', {}, [
      h('button.btn.btn-largo', {
        type: 'button',
        onclick: exportar
      }, 'Exportar backup'),
      h('button.btn.btn-largo', {
        type: 'button',
        onclick: function () { seletorArquivo.click(); }
      }, 'Importar backup'),
      h('button.btn.btn-perigo.btn-largo', {
        type: 'button',
        onclick: function () {
          var nome = sistema === 'katakana' ? 'katakana' : 'hiragana';
          var pergunta = 'Apagar todo o progresso de ' + nome + '?\n\n' +
            'Isto zera acertos, erros e sequências apenas deste silabário. ' +
            'O outro silabário, as anotações e os ajustes continuam como estão. ' +
            'Não dá para desfazer.';
          if (!global.confirm(pergunta)) return;
          global.App.Store.zerarProgresso(sistema);
          global.App.UI.toast('Progresso de ' + nome + ' zerado.');
          global.App.recarregar();
        }
      }, 'Zerar progresso'),
      seletorArquivo
    ]);
  }

  /* ---------- tela ---------- */

  function render(raiz) {
    var sistema = global.App.Store.sistema();
    var pool = global.App.Kana.get(sistema).quiz;
    var resumo = global.App.SRS.resumo(sistema, pool);

    raiz.appendChild(h('div', {}, [
      seletorSistema(),
      h('div', { style: 'height:14px' }),
      painel(resumo),
      precisamAtencao(sistema, pool),
      grade(sistema),
      legenda(),
      h('div.titulo-secao', { text: 'Backup' }),
      rodape(sistema),
      global.App.Store.ok()
        ? null
        : h('p.mini', {
            style: 'margin-top:12px',
            text: 'Este navegador está bloqueando o armazenamento: o progresso desta sessão ' +
                  'não será salvo. Exporte um backup antes de fechar a aba.'
          })
    ]));
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.progresso = { titulo: 'Progresso', render: render };
})(window);
