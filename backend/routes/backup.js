const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const BACKUP_DIR = path.join(__dirname, '../backups');
const MONGO_URI = process.env.MONGODB_URI;
const MONGODUMP_PATH = 'C:/Users/HP/Downloads/mongodb-database-tools/mongodb-database-tools-windows-x86_64-100.12.2/bin/mongodump.exe';
const MONGORESTORE_PATH = 'C:/Users/HP/Downloads/mongodb-database-tools/mongodb-database-tools-windows-x86_64-100.12.2/bin/mongorestore.exe';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// List backups
router.get('/list', (req, res) => {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list backups' });
    const backups = files.filter(f => f.endsWith('.gz')).sort((a, b) => b.localeCompare(a));
    res.json({ backups });
  });
});

// Download backup
router.get('/download/:filename', (req, res) => {
  const file = path.join(BACKUP_DIR, req.params.filename);
  if (fs.existsSync(file)) {
    res.download(file);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Upload for restore
const upload = multer({ dest: BACKUP_DIR });
router.post('/restore', upload.single('backup'), (req, res) => {
  let backupFile = req.file ? req.file.path : null;
  if (!backupFile && req.body.filename) {
    backupFile = path.join(BACKUP_DIR, req.body.filename);
  }
  if (!backupFile || !fs.existsSync(backupFile)) {
    return res.status(400).json({ error: 'Backup file not found' });
  }
  const cmd = `"${MONGORESTORE_PATH}" --uri="${MONGO_URI}" --archive="${backupFile}" --gzip --drop`;
  exec(cmd, (error, stdout, stderr) => {
    console.log('mongorestore stdout:', stdout);
    console.log('mongorestore stderr:', stderr);
    if (error) {
      console.error('Restore error:', error);
      return res.status(500).json({ error: 'Failed to restore backup', details: stderr });
    }
    res.json({ message: 'Restore completed' });
  });
});

router.post('/trigger', async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.gz`);
  const cmd = `"${MONGODUMP_PATH}" --uri="${MONGO_URI}" --archive="${backupPath}" --gzip`;

  exec(cmd, (error, stdout, stderr) => {
    console.log('mongodump stdout:', stdout);
    console.log('mongodump stderr:', stderr);
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ error: 'Failed to trigger backup', details: stderr });
    }
    res.json({ message: 'Backup completed', file: `backup-${timestamp}.gz` });
  });
});

module.exports = router; 