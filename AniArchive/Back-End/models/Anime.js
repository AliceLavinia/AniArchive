const mongoose = require('mongoose');

const AnimeSchema = new mongoose.Schema({
  nome: String,
  filmes: Number,
  episodios: Number,
  ovas: Number,
  descricao: String,
  imagem: String, // URL da imagem
});

module.exports = mongoose.model('Anime', AnimeSchema);
