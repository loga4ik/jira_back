const session = require("express-session");
const FileStore = require("session-file-store")(session);

const sessionConfig = {
  store: new FileStore(),
  name: "user_id",
  secret: "asd",
  resave: true, //поменять на true
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12, //12 часов
    secure: false,
    httpOnly: false,
  },
};
module.exports = sessionConfig;
