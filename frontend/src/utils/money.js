// frontend/src/utils/money.js
//sau trien khai lai tien euro
export function money(v) {
  if (v == null) return "0 €";
  return v.toLocaleString("de-DE") + " €"; // Định dạng EURO
}
