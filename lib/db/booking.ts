import 'server-only';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';
import { db } from './client';
import { normaliseAuMobile } from '../validation/au';

export type BookingInput = {
  rego: string;
  vehicleState: string;
  make: string;
  model: string;
  service: string;
  when: 'Pre-book a time' | "I'll arrive today";
  date?: string;
  time?: string;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  state: string;
  postcode: string;
};

export async function createBooking(input: BookingInput, assignedRepId?: string) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check for conflicting booking on the same date and time (enforcing 1-hour gap)
    if (input.when === 'Pre-book a time' && input.date && input.time) {
      const cleanTime = input.time.slice(0, 5);
      const [slotHour, slotMin] = cleanTime.split(':').map(Number);
      const newMinutes = slotHour * 60 + (slotMin || 0);

      const [existingBookings] = await connection.query<RowDataPacket[]>(
        `SELECT id, DATE_FORMAT(scheduled_at, '%H:%i') AS slot_time
         FROM bookings
         WHERE DATE(scheduled_at) = ?
           AND status <> 'cancelled'`,
        [input.date]
      );

      const isConflicting = existingBookings.some((b) => {
        if (!b.slot_time) return false;
        const [bHour, bMin] = (b.slot_time as string).split(':').map(Number);
        const bMinutes = bHour * 60 + (bMin || 0);
        return Math.abs(newMinutes - bMinutes) < 60;
      });

      if (isConflicting) {
        const slotError = new Error(
          'That time slot is already booked. Bookings require at least a 1-hour gap. Please select another slot.'
        );
        (slotError as unknown as { code: string }).code = 'SLOT_TAKEN';
        throw slotError;
      }
    }

    // 2. Unify customer identity by email or phone number
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = normaliseAuMobile(input.phone) || input.phone.trim();

    const [existingCustomer] = await connection.query<(RowDataPacket & { id: string })[]>(
      'SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1',
      [cleanEmail, cleanPhone]
    );

    let actualCustomerId: string;
    if (existingCustomer.length > 0) {
      // Reuse existing customer profile
      actualCustomerId = existingCustomer[0].id;
      await connection.execute(
        `UPDATE customers
         SET full_name = ?, email = ?, phone = ?, suburb = ?, state = ?, postcode = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [input.name.trim(), cleanEmail, cleanPhone, input.suburb.trim(), input.state.trim(), input.postcode.trim(), actualCustomerId]
      );
    } else {
      // Create new customer profile
      actualCustomerId = ulid();
      await connection.execute(
        `INSERT INTO customers (id, full_name, email, phone, suburb, state, postcode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [actualCustomerId, input.name.trim(), cleanEmail, cleanPhone, input.suburb.trim(), input.state.trim(), input.postcode.trim()]
      );
    }

    // 3. Unify vehicle record (link to unified customer)
    const cleanRego = input.rego.toUpperCase().replace(/[\s-]/g, '');
    const [existingVehicle] = await connection.query<(RowDataPacket & { id: string })[]>(
      'SELECT id FROM vehicles WHERE rego = ? AND state = ? LIMIT 1',
      [cleanRego, input.vehicleState]
    );

    let vehicleId: string;
    if (existingVehicle.length > 0) {
      vehicleId = existingVehicle[0].id;
      await connection.execute(
        `UPDATE vehicles
         SET customer_id = ?, make = ?, model = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [actualCustomerId, input.make.trim(), input.model.trim(), vehicleId]
      );
    } else {
      vehicleId = ulid();
      await connection.execute(
        `INSERT INTO vehicles (id, customer_id, rego, state, make, model)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [vehicleId, actualCustomerId, cleanRego, input.vehicleState, input.make.trim(), input.model.trim()]
      );
    }

    // 4. Validate service
    const [serviceRows] = await connection.query<(RowDataPacket & { id: string })[]>(
      'SELECT id FROM services WHERE slug = ? AND is_active = TRUE LIMIT 1',
      [input.service]
    );
    if (!serviceRows[0]) throw new Error('Selected service is not available.');

    // 5. Insert booking unified under actualCustomerId
    const bookingId = ulid();
    const reference = `AL-${bookingId.slice(-5).toUpperCase()}`;
    const scheduledAt =
      input.when === 'Pre-book a time' && input.date && input.time
        ? `${input.date} ${input.time.slice(0, 5)}:00.000`
        : null;

    await connection.execute(
      `INSERT INTO bookings (id, reference_code, customer_id, vehicle_id, service_id, assigned_rep_id, booking_type, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        bookingId,
        reference,
        actualCustomerId,
        vehicleId,
        serviceRows[0].id,
        assignedRepId ?? null,
        input.when === 'Pre-book a time' ? 'pre_booked' : 'on_arrival',
        scheduledAt
      ]
    );

    await connection.execute(
      'INSERT INTO service_logs (id, booking_id, event_name, metadata) VALUES (?, ?, ?, ?)',
      [ulid(), bookingId, 'created', JSON.stringify({ source: 'public_booking', customerId: actualCustomerId })]
    );

    await connection.commit();
    return { reference, bookingId, customerId: actualCustomerId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
