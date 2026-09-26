const authService = require('../services/auth.service');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

const register = async (req, res) => {
  const user = await authService.register(req.validated.body);
  setAuthCookie(res, signToken(user));
  res.status(201).json(user);
};

const login = async (req, res) => {
  const user = await authService.login(req.validated.body);
  setAuthCookie(res, signToken(user));
  res.status(200).json(user);
};

const logout = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Sesión cerrada.' });
};

const me = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(user);
};

module.exports = { register, login, logout, me };
