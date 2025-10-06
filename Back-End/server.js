// Back-End/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname,'.env') });
console.log('MONGO_URI loaded:', !!process.env.MONGO_URI ? 'Yes' : 'No');
if (process.env.MONGO_URI) console.log('MONGO_URI prefix:', process.env.MONGO_URI.slice(0, 60) + '...');


const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Se tiver require('./models/User'), pode manter
// Remova QUALQUER mongoose.createConnection(...) em qualquer arquivo do projeto

// ---- conexão única com o Mongo (Atlas) ----
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI não definida em Back-End/.env');
  process.exit(1);
}

mongoose.connect(uri) // Mongoose 7+: sem opções deprecadas
  .then(() => {
    console.log('✅ Mongo conectado');

    // monta rotas depois que conectar
    const routesPath = path.join(__dirname, 'routes');
    if (fs.existsSync(routesPath)) {
      fs.readdirSync(routesPath).forEach(file => {
        if (file.endsWith('.js')) app.use('/', require(path.join(routesPath, file)));
      });
    }

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🚀 Server na porta ${port}`));
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no Mongo:', err.message);
    process.exit(1);
  });
