import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

const showcaseItems = [
  {
    id: 'photo-1503376780353-7e6692767b70',
    title: 'Paint correction',
    subtitle: 'Porsche 911 GT3 · Stage 2 cut & polish',
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 'photo-1504215680853-026ed2a45def',
    title: 'Interior revival',
    subtitle: 'Audi RS6 Avant · Leather restore & steam extract',
    image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: 'photo-1492144534655-ae79c964c9d7',
    title: 'Ceramic protection',
    subtitle: 'Mercedes-AMG GT · 5-year Gtechniq ceramic coat',
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80"
  }
];

export async function GET() {
  try {
    // Query photos from DB
    const [dbPhotos] = await db.query<RowDataPacket[]>(
      `SELECT sp.id, sp.photo_type, sp.image_data, sp.title, sp.created_at,
              b.reference_code, v.make, v.model, v.rego, s.name AS service_name
       FROM service_photos sp
       JOIN bookings b ON b.id = sp.booking_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       ORDER BY sp.created_at DESC
       LIMIT 20`
    );

    const liveGalleryItems = dbPhotos.map((p) => ({
      id: p.id,
      title: p.title || `${p.service_name} (${p.photo_type.toUpperCase()})`,
      subtitle: `${p.make} ${p.model} · ${p.photo_type === 'after' ? 'Completed Finish' : 'Before Inspection'}`,
      image: p.image_data,
      isLiveDb: true
    }));

    return NextResponse.json({
      photos: [...liveGalleryItems, ...showcaseItems]
    });
  } catch (error) {
    console.error('Failed to query gallery photos:', error);
    return NextResponse.json({ photos: showcaseItems });
  }
}
