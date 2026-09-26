const resultService = require('../services/result.service');

const listPublic = async (req, res) => {
  res.status(200).json(await resultService.listPublished(req.validated.query));
};

const list = async (req, res) => {
  res.status(200).json(await resultService.listAll(req.validated.query));
};

const publish = async (req, res) => {
  res.status(200).json(await resultService.setPublished(req.validated.params.id, req.validated.body.isPublished));
};

module.exports = { listPublic, list, publish };
