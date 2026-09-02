/* Tabela: os dois silabários inteiros numa página de consulta.
 *
 * É a tela para bater o olho, não para treinar. Traz as duas romanizações
 * (Hepburn, a das placas e dos materiais em português; e kunrei-shiki, a das
 * tabelas escolares japonesas — é a que aparece impressa como "si", "tu",
 * "hu", "di", "du"), as regras de leitura e as variantes de traçado que
 * confundem quem aprende por material impresso. */
(function (global) {
  'use strict';

  var h = global.App.UI.h;

  var estado = { roman: 'hepburn', pron: false, selecionado: null };

  /* Sons estrangeiros escritos em katakana — não fazem parte do silabário
   * clássico, mas aparecem o tempo todo em nomes e palavras importadas. */
  var ESTRANGEIROS = [
    ['ファ', 'fa'], ['フィ', 'fi'], ['フェ', 'fe'], ['フォ', 'fo'],
    ['ティ', 'ti'], ['ディ', 'di'], ['トゥ', 'tu'], ['ドゥ', 'du'],
    ['ウィ', 'wi'], ['ウェ', 'we'], ['ウォ', 'wo'],
    ['シェ', 'she'], ['ジェ', 'je'], ['チェ', 'che'],
    ['ヴ', 'vu'], ['ヴァ', 'va'], ['ヴィ', 'vi'], ['ヴェ', 've'], ['ヴォ', 'vo']
  ];

  var REGRAS = [
    ['は', 'は, へ e を como partículas',
      'Fora de palavra, は lê-se "wa", へ lê-se "e" e を lê-se "o". Dentro de palavra, は é "ha" normalmente.',
      'わたしは → watashi WA · がっこうへ → gakkou E · ほんを → hon O'],
    ['っ', 'っ pequeno dobra a consoante',
      'Não tem som próprio: cria uma pausa e dobra a consoante seguinte. Nunca aparece no fim da palavra nem antes de vogal.',
      'きって → kit-te (selo) · がっこう → gak-kou (escola)'],
    ['ー', 'ー alonga a vogal (só katakana)',
      'No katakana, o traço alonga a vogal anterior. No hiragana isso é feito repetindo a vogal.',
      'コーヒー → kōhī · おかあさん → okāsan'],
    ['う', 'おう e えい soam ō e ē',
      'A combinação おう costuma virar um "ô" longo, e えい um "ê" longo — mesmo escrevendo う e い.',
      'とうきょう → Tōkyō · せんせい → sensē'],
    ['ん', 'ん fecha a sílaba e muda de cor',
      'É o único kana que não tem vogal. Antes de b, p e m soa como "m"; no fim da palavra soa nasalado.',
      'しんぶん → shimbun (jornal) · にほん → nihon'],
    ['ゃ', 'Yōon: ゃ ゅ ょ pequenos',
      'Kana da coluna I + ゃ/ゅ/ょ PEQUENO formam uma sílaba só. Se o ya vier em tamanho normal, são duas.',
      'きゃ → kya (uma sílaba) · きや → ki-ya (duas)'],
    ['す', 'u e i quase somem',
      'Entre consoantes surdas, ou no fim da palavra, o u e o i praticamente emudecem na fala.',
      'です soa "déss" · すき soa "ski" · ました soa "máshta"'],
    ['ぢ', 'じ = ぢ e ず = づ',
      'Têm o mesmo som. ぢ e づ só aparecem em palavras compostas e em repetição de sílaba — no resto, use じ e ず.',
      'はなぢ (sangue no nariz) · つづく (continuar)'],
    ['が', 'Rendaku: a segunda parte fica sonora',
      'Ao juntar duas palavras, a consoante inicial da segunda costuma ganhar dakuten.',
      'て + かみ → てがみ (tegami, carta) · ひと + ひと → ひとびと'],
    ['ら', 'Não existe L nem V',
      'A linha ら fica entre o "r" brando e o "l" do português. O som de V vira ba/bi/bu/be/bo (ou ヴ no katakana).',
      'ラジオ → rádio · バイオリン → violino'],
    ['♪', 'Cada kana é um tempo',
      'Todo kana vale a mesma duração (uma mora), inclusive っ e ん. É isso que dá o ritmo do japonês.',
      'にっぽん tem 4 tempos: ni-p-po-n']
  ];

  var VARIANTES = [
    ['き', 'No impresso a barra de baixo costuma vir solta do traço vertical; à mão sai ligada, num traço só. As duas estão certas.'],
    ['さ', 'Mesma história do き: a curva de baixo aparece solta na fonte impressa e ligada na escrita à mão.'],
    ['り', 'Impresso normalmente traz os dois traços separados; manuscrito costuma ligá-los.'],
    ['ふ', 'Na fonte impressa são quatro traços bem separados; à mão vira um desenho mais corrido.'],
    ['そ', 'Existe a forma com o traço de cima destacado (mais comum em fonte) e a de traço único (mais comum à mão).'],
    ['ゆ', 'O laço central muda bastante de tamanho entre fontes — o traço final é o que identifica.'],
    ['シ', 'シ (shi) × ツ (tsu): a diferença é a DIREÇÃO. シ vem da esquerda subindo; ツ vem de cima descendo.'],
    ['ソ', 'ソ (so) × ン (n): mesma regra. ン vem da esquerda subindo; ソ vem de cima descendo.']
  ];

  function roman(entrada) {
    return estado.roman === 'kunrei' ? global.App.Kana.kunrei(entrada) : entrada.romaji;
  }

  function celula(entrada) {
    var sel = estado.selecionado === entrada.kana;
    return h('button.tab-celula' + (sel ? '.selecionada' : ''), {
      type: 'button',
      onclick: function () {
        estado.selecionado = sel ? null : entrada.kana;
        global.App.Speech.falar(entrada.kana);
        global.App.recarregar();
      }
    }, [
      h('span.k', { text: entrada.kana }),
      h('span.r', { text: roman(entrada) }),
      estado.pron ? h('span.p', { text: entrada.pron.split(' — ')[0] }) : null
    ]);
  }

  function vazia() { return h('div.tab-vazia', { text: '·' }); }

  function cabecalho(colunas) {
    var classe = colunas.length === 3 ? '.colunas-3' : '';
    return h('div.cabecalho-colunas' + classe, {}, colunas.map(function (c) {
      return h('span', { text: c });
    }));
  }

  /* O gojūon segue o desenho clássico: 5 colunas, com buracos nas linhas
   * や (só ya/yu/yo) e わ (só wa/wo). */
  function linhaGojuon(grupo) {
    var itens = grupo.items;
    if (/-ya$/.test(grupo.id)) {
      return [celula(itens[0]), vazia(), celula(itens[1]), vazia(), celula(itens[2])];
    }
    if (/-wa$/.test(grupo.id)) {
      return [celula(itens[0]), vazia(), vazia(), vazia(), celula(itens[1])];
    }
    return itens.map(celula);
  }

  function secaoGojuon(grupos) {
    var grade = h('div.tabela-grade');
    var solto = null;
    grupos.forEach(function (g) {
      linhaGojuon(g).forEach(function (n) { grade.appendChild(n); });
      if (/-wa$/.test(g.id) && g.items[2]) solto = g.items[2];
    });
    return h('div', {}, [
      h('div.titulo-secao', { text: 'Gojūon — os 46 básicos' }),
      cabecalho(['a', 'i', 'u', 'e', 'o']),
      grade,
      solto
        ? h('div', {}, [
            h('div.tabela-grade.colunas-1', { style: 'margin-top:6px' }, [celula(solto)]),
            h('p.mini', { text: 'ん (n) é o único kana sem vogal: fecha a sílaba e nunca começa palavra.' })
          ])
        : null
    ]);
  }

  function secaoGrade(titulo, grupos, colunas, rodape) {
    var grade = h('div.tabela-grade' + (colunas.length === 3 ? '.colunas-3' : ''));
    grupos.forEach(function (g) {
      g.items.forEach(function (it) { grade.appendChild(celula(it)); });
    });
    return h('div', {}, [
      h('div.titulo-secao', { text: titulo }),
      cabecalho(colunas),
      grade,
      rodape ? h('p.mini', { text: rodape }) : null
    ]);
  }

  function secaoEspeciais(sistema, grupos) {
    var itens = [];
    grupos.forEach(function (g) {
      g.items.forEach(function (it) { itens.push(it); });
    });
    if (!itens.length) return null;
    var grade = h('div.tabela-grade.colunas-3');
    itens.forEach(function (it) { grade.appendChild(celula(it)); });
    return h('div', {}, [
      h('div.titulo-secao', { text: 'Marcas especiais' }),
      grade,
      h('p.mini', {
        text: sistema === 'katakana'
          ? 'ッ dobra a consoante seguinte; ー alonga a vogal anterior. Nenhum dos dois tem som próprio.'
          : 'っ dobra a consoante seguinte e não tem som próprio. O alongamento no hiragana é feito repetindo a vogal.'
      })
    ]);
  }

  function secaoEstrangeiros() {
    var grade = h('div.tabela-grade.colunas-3');
    ESTRANGEIROS.forEach(function (par) {
      grade.appendChild(h('button.tab-celula', {
        type: 'button',
        onclick: function () { global.App.Speech.falar(par[0]); }
      }, [
        h('span.k', { text: par[0] }),
        h('span.r', { text: par[1] })
      ]));
    });
    return h('div', {}, [
      h('div.titulo-secao', { text: 'Sons estrangeiros' }),
      h('p.mini', {
        text: 'Combinações fora do silabário clássico, criadas para escrever palavras de outras línguas. ' +
              'Não entram nos exercícios, mas aparecem o tempo todo em nomes e marcas.'
      }),
      grade
    ]);
  }

  function secaoRegras() {
    return h('div', {}, [
      h('div.titulo-secao', { text: 'Regras de leitura' }),
      h('div.regras', {}, REGRAS.map(function (r) {
        return h('div.regra', {}, [
          h('span.marca-regra', { text: r[0] }),
          h('div.conteudo', {}, [
            h('b', { text: r[1] }),
            h('span', { text: r[2] }),
            h('span.ex', {}, [h('span.kana-s', { text: r[3] })])
          ])
        ]);
      }))
    ]);
  }

  function secaoVariantes() {
    return h('div', {}, [
      h('div.titulo-secao', { text: 'Variantes de escrita' }),
      h('p.mini', {
        text: 'O mesmo kana muda de desenho entre a fonte impressa e a letra de mão. ' +
              'Abaixo, o mesmo símbolo nas duas famílias de fonte do seu aparelho — se as duas ' +
              'colunas parecerem iguais, é porque o sistema só tem uma delas instalada.'
      }),
      h('div.variantes', {}, VARIANTES.map(function (v) {
        return h('div.variante', {}, [
          h('div.duas-formas', {}, [
            h('div.forma.mincho', {}, [
              h('div.glifo', { text: v[0] }),
              h('span.rot', { text: 'impresso' })
            ]),
            h('div.forma.gothic', {}, [
              h('div.glifo', { text: v[0] }),
              h('span.rot', { text: 'sem serifa' })
            ])
          ]),
          h('span.txt', { text: v[1] })
        ]);
      })),
      h('p.mini', {
        text: 'ゐ/ゑ e ヰ/ヱ (wi, we) existiram no silabário antigo e saíram de uso em 1946: ' +
              'você só os encontra em textos históricos, nomes próprios e rótulos antigos.'
      })
    ]);
  }

  function detalhe() {
    if (!estado.selecionado) return null;
    var e = global.App.Kana.find(estado.selecionado);
    if (!e) return null;
    var kun = global.App.Kana.kunrei(e);
    var linhas = [e.pron];
    if (kun !== e.romaji) linhas.push('Hepburn: ' + e.romaji + ' · kunrei: ' + kun);
    if (e.word) linhas.push(e.word + ' (' + e.wordRomaji + ') = ' + e.meaning);

    return h('div.detalhe-kana', {}, [
      h('span.grande', { text: e.kana }),
      h('div.corpo', {}, [
        h('b', { text: roman(e) }),
        h('span', { text: linhas.join(' · ') })
      ]),
      global.App.UI.botaoSom(e.word || e.kana, 'Ouvir ' + e.kana)
    ]);
  }

  function controles() {
    var sistema = global.App.Store.sistema();

    function segBt(id, rotulo) {
      return h('button', {
        type: 'button',
        'aria-pressed': sistema === id ? 'true' : 'false',
        onclick: function () {
          global.App.Store.sistema(id);
          estado.selecionado = null;
          global.App.recarregar();
        }
      }, rotulo);
    }

    var chipsRoman = h('div.chips', { 'aria-label': 'Romanização' });
    [['hepburn', 'Hepburn'], ['kunrei', 'Kunrei']].forEach(function (o) {
      chipsRoman.appendChild(h('button.chip', {
        type: 'button',
        'aria-pressed': estado.roman === o[0] ? 'true' : 'false',
        onclick: function () { estado.roman = o[0]; global.App.recarregar(); }
      }, o[1]));
    });

    return h('div', {}, [
      h('div.segmento', {}, [segBt('hiragana', 'ひらがな'), segBt('katakana', 'カタカナ')]),
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap' }, [
        chipsRoman,
        h('label.interruptor', {}, [
          h('input', {
            type: 'checkbox',
            checked: estado.pron ? true : null,
            onchange: function (ev) { estado.pron = ev.target.checked; global.App.recarregar(); }
          }),
          'Pronúncia'
        ])
      ]),
      estado.roman === 'kunrei'
        ? h('p.mini', { text: 'Kunrei-shiki: a romanização das tabelas escolares japonesas (si, tu, hu, zi, di, du). Para escrever nomes e endereços, use Hepburn.' })
        : h('p.mini', { text: 'Hepburn: a romanização mais usada fora do Japão (shi, tsu, fu, ji). Toque em qualquer kana para ouvir e ver os detalhes.' })
    ]);
  }

  function render(raiz) {
    var sistema = global.App.Store.sistema();
    var tabela = global.App.Kana.get(sistema);

    /* A seleção é estado de módulo e sobrevive à troca de tela. Se o silabário
     * mudou por fora (pela Home ou pelo Progresso), o kana escolhido antes não
     * existe mais nesta tabela — sem isso, o cartão de detalhe ficaria preso
     * mostrando um し acima da tabela de katakana. */
    if (estado.selecionado && !tabela.byKana[estado.selecionado]) estado.selecionado = null;

    var grupos = tabela.groups;

    function porTipo(t) {
      return grupos.filter(function (g) { return g.type === t; });
    }

    raiz.appendChild(h('div', {}, [
      controles(),
      detalhe(),
      secaoGojuon(porTipo('gojuon')),
      secaoGrade('Dakuten ゛ e handakuten ゜', porTipo('dakuten'), ['a', 'i', 'u', 'e', 'o'],
        'Dois tracinhos deixam a consoante sonora (k→g, s→z, t→d, h→b). A bolinha só existe na linha は e faz h→p.'),
      secaoGrade('Yōon — combinados', porTipo('yoon'), ['ya', 'yu', 'yo'],
        'Kana da coluna I + ゃ/ゅ/ょ pequeno. Vale uma sílaba só: きゃ é "kya", não "kiya".'),
      secaoEspeciais(sistema, porTipo('especial')),
      sistema === 'katakana' ? secaoEstrangeiros() : null,
      secaoRegras(),
      secaoVariantes(),
      h('div', { style: 'margin-top:18px' }, [
        h('button.btn.btn-primario.btn-largo', {
          type: 'button',
          onclick: function () { global.App.ir('praticar'); }
        }, 'Treinar o que está na tabela')
      ])
    ]));
  }

  global.App = global.App || {};
  global.App.Screens = global.App.Screens || {};
  global.App.Screens.tabela = { titulo: 'Tabela', render: render };
})(window);
