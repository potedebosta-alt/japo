/* Pares de kana que se parecem visualmente.
 * Usados para: (1) avisar no modo Estudar, (2) escolher distratores propositais
 * na prática — treinar a discriminação é mais eficiente do que evitá-la. */
(function (global) {
  'use strict';

  var HIRA = [
    [['あ', 'お'], 'あ tem um laço fechado no meio; お tem a bolinha à direita e um traço solto.'],
    [['い', 'り'], 'い são dois traços curtos e curvos; り é mais alto e os traços quase se encostam.'],
    [['き', 'さ'], 'き tem duas barras horizontais; さ tem só uma.'],
    [['く', 'へ'], 'く é em pé e abre para a direita; へ é deitado.'],
    [['し', 'つ'], 'し desce em pé e curva no fim; つ é deitado.'],
    [['す', 'む'], 'す tem laço pequeno e cauda reta; む tem um traço solto no canto.'],
    [['ぬ', 'め'], 'ぬ termina com um laço; め termina sem laço.'],
    [['ね', 'れ', 'わ'], 'ね termina em laço (rabo de gato); れ tem a perna reta; わ é arredondado, sem laço.'],
    [['る', 'ろ'], 'る fecha num laço; ろ termina aberto.'],
    [['は', 'ほ'], 'ほ é o は com uma barra horizontal a mais em cima.'],
    [['ま', 'も'], 'ま tem duas barras horizontais; も tem só uma e o gancho é maior.'],
    [['た', 'な'], 'な tem um laço embaixo à direita; た não.'],
    [['そ', 'ん'], 'そ tem o zigue-zague no topo; ん começa com um traço curto solto.'],
    [['け', 'は'], 'け tem a barra vertical na esquerda e um só traço à direita; は tem a barra cruzada.']
  ];

  var KATA = [
    [['シ', 'ツ'], 'REGRA DE OURO: シ tem os traços vindo da ESQUERDA e subindo (como し). ツ tem os traços vindo de CIMA e descendo (como つ).'],
    [['ソ', 'ン'], 'Mesma regra: ン vem da ESQUERDA subindo (como ん); ソ vem de CIMA descendo (como そ).'],
    [['ソ', 'ノ'], 'ソ tem dois traços; ノ tem um só.'],
    [['ク', 'ワ'], 'ク tem um traço interno curto no topo; ワ é largo e aberto.'],
    [['ク', 'ケ'], 'ケ tem três traços, com uma barra atravessando.'],
    [['ウ', 'ワ'], 'ウ tem a "peninha" em cima; ワ não.'],
    [['ア', 'マ'], 'ア tem a barra horizontal aberta no topo; マ é fechado em cima e aponta para baixo.'],
    [['ロ', 'コ'], 'ロ é um quadrado fechado; コ é aberto embaixo.'],
    [['ス', 'ヌ'], 'ヌ cruza os traços; ス não cruza.'],
    [['ヌ', 'メ'], 'ヌ tem a barra horizontal no topo; メ é só um X.'],
    [['ナ', 'メ'], 'ナ é uma cruz; メ é um X.'],
    [['チ', 'テ'], 'チ tem um traço inclinado no topo; テ tem duas barras horizontais.'],
    [['マ', 'ム'], 'マ aponta para baixo; ム abre para a direita.'],
    [['シ', 'ミ'], 'ミ tem três traços paralelos e retos; シ tem dois pontos e uma curva.'],
    [['ラ', 'ヲ'], 'ラ tem o traço de cima separado; ヲ é praticamente só em textos antigos.'],
    [['エ', 'ユ'], 'エ tem a barra no topo; ユ é aberto em cima.']
  ];

  function index(list) {
    var map = {};
    list.forEach(function (grp) {
      var kanas = grp[0], tip = grp[1];
      kanas.forEach(function (k) {
        kanas.forEach(function (o) {
          if (o === k) return;
          (map[k] = map[k] || []).push({ kana: o, tip: tip });
        });
      });
    });
    return map;
  }

  var maps = { hiragana: index(HIRA), katakana: index(KATA) };

  global.App = global.App || {};
  global.App.Confusions = {
    groups: { hiragana: HIRA, katakana: KATA },
    /* Kana parecidos com este, no mesmo silabário. */
    forKana: function (system, kana) {
      return (maps[system] && maps[system][kana]) || [];
    },
    tipFor: function (system, a, b) {
      var list = this.forKana(system, a);
      for (var i = 0; i < list.length; i++) if (list[i].kana === b) return list[i].tip;
      return '';
    }
  };
})(window);
