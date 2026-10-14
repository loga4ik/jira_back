const Router = require("express").Router();

const { where } = require("sequelize");
const { project, team, task, subtask } = require("../db/models");
const getFreeAndActiveUsers = require("../services/team");
const { requireProjectMember, requireProjectOwner } = require("../middlewares/projectAccess");

Router.get("/deleteProject/:project_id", requireProjectOwner((req) => req.params.project_id), async (req, res) => {
  const project_id = req.projectId;

  try {
    const data = await project.destroy({
      where: { id: project_id },
      force: true,
    });
    const taskList = await task.findAll({
      where: { project_id },
    });
    taskList.forEach(async (taskEl) => {
      await subtask.destroy({
        where: { task_id: taskEl.id },
        force: true,
      });
      await task.destroy({
        where: { project_id },
        force: true,
      });
    });

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getUserProjects/:user_id", async (req, res) => {
  // id в адресе оставлен ради совместимости с фронтом, но чужой список
  // не отдаём: смотреть можно только свои проекты.
  const user_id = req.userId;
  if (Number(req.params.user_id) !== user_id) {
    return res.status(403).json({ message: "Можно смотреть только свои проекты" });
  }
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

Router.get("/:id", requireProjectMember((req) => req.params.id), async (req, res) => {
  const id = req.projectId;
  try {
    const data = await project.findAll({ where: { id: id } });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/getFreeUsers", requireProjectOwner((req) => req.body.project_id), async (req, res) => {
  const project_id = req.projectId;

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
  // Владелец — тот, кто вошёл. user_id из тела больше не используется:
  // иначе можно было создать проект от имени другого пользователя.
  const { description, title, tasks = [] } = req.body;
  try {
    const data = {
      project: {},
      tasks: [],
      subtasks: [],
    };

    data.project = await project.create({
      title,
      description,
      owner_id: req.userId,
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
              return await subtask.create({
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

Router.put("/update/:id", requireProjectOwner((req) => req.params.id), async (req, res) => {
  const { title, description, gitLink, img } = req.body;
  const id = req.projectId;

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

Router.delete("/delete/:id", requireProjectOwner((req) => req.params.id), async (req, res) => {
  const id = req.projectId;
  try {
    const data = await project.destroy({
      where: { id },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.put("/updateAll", requireProjectOwner((req) => req.body.project_id), async (req, res) => {
  const { title, description, tasks = [] } = req.body;
  const project_id = req.projectId;

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
            // только задачи этого проекта: иначе через свой проект
            // можно было переписать и «забрать» чужую задачу по id
            where: { id: taskElem.id, project_id },
            returning: true,
          }
        );

        if (!updatedTask[0]) return; // задача не из этого проекта — пропускаем
        result.tasks.push(updatedTask[0]); // Добавляем задачу в объект `tasks`

        const updatedSubtasks = await Promise.all(
          (taskElem.subtasks ?? []).map(async (subtaskElem) => {
            const [___, updatedSubtask] = await subtask.update(
              { ...subtaskElem, task_id: taskElem.id },
              {
                // подзадача должна принадлежать этой задаче
                where: { id: subtaskElem.id, task_id: taskElem.id },
                returning: true,
              }
            );
            if (updatedSubtask[0]) result.subtasks.push(updatedSubtask[0]); // Добавляем подзадачу в объект `subtasks`
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
