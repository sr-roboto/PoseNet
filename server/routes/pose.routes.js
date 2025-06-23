import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
  const poseData = req.body;
  console.log('Datos recibidos:', poseData);
  res.status(200).json({ message: 'Pose recibida correctamente' });
});

export default router;
