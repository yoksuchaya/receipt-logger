// Convert number to Thai Baht text (simple version)
export function numberToThaiText(num: number): string {
  // This is a simple implementation for demonstration. For production, use a library or more robust logic.
  const thNum = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thDigit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  let n = Math.floor(num);
  if (n === 0) return 'ศูนย์บาทถ้วน';
  let s = '';
  let i = 0;
  while (n > 0) {
    const d = n % 10;
    let t = '';
    if (i === 0 && d === 1 && n > 9) t = 'เอ็ด';
    else if (i === 1 && d === 2) t = 'ยี่';
    else if (i === 1 && d === 1) t = '';
    else if (d !== 0) t = thNum[d];
    if (d !== 0) s = t + thDigit[i] + s;
    n = Math.floor(n / 10);
    i++;
  }
  s += 'บาทถ้วน';
  return s;
}
