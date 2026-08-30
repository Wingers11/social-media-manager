require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const queue = require('./queue');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// List posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await db.query('SELECT id, content, scheduled_at, status FROM posts ORDER BY scheduled_at LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Create & schedule a post
app.post('/api/posts', async (req, res) => {
  const { user_id, account_id, content, scheduled_at, media } = req.body;
  if (!user_id || !account_id || !content) return res.status(400).json({ error: 'missing fields' });
  try {
    const result = await db.query(
      'INSERT INTO posts (user_id, account_id, content, media, scheduled_at, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [user_id, account_id, content, media ? JSON.stringify(media) : null, scheduled_at || null, scheduled_at ? 'scheduled' : 'draft']
    );
    const postId = result.rows[0].id;

    if (scheduled_at) {
      await queue.schedulePost(postId, scheduled_at);
    }

    res.json({ id: postId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
