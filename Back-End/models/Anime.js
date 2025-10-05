const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Model Anime na CONEXÃO PADRÃO (a do mongoose.connect do server.js).
 * Usa apenas campos que você já tem. O `timestamps:true` cria createdAt/updatedAt,
 * útil para o boost leve de recência. Ajuste 'collection' se seu nome for diferente.
 */
const AnimeSchema = new mongoose.Schema({
  nome: String,
  episodios: Number,
  filmes: Number,
  ovas: Number,
  descricao: String,
  imagem: String
}, { collection: 'animes', timestamps: true });

const Anime = mongoose.models.Anime || mongoose.model('Anime', AnimeSchema);

/* =========================
   UTILIDADES
========================= */
function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const inter = new Set([...setA].filter(x => setB.has(x))).size;
  const uni = new Set([...setA, ...setB]).size;
  return inter / uni;
}

// tokeniza nome+descricao em um conjunto de palavras
function bagFromText(nome = '', descricao = '') {
  const txt = `${nome} ${descricao}`.toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
  return new Set(txt);
}

// recência normalizada 0..1 (opcional, requer timestamps)
function recencyBoost(doc, now = Date.now(), windowDays = 365) {
  if (!doc?.createdAt) return 0;
  const ageMs = now - new Date(doc.createdAt).getTime();
  const windowMs = windowDays * 24 * 3600 * 1000;
  const score = 1 - Math.min(Math.max(ageMs / windowMs, 0), 1); // mais novo → 1
  return score;
}

/* =========================
   NÚCLEO DA RECOMENDAÇÃO
   (bag-of-words + Jaccard + boost leve de recência)
========================= */
async function rankByWordsOnly(likedIds, k = 10) {
  const K = Number(k) || 10;

  // Sem likes: fallback retorna os mais recentes
  if (!Array.isArray(likedIds) || likedIds.length === 0) {
    const recent = await Anime.find({}).sort({ createdAt: -1 }).limit(K).lean();
    return recent.map(a => ({
      _id: String(a._id),
      titulo: a.nome,
      imagem: a.imagem,
      score: 0,
      reason: 'recentes'
    }));
  }

  // perfil = união de palavras de nome+descricao dos curtidos
  const likedDocs = await Anime.find(
    { _id: { $in: likedIds } },
    { nome: 1, descricao: 1, createdAt: 1 }
  ).lean();

  const profile = new Set();
  likedDocs.forEach(a => {
    for (const w of bagFromText(a.nome, a.descricao)) profile.add(w);
  });

  // candidatos = todos menos os curtidos
  const candidates = await Anime.find(
    { _id: { $nin: likedIds } },
    { nome: 1, descricao: 1, imagem: 1, createdAt: 1 }
  ).lean();

  const now = Date.now();

  // score = Jaccard(profile, bagDoc) + 0.05 * recencyBoost
  const ranked = candidates.map(a => {
    const bag = bagFromText(a.nome, a.descricao);
    const sim = jaccard(profile, bag);
    const rec = recencyBoost(a, now, 365); // janela ~1 ano
    const score = sim + 0.05 * rec;        // peso leve de recência

    return {
      _id: String(a._id),
      titulo: a.nome,
      imagem: a.imagem,
      score: Number(score.toFixed(4)),
      reason: `similaridade de palavras (Jaccard ${(sim*100).toFixed(0)}%)` + (rec ? ` + recência` : ``)
    };
  })
  .sort((x, y) => y.score - x.score)
  .slice(0, K);

  return ranked;
}

/* =========================
   ENDPOINTS DE ANIME
========================= */

// Listar animes (opcional, útil para testar)
router.get('/anime', async (req, res) => {
  try {
    const animes = await Anime.find({}).lean();
    res.json(animes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

// Obter um anime por id (opcional)
router.get('/anime/:id', async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id).lean();
    if (!anime) return res.status(404).json({ error: 'not found' });
    res.json(anime);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * RECOMENDAÇÃO (GET) — sem mexer no User:
 * Ex.: /anime/recommend-simple?liked=ID1,ID2,ID3&k=10
 */
router.get('/anime/recommend-simple', async (req, res) => {
  try {
    const likedParam = (req.query.liked || '').trim();
    const likedIds = likedParam
      ? likedParam.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const k = req.query.k || 10;

    const items = await rankByWordsOnly(likedIds, k);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * RECOMENDAÇÃO (POST) — alternativa que recebe likedIds no body:
 * Body: { "likedIds": ["id1","id2"], "k": 10 }
 */
router.post('/anime/recommend-simple', async (req, res) => {
  try {
    const { likedIds = [], k = 10 } = req.body || {};
    const items = await rankByWordsOnly(likedIds, k);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
