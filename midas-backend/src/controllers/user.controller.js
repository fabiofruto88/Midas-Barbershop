const userService = require('../services/user.service');

const list = async (req, res) => {
  res.status(200).json(await userService.listUsers(req.validated.query));
};

const getById = async (req, res) => {
  res.status(200).json(await userService.getUserById(req.validated.params.id));
};

const create = async (req, res) => {
  res.status(201).json(await userService.createUser(req.validated.body));
};

const update = async (req, res) => {
  const user = await userService.updateUser(req.validated.params.id, req.validated.body, req.user.id);
  res.status(200).json(user);
};

const remove = async (req, res) => {
  await userService.deleteUser(req.validated.params.id, req.user.id);
  res.status(200).json({ message: 'Usuario eliminado.' });
};

const uploadAvatar = async (req, res) => {
  res.status(200).json(await userService.setAvatar(req.validated.params.id, req.file.buffer));
};

const removeAvatar = async (req, res) => {
  res.status(200).json(await userService.removeAvatar(req.validated.params.id));
};

module.exports = { list, getById, create, update, remove, uploadAvatar, removeAvatar };
