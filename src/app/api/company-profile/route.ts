

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { formatAddress } from '@/components/utils/formatAddress';

const filePath = path.join(process.cwd(), 'company-profile.json');

export async function GET() {
  const data = await fs.readFile(filePath, 'utf-8');
  const profile = JSON.parse(data);
  // Ensure productCategoryShorts is always present in the API response
  if (!profile.productCategoryShorts) {
    profile.productCategoryShorts = {};
  }
  // Add address_line field formatted from address object if present
  if (profile.address && typeof profile.address === 'object') {
    profile.address_line = formatAddress(profile.address);
  } else {
    profile.address_line = '';
  }
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    // Optionally validate body here
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลได้' }, { status: 500 });
  }
}
