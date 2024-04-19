const mysql = require("mysql");
const config = require("./config.json");
const dotenv = require("dotenv").config();

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: config.rds_user,
  password: process.env.RDS_PASSWORD,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect((err) => err && console.log(err));

/******************
 * WARM UP ROUTES *
 ******************/

// Route for getting the changing popularity of music genres over time
const getGenrePopularity = async (req, res) => {
  const query = `
    SELECT 
      YEAR(p.modified_at) AS year,
      t.name AS tag_name,
      COUNT(DISTINCT pt.pid) AS playlist_count,
      SUM(a.listeners) AS total_listeners
    FROM Playlist p
    JOIN PlaylistTrack pt ON p.pid = pt.pid
    JOIN Track tr ON pt.trackId = tr.id
    JOIN ArtistTags at ON tr.artist_id = at.artist_id
    JOIN Tags t ON at.tag_id = t.id
    JOIN Artist a ON tr.artist_id = a.mbid
    GROUP BY year, t.name
    ORDER BY year DESC, total_listeners DESC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching genre popularity data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

// Route for finding artists in highly collaborative and popular playlists
const getPopularCollaborations = async (req, res) => {
  const query = `
    WITH CollabPlaylists AS (
      SELECT p.pid as id
      FROM Playlist p
      // WHERE p.collaborative = TRUE AND p.num_followers > 10
    ),
    RankedArtists AS (
      SELECT 
        t.artist_id,
        COUNT(DISTINCT pt.pid) AS appearances,
        DENSE_RANK() OVER(PARTITION BY t.artist_id ORDER BY COUNT(DISTINCT pt.pid) DESC) AS r_rank
      FROM Track t
      JOIN PlaylistTrack pt ON t.id = pt.trackId
      JOIN CollabPlaylists cp ON pt.pid = cp.id
      GROUP BY t.artist_id
    )
    SELECT a.name, ra.appearances
    FROM RankedArtists ra
    JOIN Artist a ON ra.artist_id = a.mbid
    WHERE ra.r_rank = 1 AND ra.appearances > 1
    ORDER BY ra.appearances DESC, a.name;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching popular collaborations data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

// // Route 1: GET /author/:type
// const author = async function(req, res) {
//   // TODO (TASK 1): replace the values of name and pennkey with your own
//   const name = 'Anjalee Narenthiren';
//   const pennkey = 'anjaleen';

//   console.log("Author route hit");

//   // checks the value of type in the request parameters
//   // note that parameters are required and are specified in server.js in the endpoint by a colon (e.g. /author/:type)
//   if (req.params.type === 'name') {
//     // res.send returns data back to the requester via an HTTP response
//     res.json({ name: name });
//   } else if (req.params.type === 'pennkey') {
//     res.json({ pennkey: pennkey });
//   } else {
//     res.status(400).json({});
//   }
// }

// // Route 2: GET /random
// const random = async function(req, res) {
//   // you can use a ternary operator to check the value of request query values
//   // which can be particularly useful for setting the default value of queries
//   // note if users do not provide a value for the query it will be undefined, which is falsey
//   const explicit = req.query.explicit === 'true' ? 1 : 0;

//   // Here is a complete example of how to query the database in JavaScript.
//   // Only a small change (unrelated to querying) is required for TASK 3 in this route.
//   connection.query(`
//     SELECT *
//     FROM Songs
//     WHERE explicit <= ${explicit}
//     ORDER BY RAND()
//     LIMIT 1
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       // If there is an error for some reason, or if the query is empty (this should not be possible)
//       // print the error message and return an empty object instead
//       console.log(err);
//       res.json({});
//     } else {
//       res.json({
//         song_id: data[0].song_id,
//         title: data[0].title
//       });
//     }
//   });
// }

// /********************************
//  * BASIC SONG/ALBUM INFO ROUTES *
//  ********************************/

// // Route 3: GET /song/:song_id
// const song = async function(req, res) {
//   connection.query(`
//     SELECT * FROM Songs WHERE song_id = ${mysql.escape(req.params.song_id)}
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       console.log(err);
//       res.json({});
//     } else {
//       res.json(data[0]);
//     }
//   });
// }

// // Route 4: GET /album/:album_id
// const album = async function(req, res) {
//   connection.query(`
//     SELECT * FROM Albums WHERE album_id = ${mysql.escape(req.params.album_id)}
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       console.log(err);
//       res.json({});
//     } else {
//       res.json(data[0]);
//     }
//   });
// }

// // Route 5: GET /albums
// const albums = async function(req, res) {
//   connection.query(`
//     SELECT * FROM Albums ORDER BY release_date DESC
//   `, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.json([]);
//     } else {
//       res.json(data);
//     }
//   });
// }

// // Route 6: GET /album_songs/:album_id
// const album_songs = async function(req, res) {
//   const id = req.params.album_id;
//   connection.query(`
//     SELECT song_id, title, number, duration, plays FROM Songs WHERE album_id = ${mysql.escape(id)} ORDER BY number ASC
//   `, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.json([]);
//     } else {
//       res.json(data);
//     }
//   });
// }

// /************************
//  * ADVANCED INFO ROUTES *
//  ************************/

// // Route 7: GET /top_songs
// const top_songs = async function(req, res) {
//   const page = req.query.page;
//   const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;

//   // Adjust the SQL query to correctly alias the album title and select only the required fields
//   let query = `
//     SELECT Songs.song_id, Songs.title, Albums.album_id, Albums.title AS album, Songs.plays
//     FROM Songs
//     JOIN Albums ON Songs.album_id = Albums.album_id
//     ORDER BY Songs.plays DESC
//   `;

//   if (page) {
//     let offset = (page - 1) * pageSize;
//     let limit = pageSize;
//     query = `
//       SELECT Songs.song_id, Songs.title, Albums.album_id, Albums.title AS album, Songs.plays
//       FROM Songs
//       JOIN Albums ON Songs.album_id = Albums.album_id
//       ORDER BY Songs.plays DESC
//       LIMIT ${limit} OFFSET ${offset}
//       `;
//   }

//   connection.query(query, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.json([]);
//     } else {
//       res.json(data);
//     }
//   });
// }

// // Route 8: GET /top_albums
// const top_albums = async function(req, res) {
//   const page = req.query.page;
//   const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
//   const offset = page ? (page - 1) * pageSize : 0;

//   connection.query(`
//     SELECT Albums.album_id, Albums.title, SUM(Songs.plays) AS plays
//     FROM Albums
//     JOIN Songs ON Albums.album_id = Songs.album_id
//     GROUP BY Albums.album_id
//     ORDER BY plays DESC
//     ${page ? `LIMIT ${pageSize} OFFSET ${offset}` : ''}
//   `, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.json([]);
//     } else {
//       res.json(data);
//     }
//   });
// }

// // Route 9: GET /search_albums
// const search_songs = async function(req, res) {
//   // TODO (TASK 12): return all songs that match the given search query with parameters defaulted to those specified in API spec ordered by title (ascending)
//   // Some default parameters have been provided for you, but you will need to fill in the rest
//       //   title (string)*, duration_low (int)* (default: 60), duration_high
//       // (int)* (default: 660), plays_low (int)* (default: 0), plays_high (int)* (default: 1100000000),
//       // danceability_low (int)* (default: 0), danceability_high (int)* (default: 1), energy_low
//       // (int)* (default: 0), energy_high (int)* (default: 1), valence_low (int)* (default: 0),
//       // valence_high (int)* (default: 1), explicit* (string)
//   let title = req.query.title ?? '';
//   const durationLow = req.query.duration_low ?? 60;
//   const durationHigh = req.query.duration_high ?? 660;
//   const playsLow = req.query.plays_low ?? 0;
//   const playsHigh = req.query.plays_high ?? 1100000000;
//   const danceabilityLow = req.query.danceability_low ?? 0;
//   const danceabilityHigh = req.query.danceability_high ?? 1;
//   const energyLow = req.query.energy_low ?? 0;
//   const energyHigh = req.query.energy_high ?? 1;
//   const valenceLow = req.query.valence_low ?? 0;
//   const valenceHigh = req.query.valence_high ?? 1;
//   const explicit = req.query.explicit ?? '';

//   title = title ? `%${title}%` : '%';

//   let query = `
//     SELECT * FROM Songs
//     WHERE title LIKE ?
//     AND duration BETWEEN ? AND ?
//     AND plays BETWEEN ? AND ?
//     AND danceability BETWEEN ? AND ?
//     AND energy BETWEEN ? AND ?
//     AND valence BETWEEN ? AND ?
//   `;

//   // Parameters for the SQL query
//   let queryParams = [
//     title,
//     durationLow, durationHigh,
//     playsLow, playsHigh,
//     danceabilityLow, danceabilityHigh,
//     energyLow, energyHigh,
//     valenceLow, valenceHigh
//   ];

//   // If explicit is not 'true', exclude explicit songs
//   if (explicit !== 'true') {
//     query += ' AND explicit = 0';
//   }

//   // Order by title in ascending order
//   query += ' ORDER BY title ASC';

//   connection.query(query, queryParams, (err, data) => {
//     if (err) {
//       console.log(err);
//       res.json([]);
//     } else {
//       res.json(data);
//     }
//   });
// }

module.exports = {
  // include all previous functions if they are part of this file
  // author,
  // random,
  // song,
  // album,
  // albums,
  // album_songs,
  // top_songs,
  // top_albums,
  // search_songs,
  getGenrePopularity,
  getPopularCollaborations,
};
