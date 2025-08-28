import { rateLimiter } from '@altamedica/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ message: 'IP address is required' });
  }

  try {
    const { isAllowed } = await rateLimiter(`companies-app:${ip}`, 100, 60);
    return res.status(200).json({ isAllowed });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
