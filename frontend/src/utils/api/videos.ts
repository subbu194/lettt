import client from '../client';
import type { Video } from '../../types';

export async function fetchVideos(): Promise<Video[]> {
  const resp = await client.get<Video[]>('/videos');
  return resp.data;
}


