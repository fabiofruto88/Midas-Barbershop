const financeService = require('../services/finance.service');

const summary = async (req, res) => {
  res.status(200).json(await financeService.getSummary(req.validated.query, req.user));
};

module.exports = { summary };
