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

// ==================== MODELOS ====================

// Modelo global (User) usa mongoose padrão
const User = require('./models/User')

// Modelo local (Anime) usa conexão separada
const animeConnection = mongoose.createConnection(
       "mongodb+srv://gabriellages2:AMORDAMINHAVIDA@mongotest.hokoz.mongodb.net/test?retryWrites=true&w=majority",

)

const Anime = animeConnection.model('Anime', new mongoose.Schema({
    nome: String,
    episodios: Number,
    filmes: Number,
    ovas: Number,
    descricao: String,
    imagem: String
}))

// ==================== ROTAS GERAIS ====================
const routesPath = path.join(__dirname, 'routes')

fs.readdirSync(routesPath).forEach(file => {
  if (file.endsWith('.js')) {
    const route = require(path.join(routesPath, file))
    app.use('/', route) // Você pode mudar o prefixo se quiser
  }
})

// ==================== MIDDLEWARE DE TOKEN ====================

// ==================== ROTAS DE USUÁRIO ====================


// ==================== ROTAS DE ANIMES ====================
/* app.post('/animes', checkToken, async (req, res) => {
    const { nome, episodios, filmes, ovas, descricao, imagem } = req.body

    if (!nome || episodios == null || filmes == null || ovas == null || !descricao || !imagem) {
        return res.status(422).json({ msg: 'Todos os campos são obrigatórios!' })
    }

    const anime = new Anime({ nome, episodios, filmes, ovas, descricao, imagem })

    try {
        await anime.save()
        res.status(201).json({ msg: 'Anime criado com sucesso!', anime })
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao salvar anime', error })
    }
})

app.get('/animes', async (req, res) => {
    try {
        const animes = await Anime.find()
        res.status(200).json(animes)
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao buscar animes', error })
    }
})

app.get('/animes/:id', async (req, res) => {
    try {
        const anime = await Anime.findById(req.params.id)
        if (!anime) return res.status(404).json({ msg: "Anime não encontrado" })
        res.status(200).json(anime)
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao buscar anime', error })
    }
}) */

// ==================== CONEXÃO COM BANCO DE USUÁRIOS ====================
mongoose
  .connect(
    "mongodb+srv://gabriellages2:AMORDAMINHAVIDA@mongotest.hokoz.mongodb.net/test?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log(`✅ Conectado ao banco de usuários (test)`);
    app.listen(3000, () => {
      console.log('🚀 Servidor rodando na porta 3000');
    });
  })
  .catch((err) => console.log('❌ Erro na conexão com o banco:', err));