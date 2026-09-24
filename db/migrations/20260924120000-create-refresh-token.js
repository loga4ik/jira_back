"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("refresh_tokens", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        // удалили пользователя — его сеансы уходят вместе с ним
        onDelete: "CASCADE",
      },
      token_hash: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(64),
      },
      family_id: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      expires_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      used_at: {
        type: Sequelize.DATE,
      },
      revoked_at: {
        type: Sequelize.DATE,
      },
      user_agent: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // token_hash уже проиндексирован уникальным ограничением;
    // по family_id гасится цепочка, по user_id чистятся просроченные
    await queryInterface.addIndex("refresh_tokens", ["family_id"]);
    await queryInterface.addIndex("refresh_tokens", ["user_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("refresh_tokens");
  },
};
