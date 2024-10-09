const Router = require("express").Router();

const { user } = require("../db/models");
const bcrypt = require("bcryptjs");

const comparePassword = async ({ possiblePassword, hashedPassword }) => {
  return await bcrypt.compare(possiblePassword, hashedPassword);
};

Router.get("/", async (req, res) => {
  try {
    const data = await user.findByPk(req.session.user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/getAllUsers", async (req, res) => {
  try {
    const data = await user.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/logOut", async (req, res) => {
  try {
    req.session.destroy(() => {
      res.clearCookie("user_id").json("ok");
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await user.findAll({ where: { id: id } });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/login", async (req, res) => {
  const { login, password } = req.body;
  try {
    try {
      const currentUser = await user.findOne({ where: { login } });
      const isMatch = await comparePassword({
        possiblePassword: password,
        hashedPassword: currentUser.password,
      });
      if (!currentUser || !isMatch) {
        return res.status(401).send("invalid password or login").json();
      } else {
        req.session.user_id = currentUser.id;
        res.json(currentUser);
      }
    } catch (error) {
      return res.status(401).send("invalid password or login").json();
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.post("/create", async (req, res) => {
  const { login, name, surname, patronymic, email, phone, password } = req.body;

  try {
    const isBusy = await user.findOne({ where: { login: login } });
    if (isBusy) {
      res.status(401).send("this login is already taken").json();
    } else {

      const data = await user.create({
        login,
        name,
        surname,
        patronymic,
        email,
        phone,
        password,
        role_id: 1,
      });
      req.session.user_id = data.id;
      res.json(data);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

Router.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await user.destroy({
      where: { id },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = Router;
