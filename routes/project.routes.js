const Router = require("express").Router();

const { project, team, task, subtask } = require("../db/models");
const getFreeAndActiveUsers = require("../middlewares/utils");

Router.get("/", async (req, res) => {
  const id = res.params.peoject_id;
  try {
    const data = await project.findByPk(id);
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
    const owner = await project.findAll({ where: { owner_id: user_id } });
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
    // const data = await
    const data = await getFreeAndActiveUsers(project_id, req); // Передаем req

    res.json(data.freeUsers);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Ошибка при получении данных", details: err });
  }
});

Router.post("/create", async (req, res) => {
  const { description, title, user_id, tasks } = req.body;
  try {
    const data = {
      project: {},
      tasks: [],
      subtasks: [],
    };

    data.project = await project.create({
      title,
      description,
      owner_id: user_id,
    });
    data.tasks = await Promise.all(
      tasks.map(async (taskItem) => {
        const createdTask = await task.create({
          title: taskItem.title,
          description: taskItem.description,
          project_id: data.project.id,
        });
        data.subtasks.push(
          ...(await Promise.all(
            taskItem.subtasks.map(async (subtaskItem) => {
              return await task.create({
                title: subtaskItem.title,
                task_id: createdTask.id,
              });
            })
          ))
        );
        return createdTask;
      })
    );
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

Router.put("/updateAll", async (req, res) => {
  const { title, description, project_id, tasks } = req.body;

  try {
    let result = {
      project: null, // Обновленный проект
      tasks: [], // Объект, где ключи — это id задач, а значения — обновленные задачи
      subtasks: [], // Объект, где ключи — это id подзадач, а значения — обновленные подзадачи
    };

    // Обновляем проект и возвращаем обновленный проект
    const [_, updatedProject] = await project.update(
      { title, description },
      {
        where: { id: project_id },
        returning: true, // Для PostgreSQL, возвращает обновленный проект
      }
    );
    result.project = updatedProject[0]; // Устанавливаем обновленный проект

    // Обновляем задачи и подзадачи
    await Promise.all(
      tasks.map(async (taskElem) => {
        const [__, updatedTask] = await task.update(
          { ...taskElem, project_id },
          {
            where: { id: taskElem.id },
            returning: true,
          }
        );

        result.tasks.push(updatedTask[0]); // Добавляем задачу в объект `tasks`

        const updatedSubtasks = await Promise.all(
          taskElem.subtasks.map(async (subtaskElem) => {
            const [___, updatedSubtask] = await subtask.update(
              { ...subtaskElem, task_id: taskElem.id },
              {
                where: { id: subtaskElem.id },
                returning: true,
              }
            );
            result.subtasks.push(updatedSubtask[0]); // Добавляем подзадачу в объект `subtasks`
            return updatedSubtask[0];
          })
        );
      })
    );

    // Возвращаем результат
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = Router;
