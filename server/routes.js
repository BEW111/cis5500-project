const mysql = require("mysql");
const config = require("./config.json");
const dotenv = require("dotenv").config();

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
console.log(process);
console.log(process.env);
const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: config.rds_user,
  password: process.env.RDS_PASSWORD,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect((err) => err && console.log(err));

const getSongInfo = async function (req, res) {
  const id = req.params.id;

  connection.query(
    `
    SELECT track_name, id AS track_id, album_name, artist_id
    FROM Track
    WHERE id = ${id}
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({
          track_name: "N/A",
          album_name: "N/A",
          artist_id: "N/A",
        });
      } else {
        res.json(data[0]);
      }
    }
  );
};

const getArtistInfo = async function (req, res) {
  const artist_id = req.params.artistId;
  if (artist_id != null) {
    connection.query(
      `
      SELECT name AS artist_name, country, listeners
      FROM Artist
      WHERE mbid = '${artist_id}' 
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
  }
};

const getArtistTags = async function (req, res) {
  const artist_id = req.params.artistId;
  if (artist_id !== null) {
    connection.query(
      `
      SELECT Tags.name AS tag
      FROM ArtistTags AT JOIN Tags ON AT.tag_id = Tags.id 
      WHERE AT.artist_id = '${artist_id}'
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
  }
};

// const song = async function (req, res) {
//   const id = req.params.id;
//   const artist_id = req.params.artistId;
//   if (artist_id !== null) {
//     connection.query(
//       `
//       SELECT T.track_name AS track_name, T.id AS track_id, T.album_name AS album_name, A.mbid AS artist_id, A.name AS artist_name, A.country AS country, A.listeners AS listeners, Tags.name AS tag
//       FROM Track T JOIN Artist A ON T.artist_id = A.mbid JOIN ArtistTags AT ON AT.artist_id = T.artist_id JOIN Tags ON Tags.id = AT.tag_id
//       WHERE T.id = ${id}
//     `,
//       (err, data) => {
//         if (err || data.length === 0) {
//           console.log(err);
//           res.json({});
//         } else {
//           res.json(data[0]);
//         }
//       }
//     );
//   }
// };

const recommendation1 = async function (req, res) {
  const artistId = req.params.artistId;
  const country = req.params.country;
  const tag = req.params.tag;
  const listeners = req.params.listeners;

  connection.query(
    `
    SELECT T.track_name AS track_name, T.id AS track_id
    FROM Track T 
    JOIN Artist A ON T.artist_id = A.mbid 
    JOIN ArtistTags AT ON AT.artist_id = T.artist_id 
    JOIN Tags ON Tags.id = AT.tag_id
    WHERE A.name != '${artistId}'
      AND (A.country = '${country}' OR Tags.name = '${tag}')
      AND A.listeners >= '${listeners * 0.5}' AND A.listeners <= '${
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

const recommendation2 = async function (req, res) {
  const trackId = req.params.trackId;

  connection.query(
    `
  WITH PIDs AS (
    SELECT PT.pid AS pid
    FROM Track T JOIN PlaylistTrack PT ON T.id = PT.trackId
    WHERE T.id = '${trackId}'
  ), tid AS (
      SELECT PT.trackId AS track_id, COUNT(*) AS appearances
      FROM PIDs JOIN PlaylistTrack PT ON PIDs.pid = PT.pid
      GROUP BY PT.trackId
      HAVING PT.trackId != '${trackId}'
      ORDER BY appearances
  )
    SELECT T.id AS track_id, T.track_name
    FROM tid JOIN Track T ON tid.track_id = T.id
    ORDER BY RAND()
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

const recommendation3 = async function (req, res) {
  const artistId = req.params.artistId;
  const country = req.params.country;
  const tag = req.params.tag;
  const listeners = req.params.listeners;
  const iters = req.params.iters;
  const trackId = req.params.trackId;

  connection.query(
    `
    WITH tracks AS (
      SELECT T.track_name AS track_name, T.id AS track_id
      FROM Track T
      JOIN Artist A ON T.artist_id = A.mbid
      JOIN ArtistTags AT ON AT.artist_id = T.artist_id
      JOIN Tags ON Tags.id = AT.tag_id
      WHERE A.mbid = '${artistId}'
      AND (A.country = '${country}' OR Tags.name = '${tag}')
      AND A.listeners >= '${listeners * 0.5}' AND A.listeners <= '${
      listeners * 1.5
    }'
      AND T.id != '${trackId}'
  )
      SELECT T.track_id AS track_id, T.track_name AS track_name, COUNT(*) AS numPlaylists, SUM(P.num_followers) AS totalFollowers
      FROM tracks T JOIN PlaylistTrack PT ON PT.trackId = T.track_id
      JOIN Playlist P ON PT.pid = P.pid
      GROUP BY T.track_id, T.track_name
      ORDER BY totalFollowers DESC, numPlaylists DESC;
  `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data[iters]);
      }
    }
  );
};

// const recommendation3 = async function (req, res) {
//   const artistId = req.params.artistId;
//   const country = req.params.country;
//   const tag = req.params.tag;
//   const listeners = req.params.listeners;

//   connection.query(
//     `
//     WITH tracks AS (
//       SELECT T.track_name AS track_name, T.id AS track_id
//       FROM Track T
//       JOIN Artist A ON T.artist_id = A.mbid
//       JOIN ArtistTags AT ON AT.artist_id = T.artist_id
//       JOIN Tags ON Tags.id = AT.tag_id
//       WHERE A.mbid = '${artistId}'
//       AND A.country = '${country}'
//       OR Tags.name = '${tag}'
//       AND A.listeners >= '${listeners * 0.5}' AND A.listeners <= '${
//       listeners * 1.5
//     }'
//   )
//       SELECT T.track_id AS track_id, T.track_name AS track_name, COUNT(*) AS numPlaylists, SUM(P.num_followers) AS totalFollowers
//       FROM tracks T JOIN PlaylistTrack PT ON PT.trackId = T.track_id
//       JOIN Playlist P ON PT.pid = P.pid
//       GROUP BY T.track_id, T.track_name
//       ORDER BY RAND();
//   `,
//     (err, data) => {
//       if (err || data.length === 0) {
//         console.log(err);
//         res.json({});
//       } else {
//         res.json(data[0]);
//       }
//     }
//   );
// };

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
    COUNT(pt.pid) AS total_playlists,
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
WHERE a.country = ?
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

const search_songs = async (req, res) => {
  const limit = req.query.limit ?? 10;
  const offset = req.query.offset ?? 0;

  const query = `
    SELECT id, track_name
    FROM Track
    WHERE track_name LIKE ?
    LIMIT ?
    OFFSET ?
  `;

  const queryParams = [`%${req.query.q}%`, limit, offset];

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching popular collaborations data:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
};

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
  getSongInfo,
  getArtistInfo,
  getArtistTags,
  recommendation1,
  recommendation2,
  recommendation3,
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
