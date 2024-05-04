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

const song = async function (req, res) {
  const id = req.params.id;

  connection.query(
    `
    SELECT T.track_name AS track_name, T.id AS track_id, T.album_name AS album_name, A.mbid AS artist_id, A.name AS artist_name, A.country AS country, A.listeners AS listeners, Tags.name AS tag
    FROM Track T JOIN Artist A ON T.artist_id = A.mbid JOIN ArtistTags AT ON AT.artist_id = T.artist_id JOIN Tags ON Tags.id = AT.tag_id
    WHERE T.id = '${id}'
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data[0]);
      }
    }
  );
};

const recommendation1 = async function (req, res) {
  const artistId = req.params.artistId;
  const country = req.params.country;
  const tag = req.params.tag;
  const listeners = req.params.listeners;

  connection.query(
    `
    SELECT T.track_name AS track_name, T.id AS track_id
    FROM Track T JOIN Artist A ON T.artist_id = A.mbid JOIN ArtistTags AT ON AT.artist_id = T.artist_id JOIN Tags ON Tags.id = AT.tag_id
    WHERE A.name != '${artistId}'
      AND A.country = '${country}'
      OR Tags.name = '${tag}'
      AND A.listeners <= '${listeners * 0.5}' AND A.listeners >= '${
      listeners * 1.5
    }'
    ORDER BY RAND();
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data[0]);
      }
    }
  );
};

// const recommendation2 = async function(req, res) {
//   const trackId = req.params.trackId;

//   connection.query(`
//   WITH PIDs AS (
//     SELECT PT.pid AS pid
//     FROM Track T JOIN PlaylistTrack PT ON T.id = PT.trackId
//     WHERE T.id = '${trackId}'
//   ), WITH Tracks AS (
//       SELECT PT.trackId AS track_id, COUNT(*) AS appearances
//       FROM PIDs JOIN PlaylistTrack PT ON PIDs.pid = PT.pid
//       GROUP BY PT.trackId
//       HAVING PT.trackId != '${trackId}'
//       ORDER BY appearances
//   )
//     SELECT
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       console.log(err);
//       res.json({});
//     } else {
//       console.log(data.length)
//       console.log(data[0])
//       console.log(data[data.length - 1])
//       res.json(data[0]);
//     }
//   });
// }

const recommendation2 = async function (req, res) {
  const trackId = req.params.trackId;

  connection.query(
    `
  WITH PIDs AS (
    SELECT PT.pid AS pid
    FROM Track T JOIN PlaylistTrack PT ON T.id = PT.trackId
    WHERE T.id = '${trackId}'
  ) 
    SELECT PT.trackId AS track_id, COUNT(*) AS appearances
    FROM PIDs JOIN PlaylistTrack PT ON PIDs.pid = PT.pid
    GROUP BY PT.trackId
    HAVING PT.trackId != '${trackId}'
    ORDER BY appearances
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        console.log(data.length);
        console.log(data[0]);
        console.log(data[data.length - 1]);
        res.json(data[0]);
      }
    }
  );
};

// const recommendation2 = async function(req, res) {
//   const trackId = req.params.trackId;

//   connection.query(`
//   SELECT PT.trackId AS track_id, COUNT(*) AS appearances
//   FROM Track T JOIN PlaylistTrack PT ON T.id = PT.trackId
//   WHERE T.id = '${trackId}'
//   GROUP BY PT.trackId
//   ORDER BY appearances ASC
//   LIMIT 1
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       console.log(err);
//       res.json({});
//     } else {
//       res.json(data[0]);
//     }
//   });
// }

// const recommendation1 = async function(req, res) {
//   const artistId = req.params.artistId;
//   const country = req.params.country;
//   const tag = req.params.tag;
//   const listeners = req.params.listeners;

//   connection.query(`
//     SELECT T.track_name AS track_name, T.album_name AS album_name, A.mbid AS artist_id, A.name AS artist_name, A.country AS country, A.listeners AS listeners, Tags.name AS tag
//     FROM Track T JOIN Artist A ON T.artist_id = A.mbid JOIN ArtistTags AT ON AT.artist_id = T.artist_id JOIN Tags ON Tags.id = AT.tag_id
//     WHERE A.name != '${artistId}'
//       AND A.country = '${country}'
//       AND Tags.name = '${tag}'
//     ORDER BY RAND();
//   `, (err, data) => {
//     if (err || data.length === 0) {
//       console.log(err);
//       res.json({});
//     } else {
//       res.json(data[0]);
//     }
//   });
// }

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
// TODO: collaborative is almost always 0, so see if there's a query that makes more sense
const getPopularCollaborations = async (req, res) => {
  const query = `
    WITH CollabPlaylists AS (
      SELECT p.pid as id
      FROM Playlist p
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

const getArtistsByCountry = async (req, res) => {
  const { country } = req.params; // Get country from URL parameter

  const query = `
    SELECT a.name, a.mbid
    FROM Artist a
    WHERE a.country = ? AND a.country IS NOT NULL
    ORDER BY a.name;
  `;

  connection.query(query, [country], (err, results) => {
    if (err) {
      console.error("Error fetching artists data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const getArtistInfoByCountry = async (req, res) => {
  const { country } = req.params;
  const query = `
  SELECT
  a.name,
  a.listeners,
  a.scrobbles,
  COUNT(DISTINCT pt.pid) AS num_playlists,
  COUNT(DISTINCT t.id) AS num_tracks,
  GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name) AS tags
  FROM Artist a
  JOIN Track t ON a.mbid = t.artist_id
  JOIN PlaylistTrack pt ON t.id = pt.trackId
  JOIN ArtistTags at ON a.mbid = at.artist_id
  JOIN Tags tg ON at.tag_id = tg.id
  WHERE a.country = ?
  GROUP BY a.mbid
  ORDER BY sum(a.scrobbles) DESC, num_playlists DESC
  LIMIT 10;
  `;
  connection.query(query, [country], (err, results) => {
    if (err) {
      console.error("Error fetching artist details:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const getArtistStatsByCountry = async (req, res) => {
  const { country } = req.params;

  const query = `
      WITH CanadianArtists AS (
          SELECT mbid, country
          FROM Artist
          WHERE country = ?
      )
      SELECT
          COUNT(t.id) AS total_tracks,
          COUNT(pt.trackId) AS total_playlists,
          AVG(ptc.track_count) AS avg_tracks_per_playlist
      FROM CanadianArtists ca
      JOIN Track t ON ca.mbid = t.artist_id
      JOIN PlaylistTrack pt ON t.id = pt.trackId
      JOIN PlaylistTrackCounts ptc ON pt.pid = ptc.pid
      GROUP BY country;
  `;

  connection.query(query, [country], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results[0] || {});
    }
  });
};

const getTopGenresByCountry = async (req, res) => {
  const { country } = req.params;
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 5;

  const query = `
  SELECT
  YEAR(p.modified_at) AS year,
  t.name AS tag_name,
  COUNT(pt.pid) AS playlist_count,
  SUM(a.listeners) AS total_listeners
FROM project.Playlist p
JOIN project.PlaylistTrack pt ON p.pid = pt.pid
JOIN project.Track tr ON pt.trackId = tr.id
JOIN project.ArtistTags at ON tr.artist_id = at.artist_id
JOIN project.Tags t ON at.tag_id = t.id
JOIN project.Artist a ON tr.artist_id = a.mbid
WHERE a.country = 'Canada'
GROUP BY year, t.name
ORDER BY year DESC, total_listeners DESC
LIMIT 5;
  `;

  connection.query(query, [country, fiveYearsAgo], (err, results) => {
    if (err) {
      console.error("Error fetching top genres data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const getArtistListByCountry = async (req, res) => {
  const { country } = req.params; // Extract country from the route parameter

  const query = `
      SELECT country, name, listeners, scrobbles, num_playlists, num_tracks, top_tag
      FROM ArtistCountryStats
      WHERE country = ?
      ORDER BY scrobbles DESC, num_playlists DESC
      LIMIT 10;
  `;

  connection.query(query, [country], (err, results) => {
    if (err) {
      console.error("Error fetching artist statistics:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

// const getArtistsByCountry = async (req, res) => {
//   // Directly using 'Germany' in the query to avoid using parameters
//   const query = `
//     SELECT a.name, a.mbid
//     FROM Artist a
//     WHERE a.country = 'Germany' AND a.country IS NOT NULL AND a.country != '<null>'
//     ORDER BY a.name;
//   `;

//   connection.query(query, (err, results) => {
//     if (err) {
//       console.error("Error fetching artists from Germany:", err);
//       res.status(500).json({ error: "Internal server error" });
//     } else {
//       res.json(results);
//     }
//   });
// };

const search_songs = async (req, res) => {
  const limit = req.query.limit ?? 10;
  const offset = req.query.offset ?? 0;

  const query = `
  select id, track_name
  from Track
  where track_name like '%${req.query.q}%'
  limit ${limit}
  offset ${offset}
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

// User/playlist routes
const createUserPlaylist = async (req, res) => {
  const { user_id } = req.body;
  const defaultName = "My New Playlist";

  const query = `
    insert into UserPlaylist (uid, name)
    values (${user_id}, '${defaultName}')
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error running query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const renameUserPlaylist = async (req, res) => {
  const { playlist_id, name } = req.body;
  if (!playlist_id) {
    return res.status(400).json({ error: "Playlist ID must be provided" });
  }

  const query = `
    update UserPlaylist
    set name = '${name}'
    where uplaylist_id = ${playlist_id}
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error running query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const userPlaylistAddSong = async (req, res) => {
  const { playlist_id, track_id } = req.body;
  if (!track_id) {
    return res.status(400).json({ error: "Track ID must be provided" });
  }

  const query = `
    insert into UserPlaylistTrack (uplaylist_id, track_id)
    values (${playlist_id}, ${track_id})
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const getUserPlaylists = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "User ID must be provided" });
  }

  const query = `
    select *
    from UserPlaylist
    where uid = ${user_id}
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

const getUserPlaylistTracks = async (req, res) => {
  const { playlist_id } = req.params;

  const query = `
    select track_id, track_name, track_uri, duration
    from UserPlaylist
    join UserPlaylistTrack on UserPlaylist.uplaylist_id = UserPlaylistTrack.uplaylist_id
    join Track on UserPlaylistTrack.track_id = Track.id
    where UserPlaylist.uplaylist_id = ${playlist_id}
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

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
  song,
  recommendation1,
  recommendation2,
  getGenrePopularity,
  getPopularCollaborations,
  getArtistsByCountry,
  getArtistInfoByCountry,
  search_songs,
  getArtistStatsByCountry,
  getTopGenresByCountry,
  getArtistListByCountry,
  userPlaylistAddSong,
  createUserPlaylist,
  renameUserPlaylist,
  getUserPlaylistTracks,
  getUserPlaylists,
};
