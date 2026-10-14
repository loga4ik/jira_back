const { getProjectAccess } = require("../services/access");

/**
 * Проверка прав на проект — на сервере, на каждый запрос.
 *
 * Аргумент — функция, которая достаёт id проекта из запроса:
 *   requireProjectMember((req) => req.params.id)
 *   requireProjectOwner((req) => req.body.project_id)
 *   requireProjectMember((req) => projectIdOfTask(req.params.id))
 *
 * 404 — проекта нет (или id не число), 403 — нет прав.
 * После проверки в обработчике есть req.projectId.
 */
const requireRole = (role) => (getProjectId) => async (req, res, next) => {
  try {
    const projectId = Number(await getProjectId(req));
    const access = await getProjectAccess(req.userId, projectId);

    if (!access) {
      return res.status(404).json({ message: "Проект не найден" });
    }
    if (role === "owner" ? !access.isOwner : !access.isMember) {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }

    req.projectId = projectId;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

module.exports = {
  /** Владелец или член команды: чтение проекта, работа с задачами. */
  requireProjectMember: requireRole("member"),
  /** Только владелец: настройки и удаление проекта, управление командой. */
  requireProjectOwner: requireRole("owner"),
};
