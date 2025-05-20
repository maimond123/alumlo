import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const msg = searchParams.get('msg') || 'unknown';
  const userAgent = request.headers.get('user-agent');
  
  console.log('📬 Opened:', msg, userAgent);
  const gif = await fs.readFile(path.join(process.cwd(), 'public', 'clear.gif'));
  
  return new Response(gif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store'
    }
  });
}
