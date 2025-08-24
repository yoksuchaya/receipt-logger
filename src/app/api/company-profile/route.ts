import { NextResponse } from 'next/server';
import companyProfile from '../../../../company-profile.json';

export async function GET() {
  return NextResponse.json(companyProfile);
}
