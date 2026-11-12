import type { DonationStatus, RequestStatus, Role } from "@/types";

export const CATEGORIES = [
  "Cooked Meals",
  "Fresh Produce",
  "Packaged & Grocery",
  "Bakery",
  "Dairy",
  "Sweets & Snacks",
] as const;

export const UNITS = ["meals", "kg", "litres", "packets"] as const;

export const CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Jaipur",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
] as const;

export const TRANSPORT_OPTIONS = ["Two-Wheeler", "Auto Van", "Car", "Bicycle", "On Foot"] as const;

export const AVAILABILITY_OPTIONS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekends",
  "Anytime",
] as const;

export const HOME_BY_ROLE: Record<Role, string> = {
  provider: "/provider",
  recipient: "/recipient",
  volunteer: "/volunteer",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  provider: "Food Donor",
  recipient: "Recipient NGO",
  volunteer: "Volunteer",
  admin: "Admin",
};

export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  available: "Available",
  claimed: "Claimed",
  completed: "Delivered",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending review",
  approved: "Awaiting volunteer",
  assigned: "Volunteer assigned",
  collected: "Collected — in transit",
  delivered: "Delivered",
  rejected: "Not approved",
};

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  password: string;
}

/** Seeded by backend/seed.py — one-click fill pills on the login page. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "provider", label: "Food Donor", email: "donor@foodlink.in", password: "donor123" },
  { role: "recipient", label: "Recipient NGO", email: "ngo@foodlink.in", password: "ngo123" },
  { role: "volunteer", label: "Volunteer", email: "volunteer@foodlink.in", password: "volunteer123" },
  { role: "admin", label: "Admin", email: "admin@foodlink.in", password: "admin123" },
];
