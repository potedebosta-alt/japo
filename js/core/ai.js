/* IA OPCIONAL — extra por cima do motor local de dicas.
 *
 * O app funciona 100% sem isto. Se (e só se) a pessoa colar a própria chave da
 * Anthropic em Ajustes, aparece um botão "Enriquecer com IA" nas anotações.
 *
 * A chave fica apenas no localStorage do navegador dela: não vai para o
 * repositório, não passa por servidor nosso (não existe servidor) e some se ela
 * limpar os dados do site.
 *
 * Chamada via fetch direto porque o projeto não tem build step nem dependências —
 * o SDK oficial exigiria npm e empacotador, o que quebraria o requisito de
 * funcionar offline. */
(function (global) {
  'use strict';

  var ENDPOINT = 'https://api.anthropic.com/v1/messages';
  var VERSION = '2023-06-01';
  var MODELO_PADRAO = 'claude-opus-5';

  var MODELOS = [
    { id: 'claude-opus-5', nome: 'Opus 5 (mais capaz)' },
    { id: 'claude-sonnet-5', nome: 'Sonnet 5 (equilibrado)' },
    { id: 'claude-haiku-4-5', nome: 'Haiku 4.5 (mais barato)' }
  ];

  var SISTEMA =
    'Você é um tutor de japonês para falantes de português do Brasil. ' +
    'O usuário está memorizando hiragana e katakana e escreveu uma anotação de estudo. ' +
    'Complemente a anotação dele com informações úteis e específicas: mnemônicas melhores, ' +
    'kana parecidos que costumam ser confundidos, palavras curtas de exemplo e erros comuns de pronúncia. ' +
    'Regras: responda em português do Brasil; no máximo 5 itens; cada item em uma linha começando com "- "; ' +
    'cada item com no máximo 140 caracteres; nada de saudação, introdução ou conclusão; ' +
    'não repita o que a anotação já diz.';

  function ajustes() { return global.App.Store.ajustes(); }

  function configurado() {
    var a = ajustes();
    return !!(a && a.aiKey && a.aiKey.length > 10);
  }

  function contexto(sistema) {
    var pool = global.App.Kana.get(sistema).quiz;
    var fracos = global.App.SRS.errosRecentes(sistema, pool, 6).map(function (e) {
      return e.kana + ' (' + e.romaji + ')';
    });
    if (!fracos.length) return '';
    return '\n\nKana que este usuário errou recentemente: ' + fracos.join(', ') + '.';
  }

  function chamar(corpo) {
    var a = ajustes();
    return global.fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': a.aiKey,
        'anthropic-version': VERSION,
        /* Header exigido para chamar a API direto do navegador. */
        'anthropic-dangerous-direct-browser-access': 'true',
        'anthropic-beta': 'server-side-fallback-2026-07-01'
      },
      body: JSON.stringify(corpo)
    }).then(function (r) {
      return r.json().then(function (json) {
        if (!r.ok) {
          var msg = (json && json.error && json.error.message) || ('Erro HTTP ' + r.status);
          throw new Error(msg);
        }
        return json;
      });
    });
  }

  function textoDa(resposta) {
    /* Uma recusa chega com HTTP 200: precisa ser checada antes de ler o conteúdo. */
    if (resposta.stop_reason === 'refusal') {
      throw new Error('O modelo recusou responder a esta anotação.');
    }
    return (resposta.content || [])
      .filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; })
      .join('\n')
      .trim();
  }

  function sugerir(texto, sistema) {
    if (!configurado()) return Promise.reject(new Error('Nenhuma chave de IA configurada.'));
    var corpo = {
      model: ajustes().aiModel || MODELO_PADRAO,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      system: SISTEMA,
      messages: [{
        role: 'user',
        content: 'Silabário em estudo: ' + sistema + '.\n\nAnotação:\n"""\n' +
          String(texto || '').slice(0, 4000) + '\n"""' + contexto(sistema)
      }]
    };
    return chamar(corpo).then(function (r) {
      return textoDa(r)
        .split('\n')
        .map(function (l) { return l.replace(/^[-*\u2022]\s*/, '').trim(); })
        .filter(function (l) { return l.length > 2; })
        .slice(0, 5);
    });
  }

  var SISTEMA_TUTOR =
    'Você é um tutor de japonês dentro de um app de memorização de hiragana e katakana. ' +
    'Fale português do Brasil, de forma direta e curta (no máximo 6 linhas, salvo se pedirem detalhe). ' +
    'Foque em leitura de kana, pronúncia, mnemônicas, kana parecidos e como estudar melhor. ' +
    'Ao citar um kana, mostre o símbolo e o romaji juntos, assim: き (ki). ' +
    'Use o desempenho real do usuário quando ele for relevante. ' +
    'Não invente palavras japonesas: prefira exemplos comuns e simples. ' +
    'Se pedirem letra de música completa, explique que não pode reproduzir a letra por direitos autorais ' +
    'e ofereça ajudar com trechos curtos que o próprio usuário colar.';

  function panorama(sistema) {
    var sys = global.App.Kana.get(sistema);
    var r = global.App.SRS.resumo(sistema, sys.quiz);
    var fracos = global.App.SRS.errosRecentes(sistema, sys.quiz, 8).map(function (e) {
      return e.kana + ' (' + e.romaji + ')';
    });
    var linhas = [
      'Contexto do app (não repita isto de volta, use só se ajudar):',
      '- Silabário atual: ' + sistema,
      '- Progresso: ' + r.pct + '%, ' + r.dominados + ' dominados, ' + r.aprendendo +
        ' em aprendizado, ' + r.revisar + ' para revisar, ' + r.novos + ' nunca vistos',
      '- Taxa de acerto: ' + r.acerto + '% em ' + r.respondidas + ' respostas'
    ];
    if (fracos.length) linhas.push('- Errou recentemente: ' + fracos.join(', '));
    return linhas.join('\n');
  }

  /* historico: [{papel:'user'|'assistant', texto}] já incluindo a pergunta nova. */
  function conversar(historico, sistema) {
    if (!configurado()) return Promise.reject(new Error('Nenhuma chave de IA configurada.'));
    var mensagens = historico.slice(-16).map(function (m) {
      return { role: m.papel === 'assistant' ? 'assistant' : 'user', content: m.texto };
    });
    return chamar({
      model: ajustes().aiModel || MODELO_PADRAO,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      system: SISTEMA_TUTOR + '\n\n' + panorama(sistema),
      messages: mensagens
    }).then(textoDa);
  }

  function testar() {
    if (!configurado()) return Promise.reject(new Error('Cole a chave primeiro.'));
    return chamar({
      model: ajustes().aiModel || MODELO_PADRAO,
      max_tokens: 64,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'Responda apenas: ok' }]
    }).then(function () { return true; });
  }

  global.App = global.App || {};
  global.App.AI = {
    MODELOS: MODELOS,
    MODELO_PADRAO: MODELO_PADRAO,
    configurado: configurado,
    sugerir: sugerir,
    conversar: conversar,
    testar: testar
  };
})(window);
