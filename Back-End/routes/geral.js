// routes/geral.js
const express = require('express')
const router = express.Router()

// Rota principal
router.get('/', (req, res) => {
    res.status(200).json({ msg: "bem vindeSSSSSSS" })
})

module.exports = router
