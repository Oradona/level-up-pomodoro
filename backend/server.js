const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const friendRoutes = require('./routes/friends');
const aiRoutes = require('./routes/ai');
require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigin = process.env.ALLOWED_ORIGIN || null;

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!allowedOrigin) {
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      return callback(null, isLocalhost);
    }

    return callback(null, origin === allowedOrigin);
  },
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'level-up-pomodoro-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/ai', aiRoutes.router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Level Up Pomodoro backend running on port ${PORT}`);
});
