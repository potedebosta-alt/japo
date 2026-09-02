/* Prática e Revisão — o mesmo motor, dois modos.
 *
 * Prática: contínua, sem fim forçado, sem vidas. O agendador escolhe o próximo
 * kana; o tipo de exercício sobe de dificuldade conforme o nível dele.
 * Revisão: sessão finita montada a partir dos erros recentes e dos vencidos.
 *
 * Feedback: acerto avança sozinho (não interrompe o ritmo); erro para, mostra a
 * resposta certa com a pronúncia e a mnemônica, e espera um toque. Errar não
 * custa nada além de rever — é assim que se aprende mais rápido. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;
  var AUTO_MS = 750;
  var NOVOS_POR_SESSAO = 5;
  var MEMORIA_RECENTES = 3;

  var sessao = null;
  var timer = null;

  function poolDoEscopo(sistema, escopo) {
    var quiz = global.App.Kana.get(sistema).quiz;
    if (escopo === 'gojuon') {
      return quiz.filter(function (e) { return e.type === 'gojuon'; });
    }
    if (escopo === 'dakuten') {
      return quiz.filter(function (e) { return e.type === 'gojuon' || e.type === 'dakuten'; });
    }
    return quiz;
  }

  function audioOk() {
    return global.App.Speech.suportado() && global.App.Speech.disponivel();
  }

  function novaSessao(cfg) {
    var sistema = global.App.Store.sistema();
    return {
      modo: cfg.modo || 'pratica',
      titulo: cfg.titulo || null,
      sistema: sistema,
      pool: cfg.pool,
      limite: cfg.limite || null,
      faixa: cfg.faixa || null,
      feitas: 0,
      certas: 0,
      streak: 0,
      novos: 0,
      recentes: [],
      questao: null,
      estado: 'perguntando',
      resultado: null,
      inicio: 0
    };
  }

  function sessaoPadrao() {
    var sistema = global.App.Store.sistema();
    var pool = poolDoEscopo(sistema, global.App.Store.escopo());
    return novaSessao({ modo: 'pratica', pool: pool });
  }

  function sessaoRevisao() {
    var sistema = global.App.Store.sistema();
    var completo = global.App.Kana.get(sistema).quiz;
    var lista = global.App.SRS.sessaoRevisao(sistema, completo, 14);
    var faixa = null;

    if (!lista.length) {
      /* Ninguém praticou ainda: revisar vira uma primeira volta pelo básico. */
      lista = poolDoEscopo(sistema, 'gojuon').slice(0, 10);
      faixa = 'Você ainda não tem erros registrados. Vamos começar por dez kana básicos.';
    } else {
      var errados = global.App.SRS.errosRecentes(sistema, completo, 3)
        .map(function (e) { return e.kana; });
      if (errados.length) {
        var nomes = errados.length > 1
          ? errados.slice(0, -1).join(', ') + ' e ' + errados[errados.length - 1]
          : errados[0];
        faixa = 'Você errou ' + nomes + ' recentemente. Vamos revisar esses kana.';
      } else {
        faixa = 'Estes kana estão vencidos no seu cronograma de revisão.';
      }
    }

    return novaSessao({
      modo: 'revisao',
      pool: lista,
      limite: Math.max(8, Math.min(20, lista.length * 2)),
      faixa: faixa
    });
  }

  function proximaQuestao() {
    var permitirNovos = sessao.novos < NOVOS_POR_SESSAO || sessao.modo === 'revisao';
    var alvo = global.App.SRS.escolher(sessao.sistema, sessao.pool, {
      evitar: sessao.recentes,
      permitirNovos: permitirNovos
    });
    if (!alvo) { sessao.estado = 'fim'; return; }

    var visto = global.App.Store.peek(sessao.sistema, alvo.kana);
    if (!visto || !visto.n) sessao.novos++;

    sessao.recentes.push(alvo.kana);
    if (sessao.recentes.length > MEMORIA_RECENTES) sessao.recentes.shift();

    sessao.questao = global.App.Quiz.montar(sessao.sistema, alvo, sessao.pool, {
      tipo: global.App.Store.tipo(),
      permitirAudio: audioOk()
    });
    sessao.estado = 'perguntando';
    sessao.resultado = null;
    sessao.inicio = Date.now();
  }

  function responder(valor) {
    if (sessao.estado !== 'perguntando') return;
    var rt = Date.now() - sessao.inicio;
    var r = global.App.Quiz.verificar(sessao.questao, valor);

    global.App.SRS.registrar(sessao.sistema, sessao.questao.entry.kana, r.correto, rt, r.escolhido);

    sessao.feitas++;
    if (r.correto) { sessao.certas++; sessao.streak++; } else { sessao.streak = 0; }
    sessao.estado = 'respondido';
    sessao.resultado = r;
    global.App.recarregar();

    if (r.correto) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(continuar, AUTO_MS);
    }
  }

  function continuar() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!sessao) return;
    if (sessao.limite && sessao.feitas >= sessao.limite) {
      sessao.estado = 'fim';
    } else {
      proximaQuestao();
    }
    global.App.recarregar();
  }

  /* ---------- desenho ---------- */

  function barra() {
    var partes = [
      h('span', {}, ['Acertos ', h('b', { text: sessao.certas + '/' + sessao.feitas })]),
      h('span', {}, ['Sequência ', h('b', { text: String(sessao.streak) })])
    ];
    if (sessao.limite) {
      partes.unshift(h('span', {}, [h('b', { text: Math.min(sessao.feitas + 1, sessao.limite) + ' de ' + sessao.limite })]));
    }
    return h('div.barra-sessao', {}, partes);
  }

  function progresso() {
    if (!sessao.limite) return null;
    var v = Math.min(100, (sessao.feitas / sessao.limite) * 100);
    return h('div.progresso-linha', {}, [h('i', { style: 'width:' + v + '%' })]);
  }

  function enunciado() {
    var q = sessao.questao;
    if (q.tipo === 'k2r' || q.tipo === 'digitar') {
      return h('div.cartao.enunciado', {}, [
        h('span.rotulo', { text: 'Qual é a leitura?' }),
        h('span.kana-xl', { text: q.entry.kana })
      ]);
    }
    if (q.tipo === 'r2k') {
      return h('div.cartao.enunciado', {}, [
        h('span.rotulo', { text: 'Qual kana tem esta leitura?' }),
        h('span.romaji', { style: 'font-size:3.2rem', text: q.entry.romaji })
      ]);
    }
    /* audio */
    return h('div.cartao.enunciado', {}, [
      h('span.rotulo', { text: 'Ouça e escolha o kana' }),
      h('button.botao-audio-grande', {
        type: 'button',
        'aria-label': 'Ouvir de novo',
        onclick: function () { global.App.Speech.falar(q.entry.kana); }
      }, '🔊'),
      h('span.mini', { text: 'Toque para ouvir de novo' })
    ]);
  }

  function opcoes() {
    var q = sessao.questao;
    var mostrarRomaji = q.tipo === 'k2r';
    var grade = h('div.opcoes');

    q.opcoes.forEach(function (op) {
      var classe = '';
      if (sessao.estado === 'respondido') {
        if (op.romaji === q.entry.romaji) classe = '.certa';
        else if (sessao.resultado && sessao.resultado.escolhido === op.kana) classe = '.errada';
      }
      grade.appendChild(h('button.opcao' + classe, {
        type: 'button',
        disabled: sessao.estado === 'respondido' ? true : null,
        onclick: function () { responder(op); }
      }, [
        mostrarRomaji
          ? h('span.romaji-op', { text: op.romaji })
          : h('span.kana-op', { text: op.kana })
      ]));
    });
    return grade;
  }

  function campoDigitar() {
    var q = sessao.questao;
    var respondido = sessao.estado === 'respondido';
    var classe = '';
    if (respondido) classe = sessao.resultado.correto ? '.certa' : '.errada';

    var campo = h('input.campo' + classe, {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      placeholder: 'digite a leitura (ex.: ka)',
      value: respondido && sessao.resultado.texto ? sessao.resultado.texto : '',
      disabled: respondido ? true : null,
      onkeydown: function (ev) {
        if (ev.key !== 'Enter') return;
        ev.preventDefault();
        if (respondido) continuar();
        else if (campo.value.trim()) responder(campo.value);
      }
    });

    if (!respondido) setTimeout(function () { campo.focus(); }, 30);

    return h('div.linha-digitar', {}, [
      campo,
      h('button.btn.btn-primario', {
        type: 'button',
        onclick: function () {
          if (respondido) continuar();
          else if (campo.value.trim()) responder(campo.value);
        }
      }, respondido ? 'Continuar' : 'Verificar')
    ]);
  }

  function retorno() {
    if (sessao.estado !== 'respondido') return null;
    var q = sessao.questao;
    var r = sessao.resultado;
    var e = q.entry;

    if (r.correto) {
      return h('div.retorno.certo', {}, [
        h('b', { text: e.kana }), ' = ' + e.romaji + ' · certo!'
      ]);
    }

    var detalhes = [e.pron];
    if (e.mnem) detalhes.push(e.mnem);
    if (r.escolhido) {
      var tip = global.App.Confusions.tipFor(sessao.sistema, e.kana, r.escolhido);
      if (tip) detalhes.push(tip);
    }

    return h('div.retorno.errado', {}, [
      h('b', { text: e.kana }), ' = ' + e.romaji,
      h('span.detalhe', { text: detalhes.join(' · ') }),
      h('div', { style: 'margin-top:10px;display:flex;gap:8px;align-items:center' }, [
        global.App.UI.botaoSom(e.kana, 'Ouvir ' + e.kana),
        h('button.btn.btn-primario', { type: 'button', onclick: continuar }, 'Continuar')
      ])
    ]);
  }

  function resumoFinal() {
    var pct = sessao.feitas ? Math.round((sessao.certas / sessao.feitas) * 100) : 0;
    var fracos = global.App.SRS.errosRecentes(sessao.sistema, sessao.pool, 6)
      .filter(function (e) {
        var st = global.App.Store.peek(sessao.sistema, e.kana);
        return st && st.lastWrong && Date.now() - st.lastWrong < 60 * 60 * 1000;
      });

    return h('div', {}, [
      h('div.cartao.resumo-final', {}, [
        h('div.nota-grande', { text: sessao.certas + '/' + sessao.feitas }),
        h('p.sub', { text: pct + '% de acerto nesta sessão' }),
        fracos.length
          ? h('div', {}, [
              h('p.mini', { style: 'margin-top:14px', text: 'Ainda pedindo atenção:' }),
              h('div.kana-linha', { style: 'justify-content:center' },
                fracos.map(function (e) {
                  return h('div.kana-bolha.fraco', {}, [
                    e.kana, h('small', { text: e.romaji })
                  ]);
                }))
            ])
          : h('p.mini', { style: 'margin-top:14px', text: 'Nenhum erro pendente. Bom trabalho.' })
      ]),
      h('div.acoes', { style: 'margin-top:14px' }, [
        h('button.btn.btn-primario.btn-largo', {
          type: 'button',
          onclick: function () {
            sessao = sessao.modo === 'revisao' ? sessaoRevisao() : sessaoPadrao();
            proximaQuestao();
            global.App.recarregar();
          }
        }, 'Fazer de novo'),
        h('button.btn.btn-largo', {
          type: 'button',
          onclick: function () { sessao = null; global.App.ir('home'); }
        }, 'Voltar ao início')
      ])
    ]);
  }

  function chipsConfig() {
    if (sessao.modo !== 'pratica' || sessao.titulo) return null;

    var escopos = [
      { id: 'gojuon', rotulo: 'Gojūon' },
      { id: 'dakuten', rotulo: '+ Dakuten' },
      { id: 'tudo', rotulo: 'Tudo' }
    ];
    var tipos = [
      { id: 'misto', rotulo: 'Misto' },
      { id: 'k2r', rotulo: 'Kana→romaji' },
      { id: 'r2k', rotulo: 'Romaji→kana' },
      { id: 'digitar', rotulo: 'Digitar' }
    ];
    if (audioOk()) tipos.push({ id: 'audio', rotulo: 'Ouvir' });

    var faixaEscopo = h('div.chips', { 'aria-label': 'Conteúdo' });
    escopos.forEach(function (o) {
      faixaEscopo.appendChild(h('button.chip', {
        type: 'button',
        'aria-pressed': global.App.Store.escopo() === o.id ? 'true' : 'false',
        onclick: function () {
          global.App.Store.escopo(o.id);
          sessao = sessaoPadrao();
          proximaQuestao();
          global.App.recarregar();
        }
      }, o.rotulo));
    });

    var faixaTipo = h('div.chips', { 'aria-label': 'Tipo de exercício' });
    tipos.forEach(function (o) {
      faixaTipo.appendChild(h('button.chip', {
        type: 'button',
        'aria-pressed': global.App.Store.tipo() === o.id ? 'true' : 'false',
        onclick: function () {
          global.App.Store.tipo(o.id);
          proximaQuestao();
          global.App.recarregar();
        }
      }, o.rotulo));
    });

    return h('div', {}, [faixaEscopo, faixaTipo, h('div', { style: 'height:6px' })]);
  }

  function desenhar(raiz) {
    if (sessao.estado === 'fim') {
      raiz.appendChild(resumoFinal());
      return;
    }
    if (!sessao.questao) proximaQuestao();
    if (sessao.estado === 'fim') { raiz.appendChild(resumoFinal()); return; }

    var q = sessao.questao;

    raiz.appendChild(h('div', {}, [
      chipsConfig(),
      sessao.faixa && sessao.feitas === 0
        ? h('div.faixa-revisao', { text: sessao.faixa })
        : null,
      sessao.titulo ? h('p.mini', { style: 'margin:0 0 8px', text: sessao.titulo }) : null,
      barra(),
      progresso(),
      enunciado(),
      q.tipo === 'digitar' ? campoDigitar() : opcoes(),
      retorno(),
      sessao.modo === 'pratica' && sessao.feitas > 0 && sessao.estado === 'perguntando'
        ? h('p.centro', { style: 'margin-top:18px' }, [
            h('button.btn.btn-fantasma', {
              type: 'button',
              onclick: function () { sessao.estado = 'fim'; global.App.recarregar(); }
            }, 'Encerrar sessão')
          ])
        : null
    ]));

    if (q.tipo === 'audio' && sessao.estado === 'perguntando') {
      setTimeout(function () { global.App.Speech.falar(q.entry.kana); }, 120);
    }
  }

  function renderPratica(raiz, params) {
    var trocouSistema = sessao && sessao.sistema !== global.App.Store.sistema();
    if (!sessao || sessao.modo !== 'pratica' || trocouSistema || (params && params.novo)) {
      if (!sessao || sessao.modo !== 'pratica' || trocouSistema) {
        sessao = sessaoPadrao();
        proximaQuestao();
      }
    }
    desenhar(raiz);
  }

  function renderRevisao(raiz) {
    if (!sessao || sessao.modo !== 'revisao' || sessao.sistema !== global.App.Store.sistema()) {
      sessao = sessaoRevisao();
      proximaQuestao();
    }
    desenhar(raiz);
  }

  function teclado(ev) {
    if (!sessao) return;
    if (sessao.estado === 'respondido' && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      continuar();
      return;
    }
    if (sessao.estado !== 'perguntando' || !sessao.questao) return;
    if (sessao.questao.tipo === 'digitar') return;
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= sessao.questao.opcoes.length) {
      ev.preventDefault();
      responder(sessao.questao.opcoes[n - 1]);
    }
  }

  /* Baralho personalizado (linha do Estudar, kana de uma anotação, de uma música). */
  function iniciar(cfg) {
    var sistema = global.App.Store.sistema();
    var byKana = global.App.Kana.get(sistema).byKana;
    var vistos = {};
    var pool = (cfg.kanas || []).map(function (k) {
      return byKana[k] || global.App.Kana.find(k);
    }).filter(function (e) {
      if (!e || !e.quiz || vistos[e.kana]) return false;
      vistos[e.kana] = 1;
      return true;
    });

    if (pool.length < 2) {
      global.App.UI.toast('Preciso de pelo menos 2 kana do silabário atual para montar o treino.');
      return;
    }

    sessao = novaSessao({
      modo: 'pratica',
      titulo: cfg.titulo || 'Treino personalizado',
      pool: pool,
      limite: cfg.limite || Math.max(8, Math.min(24, pool.length * 2))
    });
    proximaQuestao();
    global.App.ir('praticar');
  }

  global.App = global.App || {};
  global.App.Practice = { iniciar: iniciar };
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.praticar = { titulo: 'Praticar', render: renderPratica, teclado: teclado };
  global.App.Screens.revisao = { titulo: 'Revisão', render: renderRevisao, teclado: teclado };
})(window);
