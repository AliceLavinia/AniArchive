require('dotenv').config()
const express = require('express')
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
app.get('/', (req, res) => {
    res.status(200).json({ msg: "bem vindeSSSSSSS" })
})

// ==================== MIDDLEWARE DE TOKEN ====================
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ msg: "Acesso Negado" })
    }

    try {
        const secret = process.env.SECRET
        jwt.verify(token, secret)
        next()
    } catch (error) {
        res.status(400).json({ msg: "Token Inválido" })
    }
}

// ==================== ROTAS DE USUÁRIO ====================
app.get("/user/:id", checkToken, async (req, res) => {
    const user = await User.findById(req.params.id, '-password')
    if (!user) return res.status(440).json({ msg: 'Usuário não encontrado' })
    res.status(200).json({ user })
})

app.post("/auth/register", async (req, res) => {
    const { name, email, password, confirmpassword } = req.body

    if (!name || !email || !password || password !== confirmpassword) {
        return res.status(422).json({ msg: "Dados inválidos para cadastro" })
    }

    const userExists = await User.findOne({ email })
    if (userExists) return res.status(422).json({ msg: "Por favor utilize outro email" })

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({ name, email, password: passwordHash })

    try {
        await user.save()
        res.status(201).json({ msg: "Usuário criado com sucesso" })
    } catch (error) {
        res.status(500).json({ msg: 'Erro interno no servidor' })
    }
})

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) return res.status(422).json({ msg: "Email e senha são obrigatórios" })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" })

    const checkPassword = await bcrypt.compare(password, user.password)
    if (!checkPassword) return res.status(422).json({ msg: "Senha inválida" })

    try {
        const token = jwt.sign({ id: user._id }, process.env.SECRET)
        res.status(200).json({ msg: "Autenticação realizada com sucesso", token })
    } catch (err) {
        res.status(500).json({ msg: 'Erro ao gerar token' })
    }
})

// ==================== ROTAS DE ANIMES ====================
app.post('/animes', checkToken, async (req, res) => {
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
})

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