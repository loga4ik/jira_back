const Router = require("express").Router();

const { role } = require("../db/models");

Router.get("/", async (req, res) => {
  try {
    const data = await role.findByPk(req.session.user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getAllUsers", async (req, res) => {
  try {
    const data = await role.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/create", async (req, res) => {
  const { title } = req.body;
  try {
    const data = await role.create({ title });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
