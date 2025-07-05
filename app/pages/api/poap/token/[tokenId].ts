import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenId } = req.query;

  if (!tokenId || typeof tokenId !== 'string') {
    return res.status(400).json({ error: 'Invalid token ID parameter' });
  }

  try {
    console.log(`Fetching POAP token for ID: ${tokenId}`);
    
    // Using POAP API to fetch specific token details
    const response = await axios.get(
      `https://api.poap.tech/token/${tokenId}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': process.env.POAP_API_KEY || '',
        }
      }
    );

    console.log('POAP API response:', JSON.stringify(response.data, null, 2));

    // Transform the response to match the expected format
    const data = response.data;
    const transformedData = {
      tokenId: data.tokenId,
      owner: data.owner,
      chain: data.layer || 'Layer2',
      created: data.created,
      event: {
        id: data.event.id,
        fancy_id: data.event.fancy_id,
        name: data.event.name,
        event_url: data.event.event_url,
        image_url: data.event.image_url,
        country: data.event.country,
        city: data.event.city,
        description: data.event.description,
        year: data.event.year,
        start_date: data.event.start_date,
        end_date: data.event.end_date,
        expiry_date: data.event.expiry_date,
        supply: data.supply?.total || 0,
      }
    };

    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    
    // Return the transformed POAP data
    res.status(200).json(transformedData);
  } catch (error: any) {
    console.error('Error fetching POAP token:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'POAP not found' });
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch POAP',
      details: error.response?.data || error.message
    });
  }
}