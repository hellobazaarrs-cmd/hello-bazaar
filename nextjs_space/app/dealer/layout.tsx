import { redirect } from "next/navigation";

export default function DealerPortalRedirectLayout() {
  // Dealers are wholesale buyers on Hello Bazaar B2B and do not sell or list products.
  // All dealer-seller portal paths redirect to the main B2B storefront.
  redirect("/home");
}
