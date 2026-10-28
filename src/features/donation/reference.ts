/** Short, human-friendly reference the donor types into bKash (shared by server and client). */
export const donationReference = (id: string) => `DRPS-${id.slice(-6).toUpperCase()}`;
