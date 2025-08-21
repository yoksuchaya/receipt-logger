// Centralized month label mapping for Thai months
export const monthLabels: { [key: string]: string } = {
  "01": "มกราคม",
  "02": "กุมภาพันธ์",
  "03": "มีนาคม",
  "04": "เมษายน",
  "05": "พฤษภาคม",
  "06": "มิถุนายน",
  "07": "กรกฎาคม",
  "08": "สิงหาคม",
  "09": "กันยายน",
  "10": "ตุลาคม",
  "11": "พฤศจิกายน",
  "12": "ธันวาคม",
};

export const monthOptions = Object.entries(monthLabels).map(([value, label]) => ({ value, label }));

export function getMonthLabel(month: string): string {
  return monthLabels[month] || month;
}
