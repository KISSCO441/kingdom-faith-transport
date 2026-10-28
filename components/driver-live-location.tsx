"use client";

import { useEffect, useRef, useState } from "react";
import { supabase as supabaseClient } from "@/lib/supabase";

if (!supabaseClient) {
  throw new Error("Supabase client is not configured.");
}

const supabase = supabaseClient;

export function DriverLiveLocation({ enabled, rideId }: { enabled: boolean; rideId: string | null }) {
  const lastSentAt = useRef(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enabled || !rideId) {
      setMessage("");
      return;
    }

    if (!("geolocation" in navigator)) {
      setMessage("This device does not support GPS location.");
      return;
    }

    let cancelled = false;
    let watchId: number | undefined;

    async function publishLocation(latitude: number, longitude: number, accuracy: number | null) {
      const now = Date.now();
      if (now - lastSentAt.current < 15000) return;
      lastSentAt.current = now;

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.access_token || cancelled) {
        if (!cancelled) setMessage("Please sign in again to share live location.");
        return;
      }

      try {
        const response = await fetch("/api/driver/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ride_id: rideId, latitude, longitude, accuracy_m: accuracy }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Location update failed.");
        if (!cancelled) setMessage("Live location is being shared for your active ride.");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to share live location.");
      }
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        void publishLocation(
          position.coords.latitude,
          position.coords.longitude,
          Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        );
      },
      (error) => {
        if (!cancelled) {
          setMessage(
            error.code === error.PERMISSION_DENIED
              ? "GPS permission is blocked. Allow location access in your browser to enable tracking."
              : "Waiting for a reliable GPS location. Keep location services enabled.",
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => {
      cancelled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, rideId]);

  if (!enabled || !message) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800" role="status">
      {message}
    </div>
  );
}
