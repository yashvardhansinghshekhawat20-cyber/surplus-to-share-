/** Hand-written mirrors of the backend Pydantic models — keep both sides in sync in one edit. */

export type Role = "provider" | "recipient" | "volunteer" | "admin";
export type DonationStatus = "available" | "claimed" | "completed";
export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "assigned"
  | "collected"
  | "delivered";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  city: string;
  organization: string;
  availability: string;
  transportation: string;
  created_at: string;
  token?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "admin">;
  phone: string;
  city: string;
  organization: string;
  availability: string;
  transportation: string;
}

export interface Donation {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_organization: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city: string;
  pickup_location: string;
  pickup_contact: string;
  expiry_date: string;
  description: string;
  status: DonationStatus;
  created_at: string;
  lat: number;
  lng: number;
  location_approximate: boolean;
}

export interface DonationCreatePayload {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city: string;
  pickup_location: string;
  pickup_contact: string;
  expiry_date: string;
  description: string;
  lat: number | null;
  lng: number | null;
}

export interface FoodRequest {
  id: string;
  donation_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_organization: string;
  quantity: number;
  unit: string;
  message: string;
  status: RequestStatus;
  volunteer_id: string | null;
  volunteer_name: string | null;
  volunteer_phone?: string | null;
  has_proof: boolean;
  thank_you: string;
  created_at: string;
  updated_at: string;
  donation_title: string;
  donation_city: string;
  pickup_location: string;
  provider_name: string;
  donation_status: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
}

export interface DeliveryStatusPayload {
  status: "collected" | "delivered";
  proof_photo?: string;
}

export interface LocationUpdatePayload {
  lat: number;
  lng: number;
}

export interface UnitQuantity {
  unit: string;
  quantity: number;
}

export interface CityImpact {
  city: string;
  deliveries: number;
  listings: number;
  ngos_served: number;
  volunteers_active: number;
  quantities: UnitQuantity[];
}

export interface ImpactStory {
  id: string;
  kind: "thank_you" | "auto";
  headline: string;
  message: string;
  recipient_name: string;
  provider_name: string;
  volunteer_name: string;
  city: string;
  category: string;
  delivered_at: string;
  has_photo: boolean;
}

export interface ImpactSummary {
  total_deliveries: number;
  total_quantity: UnitQuantity[];
  cities_reached: number;
  ngos_served: number;
  cities: CityImpact[];
  stories: ImpactStory[];
}

export interface TrackingInfo {
  request_id: string;
  status: string;
  volunteer_name: string;
  volunteer_phone?: string | null;
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
}

export interface RestoreResult {
  users_added: number;
  users_updated: number;
  users_skipped: number;
  donations_added: number;
  donations_updated: number;
  requests_added: number;
  requests_updated: number;
  photos_restored: number;
}

export interface VolunteerPin {
  id: string;
  name: string;
  phone?: string;
  city: string;
  transportation: string;
  availability: string;
  lat: number;
  lng: number;
  approximate: boolean;
  active_deliveries: number;
}

export interface RequestCreatePayload {
  donation_id: string;
  quantity: number;
  message: string;
}

export interface CountByCategory {
  category: string;
  count: number;
}

export interface CountByCity {
  city: string;
  count: number;
}

export interface PlatformStats {
  total_users: number;
  providers: number;
  recipients: number;
  volunteers: number;
  total_donations: number;
  available_donations: number;
  completed_donations: number;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  delivered_requests: number;
  rescued_quantity: number;
  category_counts: CountByCategory[];
  city_counts: CountByCity[];
}

export interface PublicStats {
  donations_listed: number;
  rescued_meals: number;
  partner_ngos: number;
  active_volunteers: number;
}
