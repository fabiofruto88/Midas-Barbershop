const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const routes = require('./routes');
const { getHealth } = require('./controllers/health.controller');
const { apiLimiter } = require('./middlewares/rateLimiter');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Solo se confía en X-Forwarded-For si hay proxies declarados (ver TRUST_PROXY en config/env.js).
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    // Sin CORS_ORIGIN (solo en desarrollo) no se habilita ningún origen cruzado.
    origin: config.corsOrigin || false,
    credentials: true, // El JWT viaja en una cookie HttpOnly
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

// Health check fuera del rate limiter: los monitores de la plataforma lo consultan cada pocos segundos.
app.get('/api/v1/health', getHealth);
app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
