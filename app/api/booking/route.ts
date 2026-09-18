import { NextResponse } from 'next/server';
import { createBooking, type BookingInput } from '@/lib/db/booking';
import { isValidEmail, isValidPostcodeForState, isValidRego, normaliseAuMobile } from '@/lib/validation/au';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingInput;
    const mobile = normaliseAuMobile(body.phone);

    if (
      !mobile ||
      !isValidEmail(body.email) ||
      !isValidPostcodeForState(body.postcode, body.state) ||
      !isValidRego(body.rego, body.vehicleState) ||
      !body.name?.trim() ||
      !body.make?.trim() ||
      !body.model?.trim()
    ) {
      return NextResponse.json({ error: 'Please check the vehicle and customer details and try again.' }, { status: 400 });
    }

    if (body.when !== 'Pre-book a time' || !body.date || !body.time) {
      return NextResponse.json({ error: 'Please select an appointment date and time.' }, { status: 400 });
    }

    const result = await createBooking({ ...body, phone: mobile, email: body.email.trim() });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error) {
      const errCode = (error as { code: string }).code;
      if (errCode === 'ER_DUP_ENTRY' || errCode === 'SLOT_TAKEN') {
        return NextResponse.json(
          { error: 'That appointment time was just taken. Please choose another time slot.' },
          { status: 409 }
        );
      }
    }
    if (error instanceof Error && (error.message.includes('not available') || error.message.includes('inactive'))) {
      return NextResponse.json(
        { error: 'This service is currently inactive and cannot be booked.' },
        { status: 400 }
      );
    }
    console.error('Booking submission failed:', error);
    return NextResponse.json({ error: 'Unable to save your booking. Please try again shortly.' }, { status: 500 });
  }
}
