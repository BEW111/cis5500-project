var express = require("express");
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
const mysql = require("mysql");
const config = require("../config.json");
const dotenv = require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: config.rds_user,
  password: process.env.RDS_PASSWORD,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect((err) => err && console.log(err));

var ensureLoggedIn = ensureLogIn();

function fetchTodos(req, res, next) {
  connection.query(
    "SELECT * FROM todos WHERE owner_id = ?",
    [req.user.id],
    function (err, rows) {
      if (err) {
        return next(err);
      }

      var todos = rows.map(function (row) {
        return {
          id: row.id,
          title: row.title,
          completed: row.completed == 1 ? true : false,
          url: "/" + row.id,
        };
      });
      res.locals.todos = todos;
      res.locals.activeCount = todos.filter(function (todo) {
        return !todo.completed;
      }).length;
      res.locals.completedCount = todos.length - res.locals.activeCount;
      next();
    }
  );
}

var router = express.Router();

router.get(
  "/",
  function (req, res, next) {
    if (!req.user) {
      return res.json({ message: "Not logged in" });
    }
    next();
  },
  function (req, res, next) {
    res.json({ user: req.user });
  }
);

router.get("/active", ensureLoggedIn, fetchTodos, function (req, res, next) {
  res.locals.todos = res.locals.todos.filter(function (todo) {
    return !todo.completed;
  });
  res.locals.filter = "active";
  res.json({ user: req.user, todos: res.locals.todos });
});

router.get("/completed", ensureLoggedIn, fetchTodos, function (req, res, next) {
  res.locals.todos = res.locals.todos.filter(function (todo) {
    return todo.completed;
  });
  res.locals.filter = "completed";
  res.json({ user: req.user, todos: res.locals.todos });
});

router.post(
  "/",
  ensureLoggedIn,
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== "") {
      return next();
    }
    return res.redirect("/" + (req.body.filter || ""));
  },
  function (req, res, next) {
    connection.query(
      "INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)",
      [req.user.id, req.body.title, req.body.completed == true ? 1 : null],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

router.post(
  "/",
  ensureLoggedIn,
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== "") {
      return next();
    }
    return res.json({ redirect: "/" + (req.body.filter || "") });
  },
  function (req, res, next) {
    connection.query(
      "INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)",
      [req.user.id, req.body.title, req.body.completed == true ? 1 : null],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.json({ redirect: "/" + (req.body.filter || "") });
      }
    );
  }
);

router.post(
  "/:id(\\d+)",
  ensureLoggedIn,
  function (req, res, next) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req, res, next) {
    if (req.body.title !== "") {
      return next();
    }
    return res.json({ redirect: "/" + (req.body.filter || "") });
  },
  function (req, res, next) {
    connection.query(
      "UPDATE todos SET title = ?, completed = ? WHERE id = ? AND owner_id = ?",
      [
        req.body.title,
        req.body.completed !== undefined ? 1 : null,
        req.params.id,
        req.user.id,
      ],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.json({ redirect: "/" + (req.body.filter || "") });
      }
    );
  }
);

router.post("/:id(\\d+)/delete", ensureLoggedIn, function (req, res, next) {
  connection.query(
    "DELETE FROM todos WHERE id = ? AND owner_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.json({ redirect: "/" + (req.body.filter || "") });
    }
  );
});

router.post("/toggle-all", ensureLoggedIn, function (req, res, next) {
  connection.query(
    "UPDATE todos SET completed = ? WHERE owner_id = ?",
    [req.body.completed !== undefined ? 1 : null, req.user.id],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.json({ redirect: "/" + (req.body.filter || "") });
    }
  );
});

router.post("/clear-completed", ensureLoggedIn, function (req, res, next) {
  connection.query(
    "DELETE FROM todos WHERE owner_id = ? AND completed = ?",
    [req.user.id, 1],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.json({ redirect: "/" + (req.body.filter || "") });
    }
  );
});

module.exports = router;
