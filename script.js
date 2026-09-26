// https://www.omdbapi.com/?apikey=fe860c39&s=Guardians+of+the+Galaxy+Vol.+2

document.addEventListener("DOMContentLoaded", () => {
  // ELEMENTS
  const movieForm = document.getElementById("movieForm");
  const movieInput = document.getElementById("movieInput");
  const movieResults = document.getElementById("movieResults");

  // API
  const API_KEY = "fe860c39";
  const OMDB_URL = "https://www.omdbapi.com/";
  const WIKI_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

  // SEARCH FORM
  movieForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const movieName = movieInput.value.trim();

    if (movieName === "") {
      movieResults.innerHTML =
        '<div class="error">Please enter a movie name.</div>';
      return;
    }

    fetchMovies(movieName);
  });

  // FETCH MOVIES
  async function fetchMovies(movieName) {
    try {
      movieResults.innerHTML =
        '<div class="loading">Searching Movies....</div>';

      const response = await fetch(
        `${OMDB_URL}?apikey=${API_KEY}&s=${encodeURIComponent(movieName)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      console.log(data);

      if (data.Response === "False") {
        movieResults.innerHTML = `<div class="error">${escapeHTML(data.Error)}</div>`;

        return;
      }

      if (!data.Search || data.Search.length === 0) {
        movieResults.innerHTML = '<div class="error">No movies found.</div>';

        return;
      }

      displayMovies(data.Search);
    } catch (error) {
      console.error("Error fetching movies:", error);

      movieResults.innerHTML =
        '<div class="error">Unable to fetch movies. Check your internet connection or API key.</div>';
    }
  }

  // DISPLAY MOVIES
  function displayMovies(movies) {
    movieResults.innerHTML = movies
      .map((movie) => {
        return `
                <div class="movie-card">

                    <div
                        class="movie-poster"
                        id="poster-${escapeHTML(movie.imdbID)}"
                    >
                        <div class="poster-loading">
                            🎬
                            <span>Loading Poster...</span>
                        </div>
                    </div>

                    <div class="movie-info">

                        <h3>
                            ${escapeHTML(movie.Title)}
                        </h3>

                        <p>
                            <strong>Year:</strong>
                            ${escapeHTML(movie.Year)}
                        </p>

                        <p>
                            <strong>Type:</strong>
                            ${escapeHTML(movie.Type)}
                        </p>

                        <p>
                            <strong>IMDb ID:</strong>
                            ${escapeHTML(movie.imdbID)}
                        </p>

                    </div>

                </div>
            `;
      })
      .join("");

    movies.forEach((movie) => {
      loadPoster(movie);
    });
  }

  // LOAD POSTER
  async function loadPoster(movie) {
    const posterContainer = document.getElementById(`poster-${movie.imdbID}`);

    if (!posterContainer) {
      return;
    }

    if (movie.Poster && movie.Poster !== "N/A") {
      const image = new Image();

      image.onload = () => {
        posterContainer.innerHTML = "";

        image.className = "movie-poster-image";
        image.alt = movie.Title;

        posterContainer.appendChild(image);
      };

      image.onerror = () => {
        loadWikipediaPoster(movie, posterContainer);
      };

      image.src = movie.Poster;
    } else {
      loadWikipediaPoster(movie, posterContainer);
    }
  }

  // LOAD WIKIPEDIA POSTER
  async function loadWikipediaPoster(movie, container) {
    try {
      const titles = createWikipediaTitles(movie);

      for (const title of titles) {
        const url = `${WIKI_URL}${encodeURIComponent(title)}`;

        const response = await fetch(url);

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (
          data.thumbnail &&
          data.thumbnail.source &&
          isCorrectWikipediaPage(data, movie)
        ) {
          const image = new Image();

          image.onload = () => {
            container.innerHTML = "";

            image.className = "movie-poster-image";
            image.alt = movie.Title;

            container.appendChild(image);
          };

          image.onerror = () => {
            showNoPoster(container);
          };

          image.src = data.thumbnail.source;

          return;
        }
      }

      showNoPoster(container);
    } catch (error) {
      console.error("Poster Error:", error);

      showNoPoster(container);
    }
  }

  // CREATE WIKIPEDIA TITLES
  function createWikipediaTitles(movie) {
    const cleanTitle = movie.Title.replace(/\s*\(\d{4}\)\s*$/, "").trim();

    const titles = [];

    titles.push(`${cleanTitle} (${movie.Year})`);
    titles.push(cleanTitle);

    if (cleanTitle.includes(":")) {
      const withoutSubtitle = cleanTitle.split(":")[0].trim();

      titles.push(`${withoutSubtitle} (${movie.Year})`);
      titles.push(withoutSubtitle);
    }

    return [...new Set(titles)];
  }

  // CHECK WIKIPEDIA PAGE
  function isCorrectWikipediaPage(data, movie) {
    if (!data.title) {
      return false;
    }

    const movieTitle = movie.Title.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const pageTitle = data.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return (
      pageTitle === movieTitle ||
      pageTitle.includes(movieTitle) ||
      movieTitle.includes(pageTitle)
    );
  }

  // SHOW NO POSTER
  function showNoPoster(container) {
    container.innerHTML = `
            <div class="no-poster">
                <div class="no-poster-icon">
                    🎬
                </div>

                <p>
                    No Poster Available
                </p>
            </div>
        `;
  }

  // ESCAPE HTML
  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
