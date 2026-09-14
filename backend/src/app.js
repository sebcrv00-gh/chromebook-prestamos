const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const corsOptions = require('./config/cors');
const { errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const cyclesRoutes = require('./modules/cycles/cycles.routes');
const cartsRoutes = require('./modules/carts/carts.routes');
const cartCyclesRoutes = require('./modules/cartCycles/cartCycles.routes');
const reservationsRoutes = require('./modules/reservations/reservations.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    institution: 'Corporación San Bonifacio de las Lanzas',
    service: 'Sistema de Gestión de Préstamos de Chromebooks API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cycles', cyclesRoutes);
app.use('/api/carts', cartsRoutes);
app.use('/api/cart-cycles', cartCyclesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada en el servidor API',
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
