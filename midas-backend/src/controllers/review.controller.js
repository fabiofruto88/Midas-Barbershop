const reviewService = require('../services/review.service');

const upsert = async (req, res) => {
  res.status(200).json(await reviewService.upsertReview(req.validated.params.id, req.user, req.validated.body));
};

const listPublic = async (req, res) => {
  res.status(200).json(await reviewService.listPublic(req.validated.query));
};

const list = async (req, res) => {
  res.status(200).json(await reviewService.listAll(req.validated.query));
};

const setVisible = async (req, res) => {
  res.status(200).json(await reviewService.setVisible(req.validated.params.id, req.validated.body.isVisible));
};

module.exports = { upsert, listPublic, list, setVisible };
