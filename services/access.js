const { team, project, task, subtask } = require("../db/models");

const isId = (value) => Number.isInteger(value) && value > 0;

/**
 * Права пользователя в проекте: { isOwner, isMember } или null, если проекта нет.
 * Участник — член команды или владелец. Единственное место, где записано это правило.
 */
const getProjectAccess = async (userId, projectId) => {
  if (!isId(projectId)) return null;

  const found = await project.findByPk(projectId, { attributes: ["owner_id"] });
  if (!found) return null;

  const isOwner = found.owner_id === userId;
  const inTeam =
    !isOwner &&
    Boolean(await team.findOne({ where: { user_id: userId, project_id: projectId } }));

  return { isOwner, isMember: isOwner || inTeam };
};

/** Да/нет для чата, WebSocket и проверки исполнителя. */
const isProjectMember = async (userId, projectId) =>
  Boolean((await getProjectAccess(userId, projectId))?.isMember);

/** Проект задачи; null, если задачи нет. */
const projectIdOfTask = async (taskId) => {
  const id = Number(taskId);
  if (!isId(id)) return null;
  const found = await task.findByPk(id, { attributes: ["project_id"] });
  return found ? found.project_id : null;
};

/** Проект подзадачи — через её задачу. */
const projectIdOfSubtask = async (subtaskId) => {
  const id = Number(subtaskId);
  if (!isId(id)) return null;
  const found = await subtask.findByPk(id, { attributes: ["task_id"] });
  return found ? projectIdOfTask(found.task_id) : null;
};

module.exports = { getProjectAccess, isProjectMember, projectIdOfTask, projectIdOfSubtask };
