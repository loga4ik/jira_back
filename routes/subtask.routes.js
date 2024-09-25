const Router = require("express").Router();

const { subtask, status } = require("../db/models");

Router.get("/", async (req, res) => {
  try {
    const data = await subtask.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/create", async (req, res) => {
  const { task_id, title } = req.body;
  try {
    const statusRes = await status.findOne({
      attributes: ["id"],
      where: { title: "new" },
    });
    const data = await subtask.create({
      task_id,
      title,
      status_id: statusRes.id,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/addUserInSubtask", async (req, res) => {
  const { id, user_id } = req.body;
  try {
    const status_id = status.findOne({ where: { title: "in process" } });
    const data = await subtask.update(
      { user_id, status_id },
      { where: { id } }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/addUserInSubtaskRename", async (req, res) => {
  const { id, user_id, title } = req.body;
  console.log(id, user_id, title);

  try {
    const statusResult = await status.findOne({
      where: { title: "in process" },
    });
    const status_id = statusResult ? statusResult.id : null;

    if (!status_id) {
      return res.status(400).json({ error: "Status not found" });
    }

    const isApdated = await subtask.update(
      { user_id, status_id, title },
      { where: { id } }
    );
    const data = await subtask.findByPk(id);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/finishSubtask:id", async (req, res) => {
  const id = req.params.id;
  try {
    const status_id = status.findOne({ where: { title: "completed" } });
    const data = await subtask.update({ status_id }, { where: { id } });
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
