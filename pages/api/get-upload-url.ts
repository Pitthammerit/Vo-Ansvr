import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { CF_ACCOUNT_ID, STREAM_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !STREAM_API_TOKEN) {
    res.status(500).json({ error: 'Env vars missing' });
    return;
  }

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STREAM_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxDurationSeconds: 300 }),
    }
  );

  const { success, errors, result } = await cfRes.json();

  if (!success) {
    res.status(502).json({ error: errors });
    return;
  }

  res.status(200).json(result);
}
