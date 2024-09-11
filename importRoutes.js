const express = require("express");
const userRouter = require("./routes/user.routes");
const projectRouter = require("./routes/project.routes");
const teamRouter = require("./routes/team.routes");
const messageRouter = require("./routes/message.routes");
const statusRouter = require("./routes/status.routes");
const taskRouter = require("./routes/task.routes");
const subtaskRouter = require("./routes/subtask.routes");

const router = express.Router();

router.use("/user", userRouter);
router.use("/project", projectRouter);
router.use("/team", teamRouter);
router.use("/message", messageRouter);
router.use("/status", statusRouter);
router.use("/task", taskRouter);
router.use("/subtask", subtaskRouter);

module.exports = router;
