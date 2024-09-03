const express = require("express");
const userRouter = require("./routes/user.routes");
const projectRouter = require("./routes/project.routes");
const teamRouter = require("./routes/team.routes");
const messageRouter = require("./routes/message.routes");

const router = express.Router();

router.use("/user", userRouter);
router.use("/project", projectRouter);
router.use("/team", teamRouter);
router.use("/message", messageRouter);

module.exports = router;