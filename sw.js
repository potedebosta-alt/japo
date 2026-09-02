/* Service worker — deixa o app abrir offline.
 *
 * Estratégia: cache primeiro, rede como reserva. O app é pequeno, estático e
 * nunca muda sozinho, então servir do cache é sempre a resposta certa e
 * instantânea; a versão nova entra quando o CACHE abaixo muda de nome.
 *
 * Regra importante: só mexemos em GET de mesma origem. Qualquer outra origem
 * passa direto, sem interceptação — é o que garante que a chamada opcional à
 * API da Anthropic (Tutor / "Enriquecer com IA") funcione normalmente.
 */
'use strict';

var CACHE = 'japo-v1';

var ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './css/styles.css',
  './js/ui/dom.js',
  './js/data/kana.js',
  './js/data/confusions.js',
  './js/data/songs.js',
  './js/core/store.js',
  './js/core/srs.js',
  './js/core/speech.js',
  './js/core/quiz.js',
  './js/core/tips.js',
  './js/core/ai.js',
  './js/screens/home.js',
  './js/screens/chart.js',
  './js/screens/study.js',
  './js/screens/practice.js',
  './js/screens/notes.js',
  './js/screens/songs.js',
  './js/screens/chat.js',
  './js/screens/progress.js',
  './js/screens/settings.js',
  './js/app.js'
];

/* Guarda um arquivo por vez e engole a falha: se um item da lista faltar,
 * o resto do app continua instalando (addAll aborta tudo por um 404 só). */
function guardarUmAUm(cache) {
  return Promise.all(ARQUIVOS.map(function (url) {
    return fetch(new Request(url, { cache: 'reload' }))
      .then(function (resp) {
        if (!resp || !resp.ok) return null;
        return cache.put(url, resp);
      })
      .catch(function () { return null; });
  }));
}

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(ARQUIVOS).catch(function () {
          return guardarUmAUm(cache);
        });
      })
      .catch(function () { return null; })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes.map(function (nome) {
          return nome === CACHE ? null : caches.delete(nome);
        }));
      })
      .then(function () { return self.clients.claim(); })
      .catch(function () { return null; })
  );
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;

  if (req.method !== 'GET') return;

  var url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  /* Outra origem (por exemplo a API de IA): não intercepta, deixa passar. */
  if (url.origin !== self.location.origin) return;

  var navegacao = req.mode === 'navigate';
  var opcoes = navegacao ? { ignoreSearch: true } : undefined;

  ev.respondWith(
    caches.match(req, opcoes).then(function (guardado) {
      if (guardado) return guardado;

      return fetch(req).then(function (resp) {
        /* Guarda o que veio da rede para a próxima vez. */
        if (resp && resp.ok && resp.type === 'basic') {
          var copia = resp.clone();
          caches.open(CACHE).then(function (cache) {
            return cache.put(req, copia);
          }).catch(function () { return null; });
        }
        return resp;
      }).catch(function () {
        /* Offline: qualquer navegação cai no index.html guardado. */
        if (navegacao) {
          return caches.match('./index.html').then(function (idx) {
            return idx || caches.match('./').then(function (raiz) {
              return raiz || Response.error();
            });
          });
        }
        return Response.error();
      });
    })
  );
});
