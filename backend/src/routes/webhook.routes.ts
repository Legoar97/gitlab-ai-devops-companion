// backend/src/routes/webhook.routes.ts
import express from 'express';

const router = express.Router();

// Stub implementation - replace with full implementation when ready
router.post('/pipeline', (req, res) => {
  console.log('Pipeline webhook received:', req.body);
  res.json({ status: 'received' });
});

router.post('/job', (req, res) => {
  console.log('Job webhook received:', req.body);
  res.json({ status: 'received' });
});

router.post('/merge-request', (req, res) => {
  console.log('Merge request webhook received:', req.body);
  res.json({ status: 'received' });
});

export default router;