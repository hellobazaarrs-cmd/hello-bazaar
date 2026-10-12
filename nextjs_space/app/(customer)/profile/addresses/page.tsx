"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { isDeliveryAvailable, getDeliveryErrorMessage, STORE_LOCATIONS } from "@/lib/pincodes";

export default function AddressesPage() {
  const { status } = useSession() || {};
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [form, setForm] = useState<any>({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", isDefault: false, latitude: null, longitude: null });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile/addresses");
    }
  }, [status, router]);

  const load = () => {
    if (status !== "authenticated") return;
    fetch("/api/addresses").then(r => r.ok ? r.json() : []).then(d => setAddresses(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const detectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your device");
      return;
    }
    setDetectingLoc(true);
    toast.info("Detecting current location via GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          const pincode = addr.postcode?.replace(/[^0-9]/g, "").slice(0, 6) || "";
          const city = addr.city || addr.town || addr.district || addr.county || addr.suburb || "";
          const state = addr.state || "";
          const line1 = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 2).join(",") || "";
          const line2 = addr.county || addr.state_district || "";

          setForm((prev: any) => ({
            ...prev,
            addressLine1: line1 || prev.addressLine1,
            addressLine2: line2 || prev.addressLine2,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            latitude,
            longitude,
          }));

          toast.success("Current GPS location auto-detected!");
        } catch (err) {
          toast.error("Failed to reverse geocode address. Coordinates saved.");
          setForm((prev: any) => ({ ...prev, latitude, longitude }));
        } finally {
          setDetectingLoc(false);
        }
      },
      (err) => {
        setDetectingLoc(false);
        toast.error("Location permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(form.pincode)) { toast.error("Enter a valid 6-digit pincode"); return; }
    if (!isDeliveryAvailable(form.pincode)) {
      toast.error(getDeliveryErrorMessage(form.pincode), { duration: 6000 });
      return;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) { toast.error("Enter a valid 10-digit phone"); return; }
    const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { 
      setShow(false); 
      setForm({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", isDefault: false, latitude: null, longitude: null }); 
      load(); 
      toast.success("Address saved"); 
    } else {
      toast.error(data?.error ?? "Failed to save address");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    if (res.ok) { load(); toast.success("Address deleted"); }
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">My Addresses</h1>
        <Button onClick={() => setShow(!show)}><Plus className="h-4 w-4 mr-1" />Add Address</Button>
      </div>

      <div className="mb-4 p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/70 text-xs text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-700 dark:text-indigo-300 shrink-0">📍 Deliverable Stores:</span>
          <span className="font-semibold">Hello Bazaar (Basantpur - 841406) &amp; R.K. Hello Center (Bhagwanpur - 841408)</span>
        </div>
      </div>
      {show && (
        <form onSubmit={save} className="bg-card rounded-xl p-5 product-card-shadow mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border">
          <Button
            type="button"
            variant="outline"
            onClick={detectLocation}
            disabled={detectingLoc}
            className="sm:col-span-2 min-h-[46px] py-2.5 px-4 bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-600 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center gap-2 rounded-xl transition-all shadow-sm max-w-full overflow-hidden active:scale-[0.98]"
          >
            {detectingLoc ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-600 shrink-0" />
            ) : (
              <Navigation className="h-4 w-4 text-sky-600 animate-bounce shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-extrabold text-sky-700 dark:text-sky-300 text-center leading-tight">
              {detectingLoc ? "Detecting GPS Location..." : "📍 Use Current Location (Auto Detect)"}
            </span>
          </Button>

          <input required placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input required placeholder="Phone (10 digits)" maxLength={10} value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/[^0-9]/g, "")})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input required placeholder="Address Line 1 (House No., Building, Street)" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input placeholder="Address Line 2 (Area, Landmark)" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input required placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input required placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input required placeholder="Pincode" maxLength={6} value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/[^0-9]/g, "")})} className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="h-4 w-4 accent-primary" />Set as default</label>
          <Button type="submit" className="sm:col-span-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold h-11 rounded-xl">Save Address</Button>
        </form>
      )}
      {loading ? <div className="text-center text-muted-foreground py-12">Loading...</div> :
        addresses.length === 0 ? (
          <div className="text-center py-16"><MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No addresses saved yet</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {addresses.map((a: any) => (
              <div key={a.id} className="bg-card rounded-xl p-4 product-card-shadow relative border">
                {a.isDefault && <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">DEFAULT</span>}
                <p className="font-semibold text-sm pr-16">{a.fullName}</p>
                <p className="text-xs text-muted-foreground">{a.phone}</p>
                <p className="text-sm mt-2">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}</p>
                <p className="text-sm text-muted-foreground">{a.city}, {a.state} - {a.pincode}</p>
                {a.latitude && a.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 font-semibold mt-2 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5 text-sky-500" />
                    <span>View Exact GPS Location on Map</span>
                  </a>
                )}
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="text-destructive h-8 px-2"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
