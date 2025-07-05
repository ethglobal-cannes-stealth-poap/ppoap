import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid address parameter' });
  }

  try {
    // Using POAP API to fetch all POAPs for an address
    const response = await axios.get(
      `https://api.poap.tech/actions/scan/${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': process.env.POAP_API_KEY || '',
        }
      }
    );

    // Return the POAPs data
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error fetching POAPs for address:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      // Return empty array if no POAPs found
      return res.status(200).json([]);
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch POAPs',
      details: error.response?.data || error.message
    });
  }
}