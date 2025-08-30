// Utility to format a Thai address object into a single line string
export function formatAddress(address: any): string {
  if (!address) return '';
  const { house_number, moo, soi, road, district, state, province, postal_code } = address;
  return [
    house_number && `เลขที่ ${house_number}`,
    moo && `หมู่ ${moo}`,
    soi && `ซอย${soi}`,
    road && `ถนน${road}`,
    district && `ตำบล${district}`,
    state && `อำเภอ${state}`,
    province && `จังหวัด${province}`,
    postal_code && postal_code
  ].filter(Boolean).join(' ');
}
