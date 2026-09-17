import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

// Operating hours: 8 AM to 5 PM (08:00 to 17:00), 7 days a week, 1-hour intervals
const OPERATING_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
];

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Valid date parameter in YYYY-MM-DD format is required.' },
      { status: 400 }
    );
  }

  try {
    // Fetch all active bookings for this date
    const [existingBookings] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(scheduled_at, '%H:%i') AS slot_time, scheduled_at
       FROM bookings
       WHERE DATE(scheduled_at) = ?
         AND status <> 'cancelled'`,
      [date]
    );

    // Booked times list
    const bookedTimes = existingBookings.map((b) => b.slot_time as string);

    // Check availability for all operating slots on this date
    const slots = OPERATING_SLOTS.map((slotTime) => {
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;

      // Check if any booking is at this slot or within a 1-hour (60 minute) window
      const isConflicting = existingBookings.some((b) => {
        const [bHour, bMin] = (b.slot_time as string).split(':').map(Number);
        const bMinutes = bHour * 60 + bMin;
        // Exactly same time or less than 60 minutes apart
        return Math.abs(slotMinutes - bMinutes) < 60;
      });

      return {
        time: slotTime,
        label: formatTime12(slotTime),
        available: !isConflicting,
        reason: isConflicting ? 'Slot already reserved' : 'Available'
      };
    });

    // If specific time was passed, also return single check
    if (time) {
      const cleanTime = time.slice(0, 5);
      const foundSlot = slots.find((s) => s.time === cleanTime);
      const isAvailable = foundSlot ? foundSlot.available : false;

      return NextResponse.json({
        available: isAvailable,
        date,
        time: cleanTime,
        message: isAvailable
          ? `${formatTime12(cleanTime)} on ${date} is available.`
          : `The ${cleanTime} time slot on ${date} is already booked or conflicts with another booking. Please choose another time.`,
        slots
      });
    }

    return NextResponse.json({
      date,
      operatingHours: '08:00 to 17:00 (Mon-Sun)',
      slots,
      availableCount: slots.filter((s) => s.available).length,
      bookedCount: slots.filter((s) => !s.available).length
    });
  } catch (error) {
    console.error('Availability slot query error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve slot availability from database.' },
      { status: 500 }
    );
  }
}
