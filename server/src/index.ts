import express from 'express';
import cors from 'cors';
import { checkDb } from './db.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  const dbOk = await checkDb();
  res.json({ status: 'ok', db: dbOk ? 'connected' : 'disconnected' });
});

app.listen(PORT, () => {
  console.log(`godin-server escuchando en http://localhost:${PORT}`);
});
