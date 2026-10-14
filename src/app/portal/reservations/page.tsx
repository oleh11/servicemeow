"use client";

import React from "react";
import { ReservationSystem } from "@/components/workplace/ReservationSystem";

export default function PortalReservationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ReservationSystem isFulfiller={false} />
    </div>
  );
}
