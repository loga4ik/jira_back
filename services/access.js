const { team, project } = require("../db/models");

/** Участник проекта — член команды или владелец. */
const isProjectMember = async (userId, projectId) => {
  if (!Number.isInteger(userId) || !Number.isInteger(projectId)) return false;

  const inTeam = await team.findOne({
    where: { user_id: userId, project_id: projectId },
  });
  if (inTeam) return true;

  const owned = await project.findOne({
    where: { id: projectId, owner_id: userId },
  });
  return Boolean(owned);
};

module.exports = { isProjectMember };
