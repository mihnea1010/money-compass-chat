export type CardNetwork = "Visa" | "Mastercard" | "Amex";
export const MASKED_NUMBER = "•••• •••• •••• ••••";
export const MASKED_CVV = "•••";
export function demoCardDetails(network: CardNetwork, password: string) {
  const unlocked = password.length > 0;
  return {
    number: unlocked ? (network === "Amex" ? "3782 8224 6310 005" : network === "Mastercard" ? "5555 5555 5555 4444" : "4242 4242 4242 4242") : MASKED_NUMBER,
    cvv: unlocked ? (network === "Amex" ? "1234" : "123") : MASKED_CVV,
  };
}