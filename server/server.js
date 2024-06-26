const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
const session = require("express-session");
var passport = require("passport");
var bodyParser = require("body-parser");

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// JSON parsing middleware
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/", authRouter);
// app.use('/', indexRouter);

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get("/music/genre_popularity", routes.getGenrePopularity);
app.get("/artists/popular_collaborations", routes.getPopularCollaborations);
app.get("/artists/details/:country", routes.getArtistInfoByCountry);
app.get("/artists/stats/:country", routes.getArtistStatsByCountry);
app.get("/genres/top/:country", routes.getTopGenresByCountry);
app.get("/artists/list/:country", routes.getArtistListByCountry);
// app.get('/artists/:country', routes.getArtistsByCountry);
// app.get('/artists/Germany', routes.getArtistsByCountry);

app.get("/search", routes.search_songs);
// app.get("/song/:id/:artistId", routes.song);
app.get("/getSongInfo/:id", routes.getSongInfo);
app.get("/getArtistInfo/:artistId", routes.getArtistInfo);
app.get("/getArtistTags/:artistId", routes.getArtistTags);
app.get(
  "/recommendation1/:artistId/:country/:tag/:listeners",
  routes.recommendation1
);
app.get("/recommendation2/:trackId", routes.recommendation2);
app.get(
  "/recommendation3/:artistId/:country/:tag/:listeners/:iters/:trackId",
  routes.recommendation3
);
app.get("/user/playlists", routes.getUserPlaylists);
app.get("/user/playlists/:playlist_id", routes.getUserPlaylistTracks);
app.post("/user/playlists/create", routes.createUserPlaylist);
app.post("/user/playlists/rename", routes.renameUserPlaylist);
app.post("/user/playlists/song", routes.userPlaylistAddSong);

// app.get('/author/:type', routes.author);
// app.get('/random', routes.random);
// app.get('/song/:song_id', routes.song);
// app.get('/album/:album_id', routes.album);
// app.get('/albums', routes.albums);
// app.get('/album_songs/:album_id', routes.album_songs);
// app.get('/top_songs', routes.top_songs);
// app.get('/top_albums', routes.top_albums);
// app.get('/search_songs', routes.search_songs);

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
