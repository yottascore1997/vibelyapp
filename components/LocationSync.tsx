import { useLocationSync } from "../hooks/useLocationSync";

/** Syncs GPS for logged-in users in the background. */
export default function LocationSync() {
  useLocationSync();
  return null;
}
