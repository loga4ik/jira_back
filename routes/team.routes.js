const Router = require("express").Router();
const serverError = require("../services/serverError");

const { where } = require("sequelize");
const { team, user, task, subtask, project } = require("../db/models");
const getFreeAndActiveUsers = require("../services/team");
const { PUBLIC_USER_ATTRIBUTES } = getFreeAndActiveUsers;
const { isProjectMember } = require("../services/access");
const { requireProjectMember, requireProjectOwner } = require("../middlewares/projectAccess");

//получение списка участников проекта
Router.get("/:project_id", requireProjectMember((req) => req.params.project_id), async (req, res) => {
  const project_id = req.projectId;

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
    const currentProject = await project.findOne({ where: { id: project_id } });
    // только публичные поля: email и телефон владельца участникам не нужны
    const owner = await user.findOne({
      attributes: PUBLIC_USER_ATTRIBUTES,
      where: { id: currentProject.dataValues.owner_id },
    });

    res.json([...data, owner]);
  } catch (err) {
    serverError(res, err);
  }
});

Router.delete("/deleteUser/:user_id", requireProjectOwner((req) => req.body.project_id), async (req, res) => {
  const user_id = req.params.user_id;
  const project_id = req.projectId;
  try {
    // Удаляем пользователя из команды по user_id и project_id
    await team.destroy({
      where: { user_id, project_id },
    });

    // Получаем все tasks, которые относятся к данному проекту
    const taskList = await task.findAll({
      attributes: ["id"],
      where: { project_id },
    });

    // Обновляем user_id у подзадач (subtask) для всех найденных task
    const subtaskList = await Promise.all(
      taskList.map(async (taskItem) => {
        const updatedSubtasks = await subtask.update(
          { user_id: null },
          { where: { task_id: taskItem.id, user_id }, returning: true }
        );
        return updatedSubtasks[1]; // возвращаем массив измененных подзадач
      })
    );

    // Объединяем все измененные подзадачи в один массив
    const updatedSubtasks = subtaskList.flat();

    // Получаем данные о свободных и активных пользователях
    const data = await getFreeAndActiveUsers(project_id, req);
    const currentProject = await project.findOne({ where: { id: project_id } });
    // только публичные поля: email и телефон владельца участникам не нужны
    const owner = await user.findOne({
      attributes: PUBLIC_USER_ATTRIBUTES,
      where: { id: currentProject.dataValues.owner_id },
    });
    data.activeUsers = [...data.activeUsers, owner];
    // Возвращаем данные и измененные подзадачи
    res.json({ ...data, updatedSubtasks });
  } catch (err) {
    serverError(res, err);
  }
});

Router.put("/create", requireProjectOwner((req) => req.body.project_id), async (req, res) => {
  const { user_id } = req.body;
  const project_id = req.projectId;

  try {
    const isAlreadyInTeam = await team.findAll({
      where: { user_id, project_id },
    });

    // Раньше здесь отправлялся ответ 403, а код шёл дальше и пытался
    // ответить второй раз — Express падал с «headers already sent».
    if (isAlreadyInTeam.length) {
      return res.status(409).json({ message: "Пользователь уже в команде" });
    }
    await team.create({ user_id, project_id });
    const data = await getFreeAndActiveUsers(project_id, req);
    const currentProject = await project.findOne({ where: { id: project_id } });
    // только публичные поля: email и телефон владельца участникам не нужны
    const owner = await user.findOne({
      attributes: PUBLIC_USER_ATTRIBUTES,
      where: { id: currentProject.dataValues.owner_id },
    });
    data.activeUsers = [...data.activeUsers, owner];
    res.json(data);
  } catch (err) {
    serverError(res, err);
  }
});

Router.get("/isAvailable/:project_id", async (req, res) => {
  try {
    res.json(await isProjectMember(req.userId, Number(req.params.project_id)));
  } catch (err) {
    console.error(err); // Log the error for debugging
    serverError(res, err);
  }
});

module.exports = Router;
