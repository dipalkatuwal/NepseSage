import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings — NepseSage",
  description: "Manage your clinical analysis workspace and preferences",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
