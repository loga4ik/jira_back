const Router = require("express").Router();

const { where } = require("sequelize");
const { team, user } = require("../db/models");
const getFreeAndActiveUsers = require("../middlewares/utils");

Router.get("/", async (req, res) => {
  try {
    const data = await team.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

//получение списка участников проекта
Router.get("/:project_id", async (req, res) => {
  const project_id = req.params.project_id;

  try {
    const user_id_arr = await team.findAll({ where: { project_id } });
    const data = await Promise.all(
      user_id_arr.map(async (person) => {
        return await user.findOne({
          attributes: ["id", "login", "name", "surname", "profile_image"],
          where: { id: person.dataValues.user_id },
        });
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/deleteUser/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const project_id = req.body.project_id;
  try {
    await team.destroy({
      where: { user_id, project_id },
    });

    const data = await getFreeAndActiveUsers(project_id, req);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/create", async (req, res) => {
  const { user_id, project_id } = req.body;

  try {
    const isAlreadyInTeam = await team.findAll({
      where: { user_id, project_id },
    });

    !isAlreadyInTeam.length
      ? await team.create({
          user_id,
          project_id,
        })
      : res.status(403).json("пользователь уже на проекте");
    const data = await getFreeAndActiveUsers(project_id, req);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
