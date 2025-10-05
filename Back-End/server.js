require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// ==================== MODELOS (existentes) ====================
// Se você já tem User em ./models/User, mantém igual:
const User = require('./models/User')

// (Opcional) conexão separada para Anime que você já usava.
// A nova rota de recomendação NÃO depende dela, então pode manter ou remover.
const animeConnection = mongoose.createConnection(
  process.env.MONGO_URI || "mongodb://localhost:27017/aniarchive"
)

const LegacyAnime = animeConnection.model('Anime', new mongoose.Schema({
  nome: String,
  episodios: Number,
  filmes: Number,
  ovas: Number,
  descricao: String,
  imagem: String
}))

// ==================== ROTAS (auto-mount) ====================
const routesPath = path.join(__dirname, 'routes')
fs.readdirSync(routesPath).forEach(file => {
  if (file.endsWith('.js')) {
    const route = require(path.join(routesPath, file))
    app.use('/', route)                // se quiser prefixo, troque para '/api'
  }
})

// ==================== CONEXÃO COM O BANCO (padrão) ====================
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/aniarchive",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log(`✅ Conectado ao banco (conexão padrão)`)
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Servidor rodando na porta ${process.env.PORT || 3000}`)
    })
  })
  .catch((err) => console.log('❌ Erro na conexão com o banco:', err))
