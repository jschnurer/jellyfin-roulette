const settings = require("./local.settings.json");
const fetch = require("node-fetch");

const jUrl = settings.jellyfin.apiUrl;
const jUserId = settings.jellyfin.userId;
const jKey = settings.jellyfin.apiKey;
const jTvId = settings.jellyfin.movieLibraryId;

async function findRandomMovie() {
    const shows = await getAllJellyfinMovies();

    let unwatchedMovies = [];

    for (let i = 0; i < shows.length; i++) {
        var isPlayed = shows[i].UserData.Played;
        if (isPlayed) {
            continue;
        }
        unwatchedMovies.push(`${shows[i].Name} (${new Date(shows[i].PremiereDate).getFullYear()})`);
    }

    console.log(unwatchedMovies[Math.floor(Math.random() * unwatchedMovies.length)]);
}

async function getAllJellyfinMovies() {
    const resp = await fetch(`${jUrl}/users/${jUserId}/items/?fields=ProviderIds&parentid=${jTvId}&api_key=${jKey}`);
    return (await resp.json()).Items;
}

findRandomMovie();