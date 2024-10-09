const Router = require("express").Router();

const { where } = require("sequelize");
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
    const subtaskArr = [];
    await Promise.all(
      taskArr.map(async (task) => {
        subtaskArr.push(
          ...(await subtask.findAll({
            where: {
              task_id: task.id,
            },
          }))
        );
      })
    );
    res.json({ tasks: taskArr, subtasks: subtaskArr });
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
    const data = await task.destroy({
      where: { id },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/edite/:id", async (req, res) => {
  const id = req.params.id;
  const { title, description, subtasks } = req.body;
  
  try {
    // Обновляем задачу и получаем обновленные данные
    const [_, updatedTasks] = await task.update(
      { title, description },
      { where: { id }, returning: true }
    );
    const taskData = updatedTasks[0]; // Извлекаем первую обновлённую запись

    // Получаем старый список подзадач
    const oldSubtaskList = await subtask.findAll({ where: { task_id: id } });

    // Обрабатываем подзадачи
    const subtaskList = await Promise.all(
      subtasks.map(async (subtaskItem) => {
        if (subtaskItem.id) {
          // Обновляем существующую подзадачу
          const [_, updatedSubtasks] = await subtask.update(
            { title: subtaskItem.title, task_id: id },
            { where: { id: subtaskItem.id }, returning: true }
          );
          return updatedSubtasks[0]; // Возвращаем первую обновлённую подзадачу
        } else {
          // Создаем новую подзадачу
          const newSubtask = await subtask.create({
            title: subtaskItem.title,
            task_id: id, // Привязка подзадачи к задаче
          });
          return newSubtask; // Возвращаем созданную подзадачу
        }
      })
    );

    // Ищем и удаляем подзадачи, которых нет в новом списке `subtasks`
    const subtaskIds = subtasks.map(subtaskItem => subtaskItem.id); // Собираем список ID новых подзадач
    const subtasksToDelete = oldSubtaskList.filter(oldSubtask => !subtaskIds.includes(oldSubtask.id)); // Находим подзадачи для удаления

    // Удаляем подзадачи, которых нет в новом списке
    await Promise.all(
      subtasksToDelete.map(async (subtaskToDelete) => {
        await subtask.destroy({ where: { id: subtaskToDelete.id } });
      })
    );

    res.json({ taskData, subtaskList }); // Возвращаем обновленные данные задачи и подзадач
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = Router;
