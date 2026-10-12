/**
 * Allowed PIN codes for store delivery:
 * 1. 841406 -> Hello Bazaar (Basantpur Store)
 * 2. 841408 -> R.K. Hello Center (Bhagwanpur Store)
 */
export const ALLOWED_PINCODES = ["841406", "841408"];

export const ALLOWED_STORE_LOCATIONS = [
  {
    name: "Hello Bazaar (Basantpur Store)",
    pincode: "841406",
  },
  {
    name: "R.K. Hello Center (Bhagwanpur Store)",
    pincode: "841408",
  },
];

export const STORE_LOCATIONS = ALLOWED_STORE_LOCATIONS;

export function isDeliveryAvailable(pincode: string | number | null | undefined): boolean {
  if (!pincode) return false;
  const cleanPin = String(pincode).trim();
  return ALLOWED_PINCODES.includes(cleanPin);
}

export function getDeliveryErrorMessage(pincode?: string | number): string {
  const pinText = pincode ? ` (PIN: ${String(pincode).trim()})` : "";
  return `Delivery is currently unavailable for this address${pinText}. We only deliver to 841406 (Hello Bazaar, Basantpur) and 841408 (R.K. Hello Center, Bhagwanpur).`;
}
