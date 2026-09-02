/* Tabelas de hiragana e katakana.
 * Cada som tem uma pronúncia aproximada em português (compartilhada entre os dois
 * silabários) e cada símbolo tem palavra-exemplo própria: hiragana usa palavras
 * nativas, katakana usa estrangeirismos — que é como cada um aparece na vida real. */
(function (global) {
  'use strict';

  /* Pronúncia aproximada em português, por som. */
  var PRON = {
    a: 'á — como em "casa"',
    i: 'i — como em "vida"',
    u: 'u — breve, lábios relaxados',
    e: 'é — aberto, como em "café"',
    o: 'ó — como em "bola"',

    ka: 'ká — "ca" de "cama"',
    ki: 'ki — "qui" de "quilo"',
    ku: 'ku — k + u breve',
    ke: 'ké — "que" de "quero"',
    ko: 'kó — "co" de "copo"',

    sa: 'sá — s forte, como em "assa"',
    shi: 'xi — como em "xícara"',
    su: 'su — s forte + u breve',
    se: 'sé — como em "assento"',
    so: 'só — como em "assobio"',

    ta: 'tá — t seco',
    chi: 'tchi — como "tch" + i',
    tsu: 'tsu — t e s juntos, u breve',
    te: 'tê — t seco, nunca "tchê"',
    to: 'tó — t seco',

    na: 'ná — como em "nada"',
    ni: 'ni — como em "ninho"',
    nu: 'nu — como em "nuvem"',
    ne: 'né — como em "neve"',
    no: 'nó — como em "nota"',

    ha: 'há — h soprado, bem leve',
    hi: 'hi — h soprado + i',
    fu: 'fu — entre "f" e "h", um sopro',
    he: 'hé — h soprado + é',
    ho: 'hó — h soprado + ó',

    ma: 'má — como em "mala"',
    mi: 'mi — como em "mimo"',
    mu: 'mu — como em "mudo"',
    me: 'mé — como em "mel"',
    mo: 'mó — como em "mola"',

    ya: 'iá — como em "ia"',
    yu: 'iu — como em "viu"',
    yo: 'ió — como em "iodo"',

    ra: 'rá — r brando, entre "caro" e "calo"',
    ri: 'ri — r brando',
    ru: 'ru — r brando',
    re: 'ré — r brando',
    ro: 'ró — r brando',

    wa: 'uá — como em "quase"',
    wo: 'ó — partícula; soa como "o"',
    n: 'n/m nasal — fecha a sílaba',

    ga: 'gá — g de "gato"',
    gi: 'gui — como em "guitarra"',
    gu: 'gu — como em "gula"',
    ge: 'guê — como em "guerra"',
    go: 'gô — como em "gota"',

    za: 'zá — como em "casa"',
    ji: 'ji — j de "jipe"',
    zu: 'zu — como em "azul"',
    ze: 'zé — como em "zebra"',
    zo: 'zó — como em "zona"',

    da: 'dá — d seco',
    de: 'dê — d seco, nunca "dji"',
    do: 'dó — d seco',

    ba: 'bá', bi: 'bi', bu: 'bu', be: 'bé', bo: 'bó',
    pa: 'pá', pi: 'pi', pu: 'pu', pe: 'pé', po: 'pó',

    kya: 'kiá — uma sílaba só', kyu: 'kiú — uma sílaba só', kyo: 'kió — uma sílaba só',
    sha: 'xá', shu: 'xu', sho: 'xó',
    cha: 'tchá', chu: 'tchu', cho: 'tchó',
    nya: 'niá', nyu: 'niú', nyo: 'nió',
    hya: 'hiá', hyu: 'hiú', hyo: 'hió',
    mya: 'miá', myu: 'miú', myo: 'mió',
    rya: 'riá — r brando', ryu: 'riú — r brando', ryo: 'rió — r brando',
    gya: 'guiá', gyu: 'guiú', gyo: 'guió',
    ja: 'já', ju: 'ju', jo: 'jó',
    bya: 'biá', byu: 'biú', byo: 'bió',
    pya: 'piá', pyu: 'piú', pyo: 'pió',

    sokuon: 'sem som próprio — dobra a consoante seguinte',
    chouon: 'sem som próprio — alonga a vogal anterior'
  };

  /* Grafias alternativas aceitas na digitação (Hepburn + kunrei + atalhos). */
  var ALTS = {
    shi: ['si'], chi: ['ti'], tsu: ['tu'], fu: ['hu'], ji: ['zi', 'di'], zu: ['du'],
    wo: ['o'], n: ['nn', 'm'],
    sha: ['sya'], shu: ['syu'], sho: ['syo'],
    cha: ['tya'], chu: ['tyu'], cho: ['tyo'],
    ja: ['zya', 'jya'], ju: ['zyu', 'jyu'], jo: ['zyo', 'jyo']
  };

  /* Romanização kunrei-shiki (a das tabelas escolares japonesas).
   * O app usa Hepburn por padrão — é a que aparece em placas, nomes e na
   * maioria dos materiais em português — mas muita tabela impressa traz kunrei,
   * então as duas ficam disponíveis. Só listamos onde as duas diferem. */
  var KUNREI = {
    shi: 'si', chi: 'ti', tsu: 'tu', fu: 'hu',
    ji: 'zi', zu: 'zu',
    sha: 'sya', shu: 'syu', sho: 'syo',
    cha: 'tya', chu: 'tyu', cho: 'tyo',
    ja: 'zya', ju: 'zyu', jo: 'zyo'
  };
  /* ぢ e づ são "di" e "du" em kunrei, mas dividem o romaji Hepburn com じ/ず —
   * por isso a exceção é por símbolo, não por som. */
  var KUNREI_KANA = { 'ぢ': 'di', 'づ': 'du', 'ヂ': 'di', 'ヅ': 'du' };

  /* Mnemônicas visuais — só para os 46 símbolos básicos de cada silabário.
   * Dakuten, handakuten e yōon são ensinados por regra (ver hint dos grupos). */
  var MNEM_H = {
    'あ': 'Um "A" com um laço no meio.',
    'い': 'Dois traços em pé, como dois "i" lado a lado.',
    'う': 'Um perfil de rosto olhando para baixo dizendo "u".',
    'え': 'Um escorpião com a cauda erguida.',
    'お': 'Quase igual a あ, mas com um chute a mais: gooool!',
    'か': 'Uma cadeira de perfil com um traço solto.',
    'き': 'Uma chave (key = ki).',
    'く': 'Um bico de pássaro aberto.',
    'け': 'Uma vela acesa: "quê".',
    'こ': 'Duas cordas paralelas.',
    'さ': 'É o き virado, sem o traço de baixo — um sapo pulando.',
    'し': 'Um anzol: quem fisga diz "xi!".',
    'す': 'Um pião girando com o fio enrolado.',
    'せ': 'Um garfo torto com o cabo cruzado.',
    'そ': 'Um zigue-zague de costura.',
    'た': 'Uma cruz com um "tá" pequeno ao lado.',
    'ち': 'Uma orelha: quem ouve diz "tchi".',
    'つ': 'A curva de uma onda: tsunami.',
    'て': 'Uma mão espalmada (te = mão em japonês).',
    'と': 'Um dedo com um espinho: "ai, tó!".',
    'な': 'Alguém ajoelhado rezando para não dizer "nada".',
    'に': 'Um ninho com dois ovos.',
    'ぬ': 'Um garfo enrolando macarrão (nu de "noodles").',
    'ね': 'Um gato com o rabo enrolado (neko = gato).',
    'の': 'Uma placa de proibido: "no!".',
    'は': 'A letra H grudada num "a": H + a = ha.',
    'ひ': 'Uma boca sorrindo: "hi hi hi".',
    'ふ': 'O Monte Fuji visto de longe.',
    'へ': 'Uma hélice / uma montanha bem baixinha.',
    'ほ': 'É o は com um traço a mais — uma casa com antena.',
    'ま': 'Um novelo de lã com dois traços.',
    'み': 'Os números 2 e 1: 21 = "minha" idade.',
    'む': 'Uma vaca dizendo "muuu".',
    'め': 'Um olho (me = olho em japonês).',
    'も': 'Um anzol com dois peixes: pesquei "mó" mais.',
    'や': 'Um iate com a vela inclinada.',
    'ゆ': 'Um peixe fisgado pelo anzol.',
    'よ': 'Um ioiô pendurado no fio.',
    'ら': 'Um coelho sentado de perfil (rabbit = ra).',
    'り': 'Duas gotas de chuva caindo no rio.',
    'る': 'Uma rua que termina num laço fechado.',
    'れ': 'É o ね sem o laço do gato — deu marcha à ré.',
    'ろ': 'É o る sem o laço — a rota ficou aberta.',
    'わ': 'Um bebê chorando "uá!".',
    'を': 'Alguém sentado numa cadeira chutando: marca o objeto da frase.',
    'ん': 'Um "n" escrito à mão, com a perna esticada.'
  };

  var MNEM_K = {
    'ア': 'Um "A" maiúsculo com uma perna só.',
    'イ': 'Uma pessoa apontando: "é isso!".',
    'ウ': 'Um chapéu com uma pena espetada.',
    'エ': 'Um "E" deitado: duas barras e o meio.',
    'オ': 'Um cabide para pendurar o casaco.',
    'カ': 'Igual ao か, mas sem o traço solto.',
    'キ': 'Igual ao き, a chave sem o rabinho.',
    'ク': 'Um bico aberto com telhado (parece o く de chapéu).',
    'ケ': 'Um quepe inclinado na cabeça.',
    'コ': 'As duas paredes de um cofre aberto.',
    'サ': 'Um salgueiro com dois galhos.',
    'シ': 'Três traços vindo da ESQUERDA, subindo: um sorriso deitado dizendo "xi".',
    'ス': 'Um escorregador com suporte.',
    'セ': 'Igual ao せ, sem o traço final.',
    'ソ': 'Dois traços vindo de CIMA: a agulha costurando (só).',
    'タ': 'Um táxi com a bandeirinha levantada.',
    'チ': 'Um 7 com um chapéu em cima.',
    'ツ': 'Três traços vindo de CIMA: respingos de um tsunami.',
    'テ': 'Uma antena de TV.',
    'ト': 'Um totem com um espinho de lado.',
    'ナ': 'Uma cruz com o braço torto.',
    'ニ': 'O kanji de 2 (二 = ni).',
    'ヌ': 'Um garfo com macarrão, versão angular do ぬ.',
    'ネ': 'Um gato de esquina, versão angular do ね.',
    'ノ': 'Um traço só: o corte do "no".',
    'ハ': 'Duas pernas abertas rindo: "ha ha".',
    'ヒ': 'Alguém sentado de perfil rindo: "hi".',
    'フ': 'Só a ladeira do Monte Fuji.',
    'ヘ': 'Igual ao へ: a hélice.',
    'ホ': 'Uma árvore (木) firme: a casa.',
    'マ': 'Uma boca aberta com a língua para fora.',
    'ミ': 'Três traços: o kanji de 3 (三 = mi).',
    'ム': 'Uma vaca deitada dizendo "mu".',
    'メ': 'Um X marcando o meio.',
    'モ': 'Igual ao も, sem a curva final.',
    'ヤ': 'Um iate angular.',
    'ユ': 'Uma âncora de cabeça para baixo.',
    'ヨ': 'Um "E" ao contrário: o pente do ioiô.',
    'ラ': 'Um raio com telhado.',
    'リ': 'Igual ao り: dois traços.',
    'ル': 'Duas pernas correndo pela rua.',
    'レ': 'Um traço que engata a marcha à ré.',
    'ロ': 'Um quadrado: o kanji de boca (口).',
    'ワ': 'Igual ao ウ, mas sem a pena: a boca aberta "uá".',
    'ヲ': 'Raro: hoje essa partícula se escreve を.',
    'ン': 'Dois traços vindo da ESQUERDA, subindo (o irmão do シ).'
  };

  /* Grupos: [id, rótulo, tipo, dica de regra, itens]
   * item = [kana, romaji, palavra, leitura, significado] */
  var HIRA = [
    ['h-a', 'あいうえお', 'gojuon', '', [
      ['あ', 'a', 'あめ', 'ame', 'chuva'],
      ['い', 'i', 'いぬ', 'inu', 'cachorro'],
      ['う', 'u', 'うみ', 'umi', 'mar'],
      ['え', 'e', 'えき', 'eki', 'estação'],
      ['お', 'o', 'おちゃ', 'ocha', 'chá']
    ]],
    ['h-ka', 'かきくけこ', 'gojuon', '', [
      ['か', 'ka', 'かさ', 'kasa', 'guarda-chuva'],
      ['き', 'ki', 'きのこ', 'kinoko', 'cogumelo'],
      ['く', 'ku', 'くつ', 'kutsu', 'sapato'],
      ['け', 'ke', 'けむり', 'kemuri', 'fumaça'],
      ['こ', 'ko', 'こえ', 'koe', 'voz']
    ]],
    ['h-sa', 'さしすせそ', 'gojuon', '', [
      ['さ', 'sa', 'さかな', 'sakana', 'peixe'],
      ['し', 'shi', 'しま', 'shima', 'ilha'],
      ['す', 'su', 'すいか', 'suika', 'melancia'],
      ['せ', 'se', 'せかい', 'sekai', 'mundo'],
      ['そ', 'so', 'そら', 'sora', 'céu']
    ]],
    ['h-ta', 'たちつてと', 'gojuon', '', [
      ['た', 'ta', 'たまご', 'tamago', 'ovo'],
      ['ち', 'chi', 'ちず', 'chizu', 'mapa'],
      ['つ', 'tsu', 'つき', 'tsuki', 'lua'],
      ['て', 'te', 'てがみ', 'tegami', 'carta'],
      ['と', 'to', 'とり', 'tori', 'pássaro']
    ]],
    ['h-na', 'なにぬねの', 'gojuon', '', [
      ['な', 'na', 'なつ', 'natsu', 'verão'],
      ['に', 'ni', 'にく', 'niku', 'carne'],
      ['ぬ', 'nu', 'ぬの', 'nuno', 'tecido, pano'],
      ['ね', 'ne', 'ねこ', 'neko', 'gato'],
      ['の', 'no', 'のり', 'nori', 'alga marinha']
    ]],
    ['h-ha', 'はひふへほ', 'gojuon', '', [
      ['は', 'ha', 'はな', 'hana', 'flor'],
      ['ひ', 'hi', 'ひと', 'hito', 'pessoa'],
      ['ふ', 'fu', 'ふゆ', 'fuyu', 'inverno'],
      ['へ', 'he', 'へや', 'heya', 'quarto'],
      ['ほ', 'ho', 'ほし', 'hoshi', 'estrela']
    ]],
    ['h-ma', 'まみむめも', 'gojuon', '', [
      ['ま', 'ma', 'まど', 'mado', 'janela'],
      ['み', 'mi', 'みず', 'mizu', 'água'],
      ['む', 'mu', 'むし', 'mushi', 'inseto'],
      ['め', 'me', 'め', 'me', 'olho'],
      ['も', 'mo', 'もり', 'mori', 'floresta']
    ]],
    ['h-ya', 'やゆよ', 'gojuon', '', [
      ['や', 'ya', 'やま', 'yama', 'montanha'],
      ['ゆ', 'yu', 'ゆき', 'yuki', 'neve'],
      ['よ', 'yo', 'よる', 'yoru', 'noite']
    ]],
    ['h-ra', 'らりるれろ', 'gojuon', '', [
      ['ら', 'ra', 'らくだ', 'rakuda', 'camelo'],
      ['り', 'ri', 'りんご', 'ringo', 'maçã'],
      ['る', 'ru', 'るす', 'rusu', 'fora de casa'],
      ['れ', 're', 'れきし', 'rekishi', 'história'],
      ['ろ', 'ro', 'ろうそく', 'rousoku', 'vela']
    ]],
    ['h-wa', 'わをん', 'gojuon', 'を só aparece como partícula (marca o objeto da frase). ん é o único kana que fecha sílaba.', [
      ['わ', 'wa', 'わたし', 'watashi', 'eu'],
      ['を', 'wo', 'ほんをよむ', 'hon wo yomu', 'ler um livro'],
      ['ん', 'n', 'ほん', 'hon', 'livro']
    ]],
    ['h-ga', 'がぎぐげご', 'dakuten', 'Dakuten (゛): a consoante fica sonora. か→が (k vira g).', [
      ['が', 'ga', 'がっこう', 'gakkou', 'escola'],
      ['ぎ', 'gi', 'ぎんこう', 'ginkou', 'banco'],
      ['ぐ', 'gu', 'ぐあい', 'guai', 'estado, condição'],
      ['げ', 'ge', 'げんき', 'genki', 'disposto, bem'],
      ['ご', 'go', 'ごはん', 'gohan', 'arroz, refeição']
    ]],
    ['h-za', 'ざじずぜぞ', 'dakuten', 'Dakuten (゛): さ→ざ (s vira z). Atenção: し→じ soa "ji".', [
      ['ざ', 'za', 'ざっし', 'zasshi', 'revista'],
      ['じ', 'ji', 'じかん', 'jikan', 'tempo, hora'],
      ['ず', 'zu', 'ずつう', 'zutsuu', 'dor de cabeça'],
      ['ぜ', 'ze', 'かぜ', 'kaze', 'vento'],
      ['ぞ', 'zo', 'ぞう', 'zou', 'elefante']
    ]],
    ['h-da', 'だぢづでど', 'dakuten', 'Dakuten (゛): た→だ. ぢ e づ são raros e soam iguais a じ e ず.', [
      ['だ', 'da', 'だいがく', 'daigaku', 'universidade'],
      ['ぢ', 'ji', 'はなぢ', 'hanaji', 'sangramento no nariz (raro)'],
      ['づ', 'zu', 'つづく', 'tsuzuku', 'continuar (raro)'],
      ['で', 'de', 'でんわ', 'denwa', 'telefone'],
      ['ど', 'do', 'どうぶつ', 'doubutsu', 'animal']
    ]],
    ['h-ba', 'ばびぶべぼ', 'dakuten', 'Dakuten (゛): は→ば (h vira b).', [
      ['ば', 'ba', 'ばら', 'bara', 'rosa'],
      ['び', 'bi', 'びん', 'bin', 'garrafa'],
      ['ぶ', 'bu', 'ぶた', 'buta', 'porco'],
      ['べ', 'be', 'べんとう', 'bentou', 'marmita'],
      ['ぼ', 'bo', 'ぼうし', 'boushi', 'chapéu']
    ]],
    ['h-pa', 'ぱぴぷぺぽ', 'dakuten', 'Handakuten (゜, a bolinha): は→ぱ (h vira p). Só a linha は tem.', [
      ['ぱ', 'pa', 'いっぱい', 'ippai', 'cheio, bastante'],
      ['ぴ', 'pi', 'ぴかぴか', 'pikapika', 'brilhando'],
      ['ぷ', 'pu', 'てんぷら', 'tenpura', 'tempurá'],
      ['ぺ', 'pe', 'ぺらぺら', 'perapera', 'fluente (na fala)'],
      ['ぽ', 'po', 'さんぽ', 'sanpo', 'passeio, caminhada']
    ]],
    ['h-kya', 'きゃきゅきょ', 'yoon', 'Yōon: kana da coluna I + や/ゆ/よ PEQUENO = uma sílaba só. きゃ = "kya", nunca "kiya".', [
      ['きゃ', 'kya', 'きゃく', 'kyaku', 'cliente, visita'],
      ['きゅ', 'kyu', 'きゅう', 'kyuu', 'nove'],
      ['きょ', 'kyo', 'きょう', 'kyou', 'hoje']
    ]],
    ['h-sha', 'しゃしゅしょ', 'yoon', 'し + や/ゆ/よ pequeno = sha/shu/sho (o "i" some).', [
      ['しゃ', 'sha', 'しゃしん', 'shashin', 'foto'],
      ['しゅ', 'shu', 'しゅみ', 'shumi', 'hobby'],
      ['しょ', 'sho', 'しょくじ', 'shokuji', 'refeição']
    ]],
    ['h-cha', 'ちゃちゅちょ', 'yoon', 'ち + や/ゆ/よ pequeno = cha/chu/cho.', [
      ['ちゃ', 'cha', 'ちゃいろ', 'chairo', 'cor marrom'],
      ['ちゅ', 'chu', 'ちゅうい', 'chuui', 'atenção, cuidado'],
      ['ちょ', 'cho', 'ちょっと', 'chotto', 'um pouco']
    ]],
    ['h-nya', 'にゃにゅにょ', 'yoon', '', [
      ['にゃ', 'nya', 'にゃんこ', 'nyanko', 'gatinho (informal)'],
      ['にゅ', 'nyu', 'にゅうがく', 'nyuugaku', 'ingresso na escola'],
      ['にょ', 'nyo', 'にょきにょき', 'nyokinyoki', 'brotando um atrás do outro']
    ]],
    ['h-hya', 'ひゃひゅひょ', 'yoon', '', [
      ['ひゃ', 'hya', 'ひゃく', 'hyaku', 'cem'],
      ['ひゅ', 'hyu', 'ひゅうひゅう', 'hyuuhyuu', 'som do vento assobiando'],
      ['ひょ', 'hyo', 'ひょう', 'hyou', 'tabela, gráfico']
    ]],
    ['h-mya', 'みゃみゅみょ', 'yoon', '', [
      ['みゃ', 'mya', 'みゃく', 'myaku', 'pulso (batimento)'],
      ['みゅ', 'myu', 'みゅーじあむ', 'myuujiamu', 'museu (raro; quase só em palavras estrangeiras)'],
      ['みょ', 'myo', 'みょうじ', 'myouji', 'sobrenome']
    ]],
    ['h-rya', 'りゃりゅりょ', 'yoon', '', [
      ['りゃ', 'rya', 'りゃく', 'ryaku', 'abreviação'],
      ['りゅ', 'ryu', 'りゅう', 'ryuu', 'dragão'],
      ['りょ', 'ryo', 'りょうり', 'ryouri', 'culinária, prato']
    ]],
    ['h-gya', 'ぎゃぎゅぎょ', 'yoon', 'Yōon com dakuten: ぎ + や pequeno = gya.', [
      ['ぎゃ', 'gya', 'ぎゃく', 'gyaku', 'inverso, contrário'],
      ['ぎゅ', 'gyu', 'ぎゅうにゅう', 'gyuunyuu', 'leite'],
      ['ぎょ', 'gyo', 'ぎょうざ', 'gyouza', 'guioza']
    ]],
    ['h-ja', 'じゃじゅじょ', 'yoon', 'じ + や/ゆ/よ pequeno = ja/ju/jo.', [
      ['じゃ', 'ja', 'じゃがいも', 'jagaimo', 'batata'],
      ['じゅ', 'ju', 'じゅう', 'juu', 'dez'],
      ['じょ', 'jo', 'じょせい', 'josei', 'mulher']
    ]],
    ['h-bya', 'びゃびゅびょ', 'yoon', '', [
      ['びゃ', 'bya', 'さんびゃく', 'sanbyaku', 'trezentos'],
      ['びゅ', 'byu', 'びゅうびゅう', 'byuubyuu', 'som de vento forte'],
      ['びょ', 'byo', 'びょういん', 'byouin', 'hospital']
    ]],
    ['h-pya', 'ぴゃぴゅぴょ', 'yoon', '', [
      ['ぴゃ', 'pya', 'はっぴゃく', 'happyaku', 'oitocentos'],
      ['ぴゅ', 'pyu', 'ぴゅうぴゅう', 'pyuupyuu', 'som de vento cortante'],
      ['ぴょ', 'pyo', 'ぴょんぴょん', 'pyonpyon', 'pulando']
    ]],
    ['h-sp', 'っ (especial)', 'especial', 'O っ pequeno não tem som próprio: ele DOBRA a consoante seguinte e cria uma pausa. きって = "kit-te".', [
      ['っ', 'sokuon', 'きって', 'kitte', 'selo']
    ]]
  ];

  var KATA = [
    ['k-a', 'アイウエオ', 'gojuon', '', [
      ['ア', 'a', 'アイス', 'aisu', 'sorvete'],
      ['イ', 'i', 'イタリア', 'itaria', 'Itália'],
      ['ウ', 'u', 'ウイルス', 'uirusu', 'vírus'],
      ['エ', 'e', 'エアコン', 'eakon', 'ar-condicionado'],
      ['オ', 'o', 'オレンジ', 'orenji', 'laranja']
    ]],
    ['k-ka', 'カキクケコ', 'gojuon', '', [
      ['カ', 'ka', 'カメラ', 'kamera', 'câmera'],
      ['キ', 'ki', 'キッチン', 'kicchin', 'cozinha'],
      ['ク', 'ku', 'クラス', 'kurasu', 'turma, classe'],
      ['ケ', 'ke', 'ケーキ', 'keeki', 'bolo'],
      ['コ', 'ko', 'コーヒー', 'koohii', 'café']
    ]],
    ['k-sa', 'サシスセソ', 'gojuon', 'Cuidado: シ (shi) e ツ (tsu) são quase iguais — veja a direção dos traços.', [
      ['サ', 'sa', 'サラダ', 'sarada', 'salada'],
      ['シ', 'shi', 'システム', 'shisutemu', 'sistema'],
      ['ス', 'su', 'スープ', 'suupu', 'sopa'],
      ['セ', 'se', 'セーター', 'seetaa', 'suéter'],
      ['ソ', 'so', 'ソファ', 'sofa', 'sofá']
    ]],
    ['k-ta', 'タチツテト', 'gojuon', '', [
      ['タ', 'ta', 'タクシー', 'takushii', 'táxi'],
      ['チ', 'chi', 'チーズ', 'chiizu', 'queijo'],
      ['ツ', 'tsu', 'ツアー', 'tsuaa', 'excursão'],
      ['テ', 'te', 'テレビ', 'terebi', 'televisão'],
      ['ト', 'to', 'トマト', 'tomato', 'tomate']
    ]],
    ['k-na', 'ナニヌネノ', 'gojuon', '', [
      ['ナ', 'na', 'ナイフ', 'naifu', 'faca'],
      ['ニ', 'ni', 'テニス', 'tenisu', 'tênis (esporte)'],
      ['ヌ', 'nu', 'ヌードル', 'nuudoru', 'macarrão instantâneo'],
      ['ネ', 'ne', 'ネクタイ', 'nekutai', 'gravata'],
      ['ノ', 'no', 'ノート', 'nooto', 'caderno']
    ]],
    ['k-ha', 'ハヒフヘホ', 'gojuon', '', [
      ['ハ', 'ha', 'ハンバーガー', 'hanbaagaa', 'hambúrguer'],
      ['ヒ', 'hi', 'ヒーター', 'hiitaa', 'aquecedor'],
      ['フ', 'fu', 'フォーク', 'fooku', 'garfo'],
      ['ヘ', 'he', 'ヘリコプター', 'herikoputaa', 'helicóptero'],
      ['ホ', 'ho', 'ホテル', 'hoteru', 'hotel']
    ]],
    ['k-ma', 'マミムメモ', 'gojuon', '', [
      ['マ', 'ma', 'マスク', 'masuku', 'máscara'],
      ['ミ', 'mi', 'ミルク', 'miruku', 'leite'],
      ['ム', 'mu', 'ゲーム', 'geemu', 'jogo'],
      ['メ', 'me', 'メール', 'meeru', 'e-mail'],
      ['モ', 'mo', 'メモ', 'memo', 'anotação']
    ]],
    ['k-ya', 'ヤユヨ', 'gojuon', '', [
      ['ヤ', 'ya', 'タイヤ', 'taiya', 'pneu'],
      ['ユ', 'yu', 'ユーロ', 'yuuro', 'euro'],
      ['ヨ', 'yo', 'ヨーグルト', 'yooguruto', 'iogurte']
    ]],
    ['k-ra', 'ラリルレロ', 'gojuon', '', [
      ['ラ', 'ra', 'ラジオ', 'rajio', 'rádio'],
      ['リ', 'ri', 'リボン', 'ribon', 'laço, fita'],
      ['ル', 'ru', 'ルール', 'ruuru', 'regra'],
      ['レ', 're', 'レストラン', 'resutoran', 'restaurante'],
      ['ロ', 'ro', 'ロボット', 'robotto', 'robô']
    ]],
    ['k-wa', 'ワヲン', 'gojuon', 'ヲ praticamente não é usado. Cuidado: ン (n) e ソ (so) se parecem.', [
      ['ワ', 'wa', 'ワイン', 'wain', 'vinho'],
      ['ヲ', 'wo', '', '', 'raro; hoje a partícula se escreve を'],
      ['ン', 'n', 'パン', 'pan', 'pão']
    ]],
    ['k-ga', 'ガギグゲゴ', 'dakuten', 'Dakuten (゛): カ→ガ (k vira g).', [
      ['ガ', 'ga', 'ガラス', 'garasu', 'vidro'],
      ['ギ', 'gi', 'ギター', 'gitaa', 'violão, guitarra'],
      ['グ', 'gu', 'グラス', 'gurasu', 'copo'],
      ['ゲ', 'ge', 'ゲスト', 'gesuto', 'convidado'],
      ['ゴ', 'go', 'ゴム', 'gomu', 'borracha']
    ]],
    ['k-za', 'ザジズゼゾ', 'dakuten', 'Dakuten (゛): サ→ザ. シ→ジ soa "ji".', [
      ['ザ', 'za', 'ピザ', 'piza', 'pizza'],
      ['ジ', 'ji', 'ジム', 'jimu', 'academia'],
      ['ズ', 'zu', 'サイズ', 'saizu', 'tamanho'],
      ['ゼ', 'ze', 'ゼロ', 'zero', 'zero'],
      ['ゾ', 'zo', 'ゾーン', 'zoon', 'zona']
    ]],
    ['k-da', 'ダヂヅデド', 'dakuten', 'ヂ e ヅ são raríssimos e soam iguais a ジ e ズ.', [
      ['ダ', 'da', 'ダンス', 'dansu', 'dança'],
      ['ヂ', 'ji', '', '', 'raríssimo; use ジ'],
      ['ヅ', 'zu', '', '', 'raríssimo; use ズ'],
      ['デ', 'de', 'デザート', 'dezaato', 'sobremesa'],
      ['ド', 'do', 'ドア', 'doa', 'porta']
    ]],
    ['k-ba', 'バビブベボ', 'dakuten', 'Dakuten (゛): ハ→バ (h vira b).', [
      ['バ', 'ba', 'バス', 'basu', 'ônibus'],
      ['ビ', 'bi', 'ビール', 'biiru', 'cerveja'],
      ['ブ', 'bu', 'ブラジル', 'burajiru', 'Brasil'],
      ['ベ', 'be', 'ベッド', 'beddo', 'cama'],
      ['ボ', 'bo', 'ボタン', 'botan', 'botão']
    ]],
    ['k-pa', 'パピプペポ', 'dakuten', 'Handakuten (゜): ハ→パ (h vira p).', [
      ['パ', 'pa', 'パスタ', 'pasuta', 'massa'],
      ['ピ', 'pi', 'ピアノ', 'piano', 'piano'],
      ['プ', 'pu', 'プール', 'puuru', 'piscina'],
      ['ペ', 'pe', 'ペン', 'pen', 'caneta'],
      ['ポ', 'po', 'ポスト', 'posuto', 'caixa de correio']
    ]],
    ['k-kya', 'キャキュキョ', 'yoon', 'Yōon: kana da coluna I + ャ/ュ/ョ PEQUENO = uma sílaba só.', [
      ['キャ', 'kya', 'キャンプ', 'kyanpu', 'acampamento'],
      ['キュ', 'kyu', 'バーベキュー', 'baabekyuu', 'churrasco'],
      ['キョ', 'kyo', 'トウキョウ', 'toukyou', 'Tóquio']
    ]],
    ['k-sha', 'シャシュショ', 'yoon', '', [
      ['シャ', 'sha', 'シャワー', 'shawaa', 'chuveiro'],
      ['シュ', 'shu', 'シューズ', 'shuuzu', 'sapatos'],
      ['ショ', 'sho', 'ショッピング', 'shoppingu', 'compras']
    ]],
    ['k-cha', 'チャチュチョ', 'yoon', '', [
      ['チャ', 'cha', 'チャンス', 'chansu', 'chance'],
      ['チュ', 'chu', 'チューブ', 'chuubu', 'tubo'],
      ['チョ', 'cho', 'チョコレート', 'chokoreeto', 'chocolate']
    ]],
    ['k-nya', 'ニャニュニョ', 'yoon', '', [
      ['ニャ', 'nya', 'ニャー', 'nyaa', 'miau'],
      ['ニュ', 'nyu', 'ニュース', 'nyuusu', 'notícias'],
      ['ニョ', 'nyo', 'ニョッキ', 'nyokki', 'nhoque']
    ]],
    ['k-hya', 'ヒャヒュヒョ', 'yoon', '', [
      ['ヒャ', 'hya', 'ヒャク', 'hyaku', 'cem (som comum; costuma-se escrever 百)'],
      ['ヒュ', 'hyu', 'ヒューズ', 'hyuuzu', 'fusível'],
      ['ヒョ', 'hyo', 'ヒョウ', 'hyou', 'leopardo']
    ]],
    ['k-mya', 'ミャミュミョ', 'yoon', '', [
      ['ミャ', 'mya', 'ミャンマー', 'myanmaa', 'Mianmar'],
      ['ミュ', 'myu', 'ミュージック', 'myuujikku', 'música'],
      ['ミョ', 'myo', 'ミョウガ', 'myouga', 'mioga (planta)']
    ]],
    ['k-rya', 'リャリュリョ', 'yoon', '', [
      ['リャ', 'rya', 'リャマ', 'ryama', 'lhama'],
      ['リュ', 'ryu', 'リュック', 'ryukku', 'mochila'],
      ['リョ', 'ryo', 'リョウリ', 'ryouri', 'culinária (som comum; costuma-se escrever 料理)']
    ]],
    ['k-gya', 'ギャギュギョ', 'yoon', '', [
      ['ギャ', 'gya', 'ギャラリー', 'gyararii', 'galeria'],
      ['ギュ', 'gyu', 'レギュラー', 'regyuraa', 'regular'],
      ['ギョ', 'gyo', 'ギョーザ', 'gyooza', 'guioza']
    ]],
    ['k-ja', 'ジャジュジョ', 'yoon', '', [
      ['ジャ', 'ja', 'ジャケット', 'jaketto', 'jaqueta'],
      ['ジュ', 'ju', 'ジュース', 'juusu', 'suco'],
      ['ジョ', 'jo', 'ジョギング', 'jogingu', 'corrida (jogging)']
    ]],
    ['k-bya', 'ビャビュビョ', 'yoon', '', [
      ['ビャ', 'bya', 'ビャクダン', 'byakudan', 'sândalo'],
      ['ビュ', 'byu', 'インタビュー', 'intabyuu', 'entrevista'],
      ['ビョ', 'byo', 'ビョウイン', 'byouin', 'hospital (som comum; costuma-se escrever 病院)']
    ]],
    ['k-pya', 'ピャピュピョ', 'yoon', '', [
      ['ピャ', 'pya', 'ハッピャク', 'happyaku', 'oitocentos (som; costuma-se escrever 八百)'],
      ['ピュ', 'pyu', 'コンピューター', 'konpyuutaa', 'computador'],
      ['ピョ', 'pyo', 'ピョンヤン', 'pyonyan', 'Pyongyang']
    ]],
    ['k-sp', 'ッ e ー (especiais)', 'especial', 'ッ dobra a consoante seguinte (ベッド = "bed-do"). ー alonga a vogal anterior (コーヒー = "koohii").', [
      ['ッ', 'sokuon', 'ベッド', 'beddo', 'cama'],
      ['ー', 'chouon', 'コーヒー', 'koohii', 'café']
    ]]
  ];

  function build(id, label, groups, mnem) {
    var sys = { id: id, label: label, groups: [], all: [], quiz: [], byKana: {}, byRomaji: {} };
    groups.forEach(function (g) {
      var group = { id: g[0], label: g[1], type: g[2], hint: g[3], items: [] };
      g[4].forEach(function (it) {
        var romaji = it[1];
        var quizzable = group.type !== 'especial';
        var entry = {
          kana: it[0],
          romaji: romaji,
          pron: PRON[romaji] || '',
          mnem: mnem[it[0]] || '',
          word: it[2],
          wordRomaji: it[3],
          meaning: it[4],
          system: id,
          group: group.id,
          groupLabel: group.label,
          type: group.type,
          quiz: quizzable,
          accepts: [romaji].concat(ALTS[romaji] || [])
        };
        group.items.push(entry);
        sys.all.push(entry);
        sys.byKana[entry.kana] = entry;
        if (quizzable) {
          sys.quiz.push(entry);
          (sys.byRomaji[romaji] = sys.byRomaji[romaji] || []).push(entry);
        }
      });
      sys.groups.push(group);
    });
    return sys;
  }

  var hiragana = build('hiragana', 'Hiragana', HIRA, MNEM_H);
  var katakana = build('katakana', 'Katakana', KATA, MNEM_K);

  /* Equivalência entre os silabários, para as dicas das anotações. */
  var pairs = {};
  hiragana.quiz.forEach(function (h, i) {
    var k = katakana.quiz[i];
    /* As duas tabelas têm a mesma ordem, então o par é posicional — isso mantém
     * ぢ↔ヂ e づ↔ヅ corretos, apesar de dividirem o romaji com じ/ず. */
    if (k) { pairs[h.kana] = k.kana; pairs[k.kana] = h.kana; }
  });

  global.App = global.App || {};
  global.App.Kana = {
    hiragana: hiragana,
    katakana: katakana,
    systems: ['hiragana', 'katakana'],
    get: function (id) { return id === 'katakana' ? katakana : hiragana; },
    other: function (id) { return id === 'katakana' ? 'hiragana' : 'katakana'; },
    counterpart: function (kana) { return pairs[kana] || null; },
    find: function (kana) { return hiragana.byKana[kana] || katakana.byKana[kana] || null; },
    pron: PRON,
    /* Leitura para MOSTRAR na tela. っ/ッ e ー não têm som próprio: "sokuon" e
     * "chouon" são só os nomes internos dessas marcas, e exibi-los como se
     * fossem leitura confunde. */
    leitura: function (entrada) {
      if (!entrada) return '';
      if (entrada.romaji === 'sokuon' || entrada.romaji === 'chouon') return '';
      return entrada.romaji;
    },
    /* Romanização alternativa (kunrei-shiki). Devolve a Hepburn quando não há diferença. */
    kunrei: function (entrada) {
      if (!entrada) return '';
      return KUNREI_KANA[entrada.kana] || KUNREI[entrada.romaji] || entrada.romaji;
    },
    /* Normaliza a digitação: minúsculas, sem acento, sem espaço. */
    normalize: function (s) {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '');
    }
  };
})(window);
