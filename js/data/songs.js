/* Catálogo de músicas para estudar kana.
 *
 * IMPORTANTE: aqui não há áudio nem letra — só a ficha da música (título, leitura,
 * tradução, artista, contexto), que é informação factual. Áudio e letra são obra
 * protegida; o app leva você à fonte oficial e deixa VOCÊ colar a letra que quiser
 * no leitor, que aí sim destaca os kana e vira exercício.
 *
 * `kana` é a leitura do título em kana — é dela que sai o treino da música. */
(function (global) {
  'use strict';

  var MUSICAS = [
    {
      id: 'blue-bird', titulo: 'Blue Bird', kana: 'ブルーバード', romaji: 'Buruu Baado',
      pt: 'Pássaro azul', artista: 'いきものがかり (Ikimonogakari)', ano: 2008,
      contexto: 'Naruto Shippuden — abertura 3', foco: 'katakana',
      dica: 'Título todo em katakana com o traço de alongamento ー: ótimo para fixar ブ, ル, バ e ド.'
    },
    {
      id: 'stay-with-me', titulo: '真夜中のドア〜Stay With Me', kana: 'まよなかのドア', romaji: 'Mayonaka no Doa',
      pt: 'A porta da meia-noite', artista: '松原みき (Miki Matsubara)', ano: 1979,
      contexto: 'City pop; virou fenômeno mundial em 2020', foco: 'misto',
      dica: 'Mistura hiragana (まよなかの) e katakana (ドア) — bom para treinar a troca entre os dois.'
    },
    {
      id: 'sakuranbo', titulo: 'さくらんぼ', kana: 'さくらんぼ', romaji: 'Sakuranbo',
      pt: 'Cereja', artista: '大塚愛 (Ai Otsuka)', ano: 2003,
      contexto: 'J-pop clássico dos anos 2000', foco: 'hiragana',
      dica: 'Título 100% hiragana e curto: o primeiro que você consegue ler inteiro.'
    },
    {
      id: 'gurenge', titulo: '紅蓮華', kana: 'ぐれんげ', romaji: 'Gurenge',
      pt: 'Flor de lótus carmesim', artista: 'LiSA', ano: 2019,
      contexto: 'Demon Slayer (Kimetsu no Yaiba) — abertura 1', foco: 'hiragana',
      dica: 'Dois kana com dakuten: ぐ, げ. Bom para fixar a marca ゛.'
    },
    {
      id: 'homura', titulo: '炎', kana: 'ほむら', romaji: 'Homura',
      pt: 'Chama', artista: 'LiSA', ano: 2020,
      contexto: 'Demon Slayer — filme Trem Infinito', foco: 'hiragana',
      dica: 'ほ, む, ら — três kana que costumam ser confundidos com は, す e ろ.'
    },
    {
      id: 'zankoku', titulo: '残酷な天使のテーゼ', kana: 'ざんこくなてんしのテーゼ', romaji: 'Zankoku na Tenshi no Teeze',
      pt: 'A tese do anjo cruel', artista: '高橋洋子 (Yoko Takahashi)', ano: 1995,
      contexto: 'Neon Genesis Evangelion — abertura', foco: 'misto',
      dica: 'Hiragana longo + テーゼ em katakana: um bom teste de leitura contínua.'
    },
    {
      id: 'yoru-ni-kakeru', titulo: '夜に駆ける', kana: 'よるにかける', romaji: 'Yoru ni Kakeru',
      pt: 'Correndo noite adentro', artista: 'YOASOBI', ano: 2019,
      contexto: 'Estreia do YOASOBI; um dos maiores hits do Japão', foco: 'hiragana',
      dica: 'よ, る, に, か, け, る — repare que る aparece duas vezes.'
    },
    {
      id: 'idol', titulo: 'アイドル', kana: 'アイドル', romaji: 'Aidoru',
      pt: 'Ídolo', artista: 'YOASOBI', ano: 2023,
      contexto: 'Oshi no Ko — abertura', foco: 'katakana',
      dica: 'ア, イ, ド, ル: quatro katakana básicos, um deles com dakuten.'
    },
    {
      id: 'zenzenzense', titulo: '前前前世', kana: 'ぜんぜんぜんせ', romaji: 'Zenzenzense',
      pt: 'Vidas e vidas atrás', artista: 'RADWIMPS', ano: 2016,
      contexto: 'Your Name (Kimi no Na wa)', foco: 'hiragana',
      dica: 'ぜ repetido três vezes: treino puro de dakuten na linha さ.'
    },
    {
      id: 'lemon', titulo: 'Lemon', kana: 'レモン', romaji: 'Remon',
      pt: 'Limão', artista: '米津玄師 (Kenshi Yonezu)', ano: 2018,
      contexto: 'Um dos singles japoneses mais vendidos da era digital', foco: 'katakana',
      dica: 'レ, モ, ン — e cuidado: ン (n) parece com ソ (so).'
    },
    {
      id: 'uchiage-hanabi', titulo: '打上花火', kana: 'うちあげはなび', romaji: 'Uchiage Hanabi',
      pt: 'Fogos de artifício', artista: 'DAOKO × 米津玄師', ano: 2017,
      contexto: 'Tema do filme Uchiage Hanabi', foco: 'hiragana',
      dica: 'Sete kana seguidos, incluindo び com dakuten.'
    },
    {
      id: 'senbonzakura', titulo: '千本桜', kana: 'せんぼんざくら', romaji: 'Senbonzakura',
      pt: 'Mil cerejeiras', artista: '黒うさP feat. 初音ミク', ano: 2011,
      contexto: 'Clássico do Vocaloid', foco: 'hiragana',
      dica: 'ん aparece duas vezes — o único kana que fecha sílaba.'
    },
    {
      id: 'dry-flower', titulo: 'ドライフラワー', kana: 'ドライフラワー', romaji: 'Dorai Furawaa',
      pt: 'Flor seca', artista: '優里 (Yuuri)', ano: 2020,
      contexto: 'Hit de 2020-2021', foco: 'katakana',
      dica: 'Sete katakana com dois ー: leia devagar, alongando as vogais.'
    },
    {
      id: 'unravel', titulo: 'unravel', kana: 'アンラベル', romaji: 'Anraberu',
      pt: 'Desfiar', artista: 'TK from 凛として時雨', ano: 2014,
      contexto: 'Tokyo Ghoul — abertura', foco: 'katakana',
      dica: 'ン, ラ, ベ, ル: junta o par difícil ン/ソ com dakuten em ベ.'
    },
    {
      id: 'silhouette', titulo: 'シルエット', kana: 'シルエット', romaji: 'Shiruetto',
      pt: 'Silhueta', artista: 'KANA-BOON', ano: 2015,
      contexto: 'Naruto Shippuden — abertura 16', foco: 'katakana',
      dica: 'Tem シ (o irmão do ツ) e ッ pequeno, que dobra a consoante: "shiruET-to".'
    },
    {
      id: 'koi', titulo: '恋', kana: 'こい', romaji: 'Koi',
      pt: 'Amor', artista: '星野源 (Gen Hoshino)', ano: 2016,
      contexto: 'Dorama Nigeru wa Haji da ga Yaku ni Tatsu', foco: 'hiragana',
      dica: 'Dois kana só: o começo mais fácil possível.'
    },
    {
      id: 'himawari', titulo: 'ひまわりの約束', kana: 'ひまわりのやくそく', romaji: 'Himawari no Yakusoku',
      pt: 'A promessa do girassol', artista: '秦基博 (Motohiro Hata)', ano: 2014,
      contexto: 'Stand By Me Doraemon', foco: 'hiragana',
      dica: 'Nove kana em sequência — bom teste de leitura fluente.'
    },
    {
      id: 'kimi-no-shiranai', titulo: '君の知らない物語', kana: 'きみのしらないものがたり', romaji: 'Kimi no Shiranai Monogatari',
      pt: 'A história que você não conhece', artista: 'supercell', ano: 2009,
      contexto: 'Bakemonogatari — encerramento', foco: 'hiragana',
      dica: 'O título mais longo da lista: leia em blocos de três kana.'
    },
    {
      id: 'ue-o-muite', titulo: '上を向いて歩こう', kana: 'うえをむいてあるこう', romaji: 'Ue o Muite Arukou',
      pt: 'Vou andar olhando para cima', artista: '坂本九 (Kyu Sakamoto)', ano: 1961,
      contexto: 'Conhecida no ocidente como "Sukiyaki"; nº 1 nos EUA em 1963', foco: 'hiragana',
      dica: 'Aparece を, a partícula — aqui ela soa "o", não "wo".'
    },
    {
      id: 'sekai-ni-hitotsu', titulo: '世界に一つだけの花', kana: 'せかいにひとつだけのはな', romaji: 'Sekai ni Hitotsu Dake no Hana',
      pt: 'A única flor do mundo', artista: 'SMAP', ano: 2003,
      contexto: 'Um dos singles mais vendidos da história do Japão', foco: 'hiragana',
      dica: 'Doze kana: quando conseguir ler isso sem parar, o hiragana está no automático.'
    }
  ];

  function linkBusca(m) {
    return 'https://www.youtube.com/results?search_query=' +
      encodeURIComponent(m.titulo + ' ' + m.artista.replace(/\s*\(.*\)\s*/, ''));
  }

  global.App = global.App || {};
  global.App.Songs = {
    lista: MUSICAS,
    get: function (id) {
      return MUSICAS.filter(function (m) { return m.id === id; })[0] || null;
    },
    linkBusca: linkBusca,
    /* Os kana que aparecem na leitura do título — vira o baralho da música. */
    kanaDe: function (m) {
      return global.App.Tips.kanaNoTexto(m.kana);
    }
  };
})(window);
