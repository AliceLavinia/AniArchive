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

// ==================== MODELOS (existente) ====================

// Usuario usa a conexão padrão
const User = require('./models/User')

// (Opcional) Conexão separada para Anime - pode manter se você usa em outras rotas.
// A nova rota de recomendação NÃO depende desta conexão; ela usa a conexão padrão.
const animeConnection = mongoose.createConnection(
  process.env.MONGO_URI || "mongodb://localhost:27017/aniarchive"
)

const Anime = animeConnection.model('Anime', new mongoose.Schema({
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
    app.use('/', route) // se quiser prefixo, troque para '/api'
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
