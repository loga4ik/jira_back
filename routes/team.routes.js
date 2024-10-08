const Router = require("express").Router();

const { where } = require("sequelize");
const { team, user, task, subtask, project } = require("../db/models");
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
    console.log(updatedSubtasks); // Вывод всех измененных подзадач

    // Получаем данные о свободных и активных пользователях
    const data = await getFreeAndActiveUsers(project_id, req);

    // Возвращаем данные и измененные подзадачи
    res.json({ ...data, updatedSubtasks });
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

Router.get("/isAvailable/:project_id", async (req, res) => {
  const project_id = req.params.project_id;
  const user_id = req.session.user_id;
  console.log(project_id, user_id);

  try {
    let isAvailable = await team.findOne({
      where: { user_id, project_id },
    });

    if (!isAvailable) {
      isAvailable = await project.findOne({
        where: { id: project_id, owner_id: user_id },
      });
    }
    console.log(isAvailable);

    res.json(Boolean(isAvailable));
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = Router;
