import { Metadata } from "next";
import DeliveryPartnerClient from "./delivery-client";

export const metadata: Metadata = {
  title: "Delivery Partner App | Hello Bazaar",
  description: "Hello Bazaar Delivery Partner Portal for order deliveries and return pickups with 4-digit OTP verification.",
};

export default function DeliveryPartnerPage() {
  return <DeliveryPartnerClient />;
}
