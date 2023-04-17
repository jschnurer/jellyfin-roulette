# Local settings
Create `local.settings.json` and match this schema:

```
{
    "movieDbApiKey": "your movie db key (optional)",
    "jellyfin": {
        "apiUrl": "yourjellyfinurl:8096",
        "apiKey": "your api key",
        "userId": "your user id",
        "movieLibraryId": "your movie library id"
    }
}
```

# Running
Run npm start or `node .\index.js`.

# Collection Checking
If a movieDbApiKey is provided in the settings, after choosing a movie, it will be checked on The Movie Db to determine if it is part of a collection. If it is, the collection name and movie list will be outputted. Additionally, it will check the Jellyfin library to determine which movies in that collection are in the library and which have been already played.