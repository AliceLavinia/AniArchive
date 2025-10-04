const animeInfo = document.getElementById("anime-info");
const resenhas = document.getElementById("resenhas");
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");

// Função principal para buscar anime pelo nome
async function buscarAnime(query) {
  animeInfo.innerHTML = `<p class="loading">Carregando informações...</p>`;
  resenhas.innerHTML = `<p class="loading">Carregando resenhas...</p>`;

  try {
    // Buscar anime pelo nome
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=1`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      animeInfo.innerHTML = `<p>Nenhum anime encontrado para "${query}".</p>`;
      resenhas.innerHTML = "";
      return;
    }

    const anime = data.data[0]; // pega o primeiro resultado

    // Exibir informações do anime
    animeInfo.innerHTML = `
      <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="cover">
      <div class="details">
        <h2>${anime.title}</h2>
        <p class="year">${anime.year ?? "Ano desconhecido"}</p>
        <p class="desc">${anime.synopsis ? anime.synopsis.slice(0, 500) + "..." : "Sem descrição."}</p>
        <p><b>Episódios:</b> ${anime.episodes ?? "?"}</p>
        <p><b>Status:</b> ${anime.status}</p>
        <button class="add-btn">+ Minha Lista</button>
      </div>
    `;
    // Você também precisa buscar as resenhas aqui, mas essa parte está faltando no seu código.
  } catch (error) {
    animeInfo.innerHTML = `<p>Erro ao buscar informações do anime.</p>`;
    resenhas.innerHTML = "";
    console.error("Erro na busca de anime:", error);
  }
}

// Ativar busca ao clicar na lupinha
searchButton.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    buscarAnime(query);
  }
});

// Ativar busca ao pressionar Enter
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) {
      buscarAnime(query);
    }
  }
});