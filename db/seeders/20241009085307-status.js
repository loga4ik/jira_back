"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "statuses",
      [
        {
          id: 2,
          title: "новый",
        },
        {
          id: 3,
          title: "в работе",
        },
        {
          id: 4,
          title: "завершен",
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("statuses", null, {});
  },
};
