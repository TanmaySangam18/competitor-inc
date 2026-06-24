"use client";

import { useState } from "react";
import { migrateLegacyStorage } from "@/lib/engine/storage";

// Renders nothing. Runs the one-time "roomie:" → "cofounder:" localStorage migration once on the
// client, during the first render (before any page's effects read storage), via the useState
// initializer. SSR-safe — migrateLegacyStorage no-ops when window is undefined.
export function StorageMigrator() {
  useState(() => {
    migrateLegacyStorage();
    return null;
  });
  return null;
}
