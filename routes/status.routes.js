const Router = require("express").Router();

const { status } = require("../db/models");

Router.get("/", async (req, res) => {
  try {
    const data = await status.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/create", async (req, res) => {
  const { title } = req.body;
  try {
    const data = await status.create({ title });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
