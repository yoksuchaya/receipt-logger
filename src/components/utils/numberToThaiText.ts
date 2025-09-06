// Convert number to Thai Baht text (simple version)
export function numberToThaiText(num: number): string {
  // Improved implementation for Thai Baht text spelling with satang
  const thNum = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thDigit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  function spellThaiNumber(n: number): string {
    if (n === 0) return '';
    let s = '';
    let digits = [];
    while (n > 0) {
      digits.push(n % 10);
      n = Math.floor(n / 10);
    }
    for (let i = digits.length - 1; i >= 0; i--) {
      const d = digits[i];
      let t = '';
      if (i === 0 && d === 1 && digits.length > 1) t = 'เอ็ด';
      else if (i === 1 && d === 2) t = 'ยี่';
      else if (i === 1 && d === 1) t = '';
      else if (d !== 0) t = thNum[d];
      if (d !== 0) s += t + thDigit[i % 6];
      else if (i === 6 && s !== '') s += thDigit[6];
    }
    return s;
  }
  let result = '';
  if (baht === 0 && satang === 0) {
    result = 'ศูนย์บาทถ้วน';
  } else {
    if (baht > 0) {
      result += spellThaiNumber(baht) + 'บาท';
    }
    if (satang > 0) {
      result += spellThaiNumber(satang) + 'สตางค์';
    } else {
      result += 'ถ้วน';
    }
  }
  return result;
}
