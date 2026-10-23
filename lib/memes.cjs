'use strict';

// Curated, pre-downloaded meme pack. No live API is used at runtime.
// The explicit Cartman clip is intentionally excluded from the live audience
// picker because it contains profanity; the original demo keeps its own pack.
const MEMES = Object.freeze([
  { id: 'son', title: 'SON 😭', src: '/memes/son.jpg', kind: 'image', width: 2726, height: 1532 },
  { id: 'crine', title: 'Our brains are crine 😭', src: '/memes/son-crine.gif', kind: 'gif', width: 498, height: 394 },
  { id: 'clap', title: 'Black Cat Clapping', src: '/memes/black-cat-clap.gif', kind: 'gif', width: 270, height: 480 },
  { id: 'tiptoe', title: 'AI Rumpelstiltskin / Tiptoe', src: '/memes/tiptoe.jpg', kind: 'image', width: 1280, height: 720 },
  { id: 'fanum', title: 'Fanum throws', src: '/memes/fanum-throws.gif', kind: 'gif', width: 320, height: 316 },
  { id: 'fanum-still', title: 'Fanum (still)', src: '/memes/fanum-throws.jpg', kind: 'image', width: 320, height: 316 },
  { id: 'fine', title: 'This Is Fine', src: '/memes/this-is-fine.gif', kind: 'gif', width: 360, height: 360 },
  { id: 'pika', title: 'Surprised Pikachu', src: '/memes/surprised-pikachu.gif', kind: 'gif', width: 360, height: 360 },
  { id: 'crycat', title: 'Crying Cat', src: '/memes/crying-cat.gif', kind: 'gif', width: 360, height: 348 },
  { id: 'doge', title: 'Doge', src: '/memes/doge.gif', kind: 'gif', width: 360, height: 307 },
]);

const MEME_BY_ID = new Map(MEMES.map(meme => [meme.id, meme]));

function publicMeme(meme) {
  if (!meme) return null;
  return {
    id: meme.id,
    title: meme.title,
    src: meme.src,
    kind: meme.kind,
    width: meme.width,
    height: meme.height,
  };
}

module.exports = { MEMES, MEME_BY_ID, publicMeme };
