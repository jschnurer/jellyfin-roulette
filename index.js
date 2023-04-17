const settings = require("./local.settings.json");
const fetch = require("node-fetch");

const movieDbApiKey = settings.movieDbApiKey;
const jUrl = settings.jellyfin.apiUrl;
const jUserId = settings.jellyfin.userId;
const jKey = settings.jellyfin.apiKey;
const jTvId = settings.jellyfin.movieLibraryId;

async function findRandomMovie() {
    const allMovies = await getAllJellyfinMovies();
    const unwatchedMovies = allMovies
        .filter(x => !x.UserData.Played);

    const chosenMovie = unwatchedMovies[Math.floor(Math.random() * unwatchedMovies.length)];
    const movieTitle = `${chosenMovie.Name} (${new Date(chosenMovie.PremiereDate).getFullYear()})`;

    let allOutput = movieTitle;

    if (movieDbApiKey) {
        let collectionInfo = await getCollectionInfo(chosenMovie, allMovies);

        if (collectionInfo) {
            allOutput += "\n" + collectionInfo.collectionMessage;

            collectionInfo.movies.forEach(x => {
                allOutput += `\n${x.Id === chosenMovie.Id ? "---> " : ""}${x.title} (${new Date(x.PremiereDate).getFullYear()}) - ${x.watched === undefined
                    ? "NOT IN LIBRARY"
                    : (x.watched ? "WATCHED" : "NOT WATCHED")
                    }`;
            });
        }
    }

    console.log(allOutput);

    // If this script is being called by another, send the output to the caller as well.
    if (process
        && process.send) {
        process.send(allOutput);
    }
}

async function getAllJellyfinMovies() {
    const resp = await fetch(`${jUrl}/users/${jUserId}/items/?fields=ProviderIds&parentid=${jTvId}&api_key=${jKey}`);
    return (await resp.json()).Items;
}

async function getMovieDbInfo(movieDbId) {
    const result = await fetch(`https://api.themoviedb.org/3/movie/${movieDbId}?api_key=${movieDbApiKey}`);
    return await result.json();
}

async function getMovieDbCollection(collectionId) {
    const result = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${settings.movieDbApiKey}`);
    return await result.json();
}

async function getCollectionInfo(chosenMovie, allMovies) {
    let collectionInfo = [];

    if (!chosenMovie.ProviderIds.Tmdb) {
        return;
    }

    const movieInfo = await getMovieDbInfo(chosenMovie.ProviderIds.Tmdb);

    if (!movieInfo?.belongs_to_collection) {
        return;
    }

    const collection = await getMovieDbCollection(movieInfo.belongs_to_collection.id);

    if (!collection?.parts) {
        return;
    }

    const movieIndex = collection.parts.findIndex(x => x.id === Number(chosenMovie.ProviderIds.Tmdb));

    if (movieIndex === -1) {
        return;
    }

    if (movieIndex > 0) {
        collectionInfo = collection.parts.map(x => ({
            title: x.title,
            providerId: x.id,
            watched: undefined,
        }));

        // Foreach title, check if it's already watched.
        for (let i = 0; i < collectionInfo.length; i++) {
            const jellyfinMovie = allMovies.find(x => x.ProviderIds.Tmdb == collectionInfo[i].providerId);

            if (jellyfinMovie) {
                collectionInfo[i].watched = jellyfinMovie.UserData.Played;
                collectionInfo[i].title = jellyfinMovie.Name;
                collectionInfo[i].PremiereDate = jellyfinMovie.PremiereDate;
                collectionInfo[i].Id = jellyfinMovie.Id;
            }
        }
    }

    return {
        collectionMessage: `This is the ${movieIndex + 1}${getNth(movieIndex + 1)} movie in the "${collection.name}".`,
        movieIndex,
        movies: collectionInfo,
    };
}

function getNth(seriesNum) {
    const lastNum = Number(seriesNum.toString()[seriesNum.toString().length - 1]);

    switch (lastNum) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

findRandomMovie();