// Back-End/routes/recommend_simple.js
const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')

// === Model Anime na CONEXÃO PADRÃO (mesma do mongoose.connect) ===
// Mantém teu schema principal + campos opcionais para melhorar o score.
const AnimeSchema = new mongoose.Schema({
  nome: String,
  episodios: Number,
  filmes: Number,
  ovas: Number,
  descricao: String,
  imagem: String,

  // opcionais (se não existirem, a rota faz fallback para descrição)
  generos: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  popularity: { type: Number, default: 0 }
}, { collection: 'animes', timestamps: true })

const Anime = mongoose.models.Anime || mongoose.model('Anime', AnimeSchema)

const router = express.Router()

function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0
  const inter = new Set([...setA].filter(x => setB.has(x))).size
  const uni = new Set([...setA, ...setB]).size
  return inter / uni
}

// Fallback quando não há generos/tags: usa palavras da descrição
function bagFromDescricao(desc = '') {
  return new Set(
    desc.toLowerCase()
       .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9\s]/g, ' ')
       .split(/\s+/)
       .filter(t => t.length > 2)
  )
}

router.get('/recommend-simple', async (req, res) => {
  try {
    const userId = req.query.userId
    const K = Number(req.query.k || 10)
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório' })

    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const likedIds = (user.likedAnimes || []).map(String)

    // Sem likes -> populares como fallback
    if (likedIds.length === 0) {
      const populares = await Anime.find({})
        .sort({ popularity: -1, createdAt: -1 })
        .limit(K).lean()

      return res.json({
        items: populares.map(a => ({
          _id: String(a._id),
          titulo: a.nome,
          imagem: a.imagem,
          score: 0,
          reason: 'popularidade'
        }))
      })
    }

    // Perfil do usuário: união de gêneros/tags dos curtidos (ou bag de descrição)
    const likedDocs = await Anime.find(
      { _id: { $in: likedIds } },
      { generos: 1, tags: 1, descricao: 1 }
    ).lean()

    const profileBag = new Set()
    for (const a of likedDocs) {
      const g = (a.generos || []).map(s => s.toLowerCase())
      const t = (a.tags || []).map(s => s.toLowerCase())
      const bag = (g.length + t.length) ? new Set([...g, ...t]) : bagFromDescricao(a.descricao)
      for (const x of bag) profileBag.add(x)
    }

    // Candidatos = todos menos os curtidos
    const candidates = await Anime.find(
      { _id: { $nin: likedIds } },
      { generos: 1, tags: 1, descricao: 1, nome: 1, imagem: 1, popularity: 1 }
    ).lean()

    const maxPop = Math.max(1, ...candidates.map(a => a.popularity || 0))

    const ranked = candidates.map(a => {
      const g = (a.generos || []).map(s => s.toLowerCase())
      const t = (a.tags || []).map(s => s.toLowerCase())
      const bag = (g.length + t.length) ? new Set([...g, ...t]) : bagFromDescricao(a.descricao)
      const sim = jaccard(profileBag, bag)
      const prior = (a.popularity || 0) / maxPop // 0..1
      const score = sim + 0.1 * prior           // prior leve p/ desempate

      return {
        _id: String(a._id),
        titulo: a.nome,
        imagem: a.imagem,
        score: Number(score.toFixed(4)),
        reason: (g.length + t.length)
          ? `similaridade por gêneros/tags (Jaccard ${(sim*100).toFixed(0)}%)`
          : `similaridade por palavras da descrição (Jaccard ${(sim*100).toFixed(0)}%)`
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, K)

    res.json({ items: ranked })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal' })
  }
})

module.exports = router
