/* Anotações: caderno + quadro de recortes.
 *
 * Escrever com as próprias palavras é uma das formas mais eficazes de fixar —
 * então o app lê o que você escreveu e devolve o que falta: leitura, pronúncia,
 * mnemônica, o kana parecido que você costuma trocar e o seu histórico naquele
 * símbolo. Tudo offline.
 *
 * Além do texto, dá para FIXAR recortes na anotação: imagens (coladas ou do
 * arquivo), trechos em japonês com a leitura de cada kana por cima, cartões de
 * kana e as próprias sugestões. Tudo fica no seu navegador — as imagens são
 * reduzidas antes de guardar, porque o espaço do localStorage é curto. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var estado = { abertaId: null };
  var timerSalvar = null;
  var timerDicas = null;

  var LADO_MAX = 900;      /* imagem é reduzida a este lado maior */
  var QUALIDADE = 0.72;

  function data(ts) {
    try {
      return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch (e) { return ''; }
  }

  function resumo(nota) {
    var t = (nota.texto || '').replace(/\s+/g, ' ').trim();
    var extras = (nota.itens && nota.itens.length) ? ' · ' + nota.itens.length + ' fixado(s)' : '';
    if (!t) return 'Vazia' + extras + ' · ' + data(nota.editadaEm);
    return (t.length > 50 ? t.slice(0, 50) + '…' : t) + extras + ' · ' + data(nota.editadaEm);
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
            h('p.mini', { text: 'Escreva um kana e o app completa com leitura, mnemônica e o que você costuma errar. Você também pode colar imagens e trechos em japonês.' })
          ])
    ]));
  }

  /* ---------- leitura kana a kana ---------- */

  /* っ/ッ e ー não têm leitura: "sokuon" e "chouon" são apenas os nomes internos
   * dessas marcas. Mostrá-los por cima do kana faria コーヒー virar
   * "ko chouon hi chouon". O kana continua aparecendo; a explicação vai para o
   * title e para o toast, aproveitando o texto que já existe em e.pron. */
  function marcaSemSom(e) {
    return e.romaji === 'sokuon' || e.romaji === 'chouon';
  }

  function leituraDe(e) {
    return marcaSemSom(e) ? '' : e.romaji;
  }

  function descreverKana(e) {
    if (!marcaSemSom(e)) return e.kana + ' = ' + e.romaji;
    return e.kana + ' — ' + (e.pron || '').replace('sem som próprio — ', '');
  }

  /* Um <span> clicável não entra na ordem do Tab nem responde ao teclado. Com
   * role e tabindex ele entra; este handler repete a ação no Enter e no Espaço,
   * como faria um <button> de verdade. */
  function aoTeclar(acao) {
    return function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        acao();
      }
    };
  }

  /* Monta o texto japonês com a leitura por cima de cada kana.
   * Kanji fica sem leitura — o app não tem dicionário, e inventar seria pior. */
  function blocoLeitura(texto) {
    var caixa = h('div.leitura-ruby');
    var i = 0;
    var comum = '';

    function despejarComum() {
      if (!comum) return;
      caixa.appendChild(h('span.rb-plano', { text: comum }));
      comum = '';
    }

    while (i < texto.length) {
      var par = texto.substr(i, 2);
      var e = par.length === 2 ? global.App.Kana.find(par) : null;
      var tam = 2;
      if (!e) { e = global.App.Kana.find(texto[i]); tam = 1; }

      if (e) {
        despejarComum();
        var acao = function (entrada) {
          return function () {
            global.App.Speech.falar(entrada.kana);
            global.App.UI.toast(descreverKana(entrada));
          };
        }(e);
        caixa.appendChild(h('span.rb-item', {
          title: descreverKana(e),
          role: 'button',
          tabindex: '0',
          onclick: acao,
          onkeydown: aoTeclar(acao)
        }, [
          h('span.rb-r', { text: leituraDe(e) }),
          h('span.rb-k', { text: e.kana })
        ]));
        i += tam;
      } else {
        comum += texto[i];
        i += 1;
      }
    }
    despejarComum();
    return caixa;
  }

  /* ---------- imagens ---------- */

  function reduzirImagem(arquivo, aoTerminar, aoFalhar) {
    if (!arquivo || arquivo.type.indexOf('image/') !== 0) {
      aoFalhar('Isso não é uma imagem.');
      return;
    }
    var leitor = new global.FileReader();
    leitor.onerror = function () { aoFalhar('Não consegui ler o arquivo.'); };
    leitor.onload = function () {
      var img = new global.Image();
      img.onerror = function () { aoFalhar('Não consegui abrir a imagem.'); };
      img.onload = function () {
        var escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
        var l = Math.max(1, Math.round(img.width * escala));
        var a = Math.max(1, Math.round(img.height * escala));
        var tela = document.createElement('canvas');
        tela.width = l;
        tela.height = a;
        var ctx = tela.getContext('2d');
        /* Fundo branco: JPEG não tem transparência e ficaria preto. */
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, l, a);
        ctx.drawImage(img, 0, 0, l, a);
        try {
          aoTerminar(tela.toDataURL('image/jpeg', QUALIDADE), l, a);
        } catch (err) {
          aoFalhar('Não consegui converter a imagem.');
        }
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  /* ---------- cartões fixados ---------- */

  function cartaoFixado(nota, item, atualizar) {
    var conteudo;

    if (item.tipo === 'imagem') {
      conteudo = h('div', {}, [
        h('img.fixado-img', { src: item.dados, alt: item.legenda || 'Imagem fixada na anotação' }),
        item.legenda ? h('p.mini', { style: 'margin:6px 0 0', text: item.legenda }) : null
      ]);
    } else if (item.tipo === 'leitura') {
      conteudo = h('div', {}, [
        h('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:6px' }, [
          h('span.mini', { text: 'Leitura kana a kana' }),
          global.App.UI.botaoSom(item.texto, 'Ouvir o trecho')
        ]),
        blocoLeitura(item.texto)
      ]);
    } else if (item.tipo === 'kana') {
      var e = global.App.Kana.find(item.kana);
      conteudo = e
        ? h('div', { style: 'display:flex;align-items:center;gap:14px' }, [
            h('span.kana-g', { text: e.kana }),
            h('div', {}, [
              h('b', { text: e.romaji }),
              h('p.mini', { style: 'margin:2px 0 0', text: e.pron }),
              e.word ? h('p.mini', { style: 'margin:2px 0 0', text: e.word + ' = ' + e.meaning }) : null
            ]),
            global.App.UI.botaoSom(e.kana, 'Ouvir ' + e.kana)
          ])
        : h('p.mini', { text: 'Kana não encontrado.' });
    } else {
      conteudo = h('p', { style: 'margin:0;white-space:pre-wrap', text: item.texto || '' });
    }

    return h('div.fixado', {}, [
      h('button.remover-fixado', {
        type: 'button',
        'aria-label': 'Remover este item',
        title: 'Remover',
        onclick: function () {
          global.App.Store.desafixar(nota.id, item.id);
          atualizar();
        }
      }, '×'),
      conteudo
    ]);
  }

  /* ---------- editor ---------- */

  function cartaoSugestao(c, aoInserir, aoFixar) {
    var acoes = [];

    if (c.inserir) {
      acoes.push(h('button.mini-btn', {
        type: 'button',
        onclick: function () { aoInserir(c.inserir); }
      }, 'Inserir na nota'));
      acoes.push(h('button.mini-btn', {
        type: 'button',
        onclick: function () {
          aoFixar(c.kana && c.kana.length === 1
            ? { tipo: 'kana', kana: c.kana[0] }
            : { tipo: 'texto', texto: c.inserir });
        }
      }, 'Fixar'));
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
    var caixaFixados = h('div.fixados');
    var area;

    function salvar() {
      global.App.Store.salvarNota(nota.id, { titulo: campoTitulo.value, texto: area.value });
    }

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
      cartoes.forEach(function (c) {
        caixaDicas.appendChild(cartaoSugestao(c, inserir, fixar));
      });
    }

    function atualizarFixados() {
      var itens = global.App.Store.itensNota(nota.id);
      global.App.UI.limpar(caixaFixados);
      if (!itens.length) {
        caixaFixados.appendChild(h('p.mini', {
          text: 'Nada fixado ainda. Cole uma imagem aqui (Ctrl+V), use os botões acima ou fixe uma sugestão.'
        }));
        return;
      }
      itens.forEach(function (item) {
        caixaFixados.appendChild(cartaoFixado(nota, item, atualizarFixados));
      });
    }

    function fixar(item) {
      if (!global.App.Store.fixarNaNota(nota.id, item)) {
        global.App.UI.toast('Sem espaço no navegador para guardar isso. Remova alguma imagem fixada e tente de novo.');
        return;
      }
      atualizarFixados();
      global.App.UI.toast('Fixado na anotação.');
    }

    function fixarArquivo(arquivo) {
      reduzirImagem(arquivo, function (dados) {
        fixar({ tipo: 'imagem', dados: dados, legenda: '' });
      }, function (msg) {
        global.App.UI.toast(msg);
      });
    }

    var campoTitulo = h('input.campo-titulo', {
      type: 'text',
      placeholder: 'Título',
      value: nota.titulo || '',
      oninput: agendarSalvar
    });

    area = h('textarea.campo-texto', {
      placeholder: 'Escreva o que entendeu, com o que confunde, como você lembra…\nDica: cite os kana (ex.: き, ぬ) e as sugestões aparecem sozinhas. Colar uma imagem aqui fixa ela na anotação.',
      oninput: function () { agendarSalvar(); agendarDicas(); },
      onpaste: function (ev) {
        var itens = (ev.clipboardData && ev.clipboardData.items) || [];
        for (var i = 0; i < itens.length; i++) {
          if (itens[i].type && itens[i].type.indexOf('image/') === 0) {
            var arquivo = itens[i].getAsFile();
            if (arquivo) {
              ev.preventDefault();
              fixarArquivo(arquivo);
              return;
            }
          }
        }
      }
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

    var seletorArquivo = h('input', {
      type: 'file',
      accept: 'image/*',
      style: 'display:none',
      onchange: function (ev) {
        var arquivo = ev.target.files && ev.target.files[0];
        ev.target.value = '';
        if (arquivo) fixarArquivo(arquivo);
      }
    });

    var campoLetra = h('textarea.campo-texto', {
      style: 'min-height:90px;display:none',
      placeholder: 'Cole aqui o trecho em japonês (letra de música, frase, palavra) e clique em "Gerar leitura".'
    });

    var botaoGerar = h('button.btn', {
      type: 'button',
      style: 'display:none',
      onclick: function () {
        var t = campoLetra.value.trim();
        if (!t) { global.App.UI.toast('Cole um trecho em japonês primeiro.'); return; }
        if (t.length > 600) t = t.slice(0, 600);
        fixar({ tipo: 'leitura', texto: t });
        campoLetra.value = '';
        campoLetra.style.display = 'none';
        botaoGerar.style.display = 'none';
      }
    }, 'Gerar leitura');

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
                }, inserir, fixar));
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

      h('div.barra-fixar', {}, [
        h('button.btn', {
          type: 'button',
          onclick: function () { seletorArquivo.click(); }
        }, 'Fixar imagem'),
        h('button.btn', {
          type: 'button',
          onclick: function () {
            var aberto = campoLetra.style.display !== 'none';
            campoLetra.style.display = aberto ? 'none' : 'block';
            botaoGerar.style.display = aberto ? 'none' : 'inline-flex';
            if (!aberto) campoLetra.focus();
          }
        }, 'Fixar letra com pronúncia'),
        botaoIA,
        h('button.btn', {
          type: 'button',
          onclick: function () { salvar(); global.App.ir('chat', { pergunta: area.value }); }
        }, 'Perguntar ao tutor')
      ]),
      seletorArquivo,
      campoLetra,
      botaoGerar,

      h('div.titulo-secao', { text: 'Fixados' }),
      caixaFixados,

      global.App.AI.configurado()
        ? null
        : h('p.mini', { text: 'Quer sugestões de IA além destas? Cole sua chave em Ajustes — as dicas abaixo continuam funcionando sem ela, offline.' }),

      h('div.titulo-secao', { text: 'Sugestões' }),
      caixaDicas,
      caixaIA,

      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:18px' }, [
        h('button.btn.btn-fantasma', {
          type: 'button',
          onclick: function () { salvar(); estado.abertaId = null; global.App.recarregar(); }
        }, '← Anotações'),
        h('button.btn.btn-perigo', {
          type: 'button',
          onclick: function () {
            if (!global.confirm('Apagar esta anotação e tudo o que está fixado nela?')) return;
            global.App.Store.apagarNota(nota.id);
            estado.abertaId = null;
            global.App.recarregar();
          }
        }, 'Apagar')
      ])
    ]));

    atualizarFixados();
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
