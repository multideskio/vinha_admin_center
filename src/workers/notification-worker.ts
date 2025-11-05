import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { processNotificationEvent } from '../lib/notification-hooks';

// ✅ CORRIGIDO: Logging adequado de erros do Redis
function createRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  const isTLS = url.startsWith('rediss://')
  
  const client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy: (times: number) => {
      const delay = Math.min(5000, times * 200)
      console.warn(`Redis reconnecting (attempt ${times})... Delay: ${delay}ms`)
      return delay
    },
    ...(isTLS && { tls: { rejectUnauthorized: false } }),
  })
  
  // ✅ CORRIGIDO: Logar erros em vez de silenciar
  client.on('error', (error) => {
    console.error('Redis connection error:', error)
  })
  
  client.on('connect', () => {
    console.log('Redis connected successfully')
  })
  
  client.on('ready', () => {
    console.log('Redis ready to receive commands')
  })
  
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
