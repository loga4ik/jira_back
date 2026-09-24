const express = require("express");
const requireAuth = require("./middlewares/requireAuth");
const userRouter = require("./routes/user.routes");
const projectRouter = require("./routes/project.routes");
const teamRouter = require("./routes/team.routes");
const messageRouter = require("./routes/message.routes");
const statusRouter = require("./routes/status.routes");
const taskRouter = require("./routes/task.routes");
const subtaskRouter = require("./routes/subtask.routes");

const router = express.Router();

// В /user есть публичные маршруты (вход, регистрация, обновление токена),
// поэтому защита расставлена внутри него самого.
router.use("/user", userRouter);

// Всё остальное — только для авторизованных. Раньше эти маршруты
// были открыты для кого угодно, в том числе удаление проектов.
router.use("/project", requireAuth, projectRouter);
router.use("/team", requireAuth, teamRouter);
router.use("/message", requireAuth, messageRouter);
router.use("/status", requireAuth, statusRouter);
router.use("/task", requireAuth, taskRouter);
router.use("/subtask", requireAuth, subtaskRouter);

module.exports = router;
