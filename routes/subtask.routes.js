const Router = require("express").Router();

const { subtask, status } = require("../db/models");
const {
  isProjectMember,
  projectIdOfTask,
  projectIdOfSubtask,
} = require("../services/access");
const { requireProjectMember } = require("../middlewares/projectAccess");

/** Исполнителем можно назначить только участника проекта (или снять — null). */
const isValidAssignee = (userId, projectId) =>
  userId === null || userId === undefined
    ? true
    : isProjectMember(Number(userId), projectId);

Router.post("/create", requireProjectMember((req) => projectIdOfTask(req.body.task_id)), async (req, res) => {
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

Router.put("/addUserInSubtask", requireProjectMember((req) => projectIdOfSubtask(req.body.id)), async (req, res) => {
  const { id, user_id } = req.body;
  try {
    if (!(await isValidAssignee(user_id, req.projectId))) {
      return res.status(400).json({ message: "Исполнитель не участник проекта" });
    }
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

Router.put("/addUserInSubtaskRename", requireProjectMember((req) => projectIdOfSubtask(req.body.id)), async (req, res) => {
  const { id, user_id, status_id, title } = req.body;

  try {
    if (!(await isValidAssignee(user_id, req.projectId))) {
      return res.status(400).json({ message: "Исполнитель не участник проекта" });
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

Router.put("/finishSubtask:id", requireProjectMember((req) => projectIdOfSubtask(req.params.id)), async (req, res) => {
  const id = req.params.id;
  try {
    const status_id = status.findOne({ where: { title: "completed" } });
    const data = await subtask.update({ status_id }, { where: { id } });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/delete:id", requireProjectMember((req) => projectIdOfSubtask(req.params.id)), async (req, res) => {
  const id = req.params.id;
  try {
    // раньше здесь удалялся project с этим id (и падало: project не импортирован)
    const data = await subtask.destroy({
      where: { id },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
