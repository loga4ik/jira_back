const { user } = require("../db/models");

module.exports = async function getUser(req, res, next) {
  const userId = req.session.userId;
  const data = userId && (await user.findByPk(userId));
  res.locals.user = data;
  // console.log(req.session);
  next();
};
