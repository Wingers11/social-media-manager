require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const axios = require('axios');
const db = require('./db');

const connection = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

console.log('Worker (BullMQ) starting...');

const worker = new Worker('postQueue', async job => {
  const { postId } = job.data;
  console.log('Processing post job', postId);

  // Load post & account info
  const { rows } = await db.query('SELECT p.id, p.content, p.account_id, a.provider, a.access_token FROM posts p JOIN accounts a ON p.account_id = a.id WHERE p.id = $1', [postId]);
  if (!rows.length) throw new Error('post not found');
  const post = rows[0];

  // Placeholder: call provider API. Replace with provider-specific SDKs.
  try {
    console.log(`Posting to provider ${post.provider} for account ${post.account_id}`);
    // Example: POST to a fake endpoint (replace)
    // await axios.post('https://api.provider/post', { content: post.content }, { headers: { Authorization: `Bearer ${post.access_token}` } });

    // Mark post as posted
    await db.query('UPDATE posts SET status = $1, posted_at = NOW() WHERE id = $2', ['posted', postId]);
    console.log('Post marked as posted', postId);
  } catch (err) {
    console.error('Failed to post', err.message);
    // increment retry count or set failed status
    await db.query('UPDATE posts SET status = $1 WHERE id = $2', ['failed', postId]);
    throw err;
  }
}, { connection });

worker.on('completed', job => console.log('Job completed', job.id));
worker.on('failed', (job, err) => console.error('Job failed', job.id, err.message));

process.on('SIGINT', async () => { await worker.close(); process.exit(0); });
