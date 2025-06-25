const express = require('express')
const router = express.Router()  // Criamos um router
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const checkToken = require('../middleware/checkToken')  // Se você tem um middleware separado

// Rotas de usuário
router.get("/user/:id", checkToken, async (req, res) => {
    const user = await User.findById(req.params.id, '-password')
    if (!user) return res.status(440).json({ msg: 'Usuário não encontrado' })
    res.status(200).json({ user })
})

router.post("/auth/register", async (req, res) => {
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

router.post("/auth/login", async (req, res) => {
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

module.exports = router
