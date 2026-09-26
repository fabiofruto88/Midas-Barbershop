const { isDatabaseUp } = require('../services/health.service');

const getHealth = async (req, res) => {
  const up = await isDatabaseUp();

  res.status(up ? 200 : 503).json({
    status: up ? 'ok' : 'degraded',
    database: up ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
