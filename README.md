# かな — Hiragana e Katakana

App web para memorizar os dois silabários japoneses: HTML, CSS e JavaScript puro, sem build, sem dependências, sem login e sem servidor.

## O que ele faz

- **Início** — quantos kana estão dominados, em aprendizado e para revisar, o acerto geral e um clique para cada tela.
- **Tabela** — os dois silabários inteiros para consulta (gojūon, dakuten/handakuten, yōon, marcas especiais e os sons estrangeiros do katakana), com romanização Hepburn ou kunrei-shiki, 11 regras de leitura e as variantes de traçado entre fonte impressa e letra de mão.
- **Estudar** — linha por linha (あ, か, さ…), com som, mnemônica, palavra-exemplo e modo flashcard.
- **Praticar** — quatro tipos de exercício: kana → romaji, romaji → kana, ouvir e digitar.
- **Revisão** — sessão finita (14 itens) montada a partir dos seus erros recentes e do que já venceu.
- **Anotações** — você escreve, o app lê o que você escreveu e sugere complementos gerados localmente.
- **Músicas** — fichas de músicas famosas e um leitor onde você cola a letra que quiser estudar.
- **Tutor** — chat opcional com IA, só se você colar sua própria chave.
- **Progresso** — todos os kana, um a um, com o nível de cada um.
- **Ajustes** — silabário, tipo de exercício, voz, chave de IA e apagar os dados.

## Como o app decide o que perguntar

Cada kana tem um nível de 0 a 7, e cada nível é um intervalo até a próxima cobrança: 1 min, 10 min, 1 h, 8 h, 1 dia, 3 dias, 7 dias e 21 dias. Acerto sobe um nível; erro desce **dois** e devolve o kana para a fila imediata, ainda na mesma sessão. Acerto lento (mais de 5 s) sobe de nível, mas vale só metade do intervalo — o objetivo é reconhecimento automático, não acerto sofrido. Um kana só é contado como **dominado** com nível 6 ou mais, tempo médio de resposta abaixo de 3 s e pelo menos 80% de acerto nas últimas respostas; errar hoje faz o app insistir bem mais nele nos próximos 30 minutos. O tipo de exercício acompanha o nível: nos níveis 0–1 é múltipla escolha (kana → romaji), nos 2–3 entram escolher o kana, ouvir e digitar, e do 4 em diante a digitação domina — recordar do zero fixa mais do que reconhecer. E as alternativas erradas não são sorteadas: primeiro vêm os kana com que **você** já confundiu aquele, depois os visualmente parecidos, depois os da mesma linha.

## Como rodar

Abrir o `index.html` direto no navegador já funciona para navegar e estudar. Para o modo offline (o service worker só roda em `http://` ou `https://`), suba um servidor local:

```
python3 -m http.server 8000
```

E abra <http://localhost:8000>.

## Publicar no GitHub Pages

O workflow já está incluído em `.github/workflows/pages.yml`. Basta ativar em **Settings → Pages → Source: GitHub Actions**. A partir daí, todo push na branch publica a raiz do repositório.

## Privacidade

Progresso, anotações e chave de IA ficam apenas no `localStorage` do seu navegador. Não há login, não há servidor, não há analytics e não há anúncios. Limpar os dados do site apaga tudo — e nada sai daí sem você pedir.

## IA opcional

O app funciona 100% sem IA: as dicas das anotações são geradas localmente, sem rede. Se você colar sua própria chave da Anthropic em **Ajustes**, aparecem dois extras: o botão **Enriquecer com IA** nas anotações e a tela **Tutor**. A chave fica só no `localStorage` do seu navegador, é enviada direto para a API da Anthropic e nunca é gravada no repositório.

## Músicas

O app **não hospeda áudio nem letras** — isso é obra protegida. Ele traz só a ficha da música (título, leitura em kana, tradução, artista, ano e contexto) e um link para a fonte oficial. O leitor é seu: você cola o texto que quiser estudar, o app destaca os kana e transforma aquilo em exercício.

## Estrutura de arquivos

```
japo/
├── index.html              casca do app e a ordem dos <script>
├── manifest.webmanifest    dados de instalação (PWA)
├── sw.js                   service worker: cache para funcionar offline
├── assets/icon.svg         ícone, か desenhado em curvas
├── css/styles.css          todo o estilo, claro e escuro
└── js/
    ├── app.js              roteador por hash e inicialização
    ├── ui/dom.js           utilitários de DOM (sem framework)
    ├── data/kana.js        tabelas, pronúncias, mnemônicas e exemplos
    ├── data/confusions.js  pares de kana que se parecem
    ├── data/songs.js       fichas das músicas (sem letra, sem áudio)
    ├── core/store.js       localStorage: progresso, notas e ajustes
    ├── core/srs.js         repetição espaçada (níveis e intervalos)
    ├── core/speech.js      voz japonesa do próprio aparelho
    ├── core/quiz.js        montagem das questões e dos distratores
    ├── core/tips.js        sugestões locais para as anotações
    ├── core/ai.js          IA opcional, com a chave do usuário
    └── screens/            uma tela por arquivo (home, chart, study, practice,
                            notes, songs, chat, progress, settings)
```

O conteúdo dos kana — pronúncias aproximadas em português, mnemônicas e palavras-exemplo — é material didático próprio do projeto.
