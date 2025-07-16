import React, { useState, useEffect, useRef } from 'react';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [backups, setBackups] = useState([]);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef();

  const fetchBackups = async () => {
    const res = await fetch('/api/backup/list');
    const data = await res.json();
    setBackups(data.backups || []);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const triggerBackup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/backup/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Backup triggered successfully!');
        fetchBackups();
      } else {
        setMessage(data.error || 'Failed to trigger backup');
      }
    } catch (err) {
      setMessage('Failed to trigger backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (filename) => {
    setRestoreLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('filename', filename);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Restore completed!');
      } else {
        setMessage(data.error || 'Failed to restore backup');
      }
    } catch (err) {
      setMessage('Failed to restore backup');
    } finally {
      setRestoreLoading(false);
    }
  };

  const uploadAndRestore = async (e) => {
    if (!e.target.files[0]) return;
    setRestoreLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('backup', e.target.files[0]);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Restore completed!');
      } else {
        setMessage(data.error || 'Failed to restore backup');
      }
    } catch (err) {
      setMessage('Failed to restore backup');
    } finally {
      setRestoreLoading(false);
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Backup & Restore</h1>
      <button
        onClick={triggerBackup}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Triggering Backup...' : 'Trigger Backup'}
      </button>
      {message && (
        <div className="mt-4 text-sm text-gray-700">{message}</div>
      )}
      <h2 className="text-lg font-semibold mt-8 mb-2">Available Backups</h2>
      <ul>
        {backups.map(name => (
          <li key={name} className="flex items-center justify-between mb-2">
            <span>{name}</span>
            <div className="flex gap-2">
              <a
                href={`/api/backup/download/${encodeURIComponent(name)}`}
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                download
              >
                Download
              </a>
              <button
                onClick={() => restoreBackup(name)}
                className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                disabled={restoreLoading}
              >
                {restoreLoading ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <label className="block mb-2 font-medium">Restore from your own backup file:</label>
        <input
          type="file"
          accept=".gz"
          ref={fileInputRef}
          onChange={uploadAndRestore}
          className="block"
          disabled={restoreLoading}
        />
      </div>
    </div>
  );
};

export default BackupRestore; 