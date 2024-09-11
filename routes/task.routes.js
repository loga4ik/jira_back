const Router = require("express").Router();

const { task, subtask } = require("../db/models");

Router.get("/", async (req, res) => {
  try {
    const data = await task.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getTasksAndSubtasks/:project_id", async (req, res) => {
  const project_id = req.params.project_id;
  try {
    const taskArr = await task.findAll({
      where: {
        project_id,
      },
    });
    await Promise.all(
      taskArr.map(async (task) => {
        task.dataValues.subtasks = await subtask.findAll({
          where: {
            task_id: task.id,
          },
        });
      })
    );
    res.json(taskArr);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/create", async (req, res) => {
  const { project_id, title, description } = req.body;

  try {
    const data = await task.create({ project_id, title, description });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/delete:id", async (req, res) => {
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
