"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class refresh_token extends Model {}

  refresh_token.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      // SHA-256 в hex — ровно 64 символа; сам токен в базе не хранится
      token_hash: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING(64),
      },
      // цепочка ротации: при обнаружении кражи гасится целиком
      family_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      expires_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      // когда токен обменяли на новый; повторный обмен после этого — кража
      used_at: {
        type: DataTypes.DATE,
      },
      // логаут или обнаруженная кража
      revoked_at: {
        type: DataTypes.DATE,
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "refresh_token",
      tableName: "refresh_tokens",
    }
  );

  return refresh_token;
};
