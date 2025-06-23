import express, { json } from 'express';
import { static as expressStatic } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import poseRoutes from './routes/pose.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.use('/api/pose', poseRoutes);
app.use(expressStatic(join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
