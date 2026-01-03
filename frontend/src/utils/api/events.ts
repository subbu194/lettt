import client from '../client';
import type { Event } from '../../types';

export async function fetchEvents(): Promise<Event[]> {
  const resp = await client.get<Event[]>('/events');
  return resp.data;
}


