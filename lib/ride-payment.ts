export const KFM_DRIVER_SHARE_PERCENT = 80;
export const KFM_COMMISSION_PERCENT = 20;

export type RidePaymentSplit = {
  fareAmount: number;
  driverShareAmount: number;
  kfmCommissionAmount: number;
};

export function calculateRidePaymentSplit(
  fareAmount: number,
): RidePaymentSplit {
  if (!Number.isFinite(fareAmount) || fareAmount <= 0) {
    throw new Error("A valid positive ride fare is required.");
  }

  const fareInPesewas = Math.round(fareAmount * 100);
  const driverShareInPesewas = Math.round(
    (fareInPesewas * KFM_DRIVER_SHARE_PERCENT) / 100,
  );
  const kfmCommissionInPesewas =
    fareInPesewas - driverShareInPesewas;

  return {
    fareAmount: fareInPesewas / 100,
    driverShareAmount: driverShareInPesewas / 100,
    kfmCommissionAmount: kfmCommissionInPesewas / 100,
  };
}

export function normalizeGhanaPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }

  return digits;
}

export function isValidGhanaPhone(value: unknown): boolean {
  return /^0\d{9}$/.test(normalizeGhanaPhone(value));
}
