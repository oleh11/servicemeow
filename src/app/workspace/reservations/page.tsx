"use client";

import React from "react";
import { ReservationSystem } from "@/components/workplace/ReservationSystem";

export default function WorkspaceReservationsPage() {
  return <ReservationSystem isFulfiller={true} />;
}
