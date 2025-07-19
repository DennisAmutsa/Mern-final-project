const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: '../config.env' });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://mern-final-project-bres.onrender.com", 
      "https://mern-final-project-g1oj.vercel.app",
      "https://mern-final-project-g1oj-2q7ho78aa-dennis-projects-a77c1de0.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

const PORT = process.env.PORT || 5000;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join dashboard room for real-time updates
  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    console.log('📊 Client joined dashboard room:', socket.id);
  });
  
  // Join emergency room for emergency updates
  socket.on('join-emergency', () => {
    socket.join('emergency');
    console.log('🚨 Client joined emergency room:', socket.id);
  });
  
  // Join appointments room
  socket.on('join-appointments', () => {
    socket.join('appointments');
    console.log('📅 Client joined appointments room:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available globally for other modules
global.io = io;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://mern-final-project-bres.onrender.com", 
    "https://mern-final-project-g1oj.vercel.app",
    "https://mern-final-project-g1oj-2q7ho78aa-dennis-projects-a77c1de0.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  bufferCommands: false
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas - Hospital Management System');
    console.log('🌍 Database: hospital-management');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('🔍 Please check your MongoDB Atlas connection string and network connectivity');
  });

// Routes
console.log('Registering routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/audit-logs', require('./routes/audit-logs'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/financial-reports', require('./routes/financialReports'));
app.use('/api/backup', require('./routes/backup'));
console.log('Routes registered successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hospital Management System Good Health and Well-being',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    userAgent: req.get('User-Agent')
  });
});

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
} else {
  // Development: catch-all route for debugging
  app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.method, req.originalUrl);
    res.status(404).json({ error: 'Route not found', method: req.method, url: req.originalUrl });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`🏥 Hospital Management System running on port ${PORT}`);
  console.log(`📊  Good Health and Well-being`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend served from: ${path.join(__dirname, '../frontend/build')}`);
  }
});