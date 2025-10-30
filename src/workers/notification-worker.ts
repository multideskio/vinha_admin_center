import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { processNotificationEvent } from '../lib/notification-hooks';

function createRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  const isTLS = url.startsWith('rediss://')
  const client = new IORedis(url, {
    maxRetriesPerRequest: null as unknown as undefined,
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy: (times: number) => Math.min(5000, times * 200),
    tls: isTLS ? { rejectUnauthorized: false } : undefined,
  } as any)
  client.on('error', () => {})
  return client
}

const connection = createRedis()

const worker = new Worker(
  'notifications',
  async (job: Job) => {
    const { eventType, data } = job.data;
    await processNotificationEvent(eventType, data);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log('Notificação processada com sucesso:', job.id);
});
worker.on('failed', (job, err) => {
  console.error('Falha ao processar notificação:', job?.id, err);
});
