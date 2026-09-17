import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { createBooking, type BookingInput } from '@/lib/db/booking';
import { isValidEmail,isValidPostcodeForState,isValidRego,normaliseAuMobile } from '@/lib/validation/au';

export async function POST(request:Request){
  const rep=await currentUser();
  if(!rep||rep.role!=='rep')return NextResponse.json({error:'Unauthorised'},{status:401});
  try {
    const body=await request.json() as Omit<BookingInput,'when'|'date'>;
    const phone=normaliseAuMobile(body.phone);
    if(!phone||!isValidEmail(body.email)||!isValidPostcodeForState(body.postcode,body.state)||!isValidRego(body.rego,body.vehicleState)||!body.name?.trim()||!body.make?.trim()||!body.model?.trim())return NextResponse.json({error:'Please check all customer and vehicle details.'},{status:400});
    const result=await createBooking({...body,phone,email:body.email.trim(),when:"I'll arrive today"},rep.id);
    return NextResponse.json(result,{status:201});
  } catch(error) { console.error('on-arrival submission failed',error);return NextResponse.json({error:'Unable to save this arrival.'},{status:500}); }
}
