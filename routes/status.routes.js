const Router = require("express").Router();
const serverError = require("../services/serverError");

const { status } = require("../db/models");

Router.get("/", async (req, res) => {
  try {
    const data = await status.findAll();
    res.json(data);
  } catch (err) {
    serverError(res, err);
  }
});

// Создание статусов убрано: справочник заполняется сидом
// (db/seeders), а раньше добавить статус мог любой вошедший.

module.exports = Router;
