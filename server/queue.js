const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
const postQueue = new Queue('postQueue', { connection });

module.exports = {
  schedulePost: async (postId, when) => {
    // when can be a Date or timestamp; BullMQ supports delayed jobs via opts.delay
    const opts = {};
    if (when) {
      const delay = Math.max(0, new Date(when).getTime() - Date.now());
      opts.delay = delay;
    }
    return postQueue.add('post', { postId }, opts);
  }
};
