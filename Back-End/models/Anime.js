const mongoose = require('mongoose');

const AnimeSchema = new mongoose.Schema({
  nome: String,
  genero: String,
  descricao: String,
  imagem: String, // URL da imagem
});

module.exports = mongoose.model('Anime', AnimeSchema);
