const Router = require("express").Router();

const { project, team, user } = require("../db/models");
const getFreeAndActiveUsers = require("../middlewares/utils");

Router.get("/", async (req, res) => {
  try {
    const data = await project.findByPk(req.session.user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getAllProjects", async (req, res) => {
  try {
    const data = await project.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getUserProjects/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const owner = await project.findOne({ where: { owner_id: user_id } });
    const projectIds = await team.findAll({
      attributes: ["project_id"],
      where: { user_id },
    });
    const working = await Promise.all(
      projectIds.map(async (projectId) => {
        return await project.findByPk(projectId.dataValues.project_id);
      })
    );
    res.status(200).json({ owner, working });
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await project.findAll({ where: { id: id } });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/getFreeUsers", async (req, res) => {
  const project_id = req.body.project_id;

  try {
    const data = await getFreeAndActiveUsers(project_id, req); // Передаем req

    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Ошибка при получении данных", details: err });
  }
});

Router.post("/create", async (req, res) => {
  const { title, description, gitLink, img } = req.body;
  const owner_id = req.session.user_id;

  try {
    const data = await project.create({
      title,
      description,
      owner_id,
      gitLink,
      img,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/update/:id", async (req, res) => {
  const { title, description, gitLink, img } = req.body;
  const id = req.params.id;

  try {
    await project.update(
      { title: title, description: description, gitLink: gitLink, img: img },
      { where: { id: id } }
    );
    const data = await project.findOne({ where: { id } });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await project.destroy({
      where: { id },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
