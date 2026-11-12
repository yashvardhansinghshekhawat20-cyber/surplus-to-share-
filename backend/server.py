import io
import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import jwt
from fastapi import FastAPI, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from passlib.hash import pbkdf2_sha256
from pydantic import BaseModel
import pandas as pd

JWT_SECRET = "foodlink-super-secret-local-jwt-key"
JWT_ALGORITHM = "HS256"
COOKIE_NAME = "foodlink_session"

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")
BACKUP_SEED_FILE = os.path.join(DATA_DIR, "backup-full.json")

os.makedirs(DATA_DIR, exist_ok=True)

# City center coordinates default fallback
CITY_COORDS = {
    "Bengaluru": [12.9716, 77.5946],
    "Mumbai": [19.0760, 72.8777],
    "Delhi NCR": [28.6139, 77.2090],
    "Hyderabad": [17.3850, 78.4867],
    "Chennai": [13.0827, 80.2707],
    "Pune": [18.5204, 73.8567],
    "Kolkata": [22.5726, 88.3639],
    "Ahmedabad": [23.0225, 72.5714],
}

def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {DB_FILE}, falling back to seed: {e}")

    if os.path.exists(BACKUP_SEED_FILE):
        with open(BACKUP_SEED_FILE, "r", encoding="utf-8") as f:
            seed = json.load(f)
            collections = seed.get("collections", {})
            db = {
                "users": collections.get("users", []),
                "donations": collections.get("donations", []),
                "food_requests": collections.get("food_requests", []),
                "delivery_proofs": collections.get("delivery_proofs", []),
                "volunteer_tracking": {}
            }
            save_db(db)
            return db

    default_db = {
        "users": [],
        "donations": [],
        "food_requests": [],
        "delivery_proofs": [],
        "volunteer_tracking": {}
    }
    save_db(default_db)
    return default_db

def save_db(db: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, default=str)

db = load_db()

app = FastAPI(title="FoodLink Local API", docs_url="/api/docs", openapi_url="/api/openapi.json")

@app.get("/")
def root():
    return {
        "name": "FoodLink Surplus to Share API",
        "status": "online",
        "frontend_website": "https://surplus-to-share.vercel.app",
        "interactive_docs": "/api/docs",
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        # Check Authorization header bearer token fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        for u in db["users"]:
            if u["id"] == user_id:
                return u
    except Exception:
        return None
    return None

def require_current_user(request: Request) -> Dict[str, Any]:
    user = get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def user_to_public(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "phone": u.get("phone", ""),
        "city": u.get("city", ""),
        "organization": u.get("organization", ""),
        "availability": u.get("availability", ""),
        "transportation": u.get("transportation", ""),
        "created_at": str(u.get("created_at", datetime.now(timezone.utc).isoformat())),
    }

def format_food_request(r: Dict[str, Any]) -> Dict[str, Any]:
    # Lookup parent donation
    donation = next((d for d in db["donations"] if d["id"] == r["donation_id"]), None)
    vol_id = r.get("volunteer_id")
    vol_user = next((u for u in db["users"] if u["id"] == vol_id), None) if vol_id else None
    vol_phone = r.get("volunteer_phone") or (vol_user.get("phone") if vol_user else "")
    if not vol_phone and vol_id:
        vol_phone = "+91 98000 91000"

    return {
        "id": r["id"],
        "donation_id": r["donation_id"],
        "recipient_id": r["recipient_id"],
        "recipient_name": r.get("recipient_name", ""),
        "recipient_organization": r.get("recipient_organization", ""),
        "quantity": float(r.get("quantity", 0)),
        "unit": r.get("unit") or (donation.get("unit", "") if donation else ""),
        "message": r.get("message", ""),
        "status": r.get("status", "pending"),
        "volunteer_id": vol_id,
        "volunteer_name": r.get("volunteer_name") or (vol_user.get("name") if vol_user else None),
        "volunteer_phone": vol_phone if vol_id else None,
        "has_proof": bool(r.get("has_proof", False)),
        "thank_you": r.get("thank_you", ""),
        "created_at": str(r.get("created_at", "")),
        "updated_at": str(r.get("updated_at", "")),
        "donation_title": donation.get("title", "") if donation else "",
        "donation_city": donation.get("city", "") if donation else "",
        "pickup_location": donation.get("pickup_location", "") if donation else "",
        "provider_name": donation.get("provider_name", "") if donation else "",
        "donation_status": donation.get("status", "") if donation else "",
        "pickup_lat": donation.get("lat") if donation else None,
        "pickup_lng": donation.get("lng") if donation else None,
    }

# ==================== AUTH ENDPOINTS ====================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: str = ""
    city: str = ""
    organization: str = ""
    availability: str = ""
    transportation: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register(body: RegisterRequest, response: Response):
    for u in db["users"]:
        if u["email"].lower() == body.email.lower():
            raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    pw_hash = pbkdf2_sha256.hash(body.password)
    now = datetime.now(timezone.utc).isoformat()
    new_user = {
        "id": user_id,
        "name": body.name,
        "email": body.email.lower(),
        "role": body.role,
        "phone": body.phone,
        "city": body.city,
        "organization": body.organization,
        "availability": body.availability,
        "transportation": body.transportation,
        "password_hash": pw_hash,
        "created_at": now,
    }
    db["users"].append(new_user)
    save_db(db)

    exp = datetime.now(timezone.utc) + timedelta(days=30)
    token = jwt.encode({"sub": user_id, "exp": int(exp.timestamp())}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=30 * 24 * 3600,
        path="/",
    )
    return user_to_public(new_user)

@app.post("/api/auth/login")
def login(body: LoginRequest, response: Response):
    user = None
    for u in db["users"]:
        if u["email"].lower() == body.email.lower():
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # verify password
    is_valid = False
    try:
        is_valid = pbkdf2_sha256.verify(body.password, user.get("password_hash", ""))
    except Exception:
        # Fallback plaintext check if newly created or testing
        is_valid = (body.password == user.get("password_hash", ""))

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    exp = datetime.now(timezone.utc) + timedelta(days=30)
    token = jwt.encode({"sub": user["id"], "exp": int(exp.timestamp())}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=30 * 24 * 3600,
        path="/",
    )
    return user_to_public(user)

@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(require_current_user)):
    return user_to_public(user)

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}

# ==================== PUBLIC STATS & IMPACT ====================

@app.get("/api/stats")
def get_public_stats():
    donations_count = len(db["donations"])
    ngos_count = len([u for u in db["users"] if u["role"] == "recipient"])
    volunteers_count = len([u for u in db["users"] if u["role"] == "volunteer"])
    
    rescued_meals = 0.0
    for r in db["food_requests"]:
        if r.get("status") == "delivered":
            rescued_meals += float(r.get("quantity", 0))

    return {
        "donations_listed": donations_count,
        "rescued_meals": rescued_meals,
        "partner_ngos": ngos_count,
        "active_volunteers": volunteers_count,
    }

@app.get("/api/impact")
def get_impact():
    delivered_requests = [r for r in db["food_requests"] if r.get("status") == "delivered"]
    total_deliveries = len(delivered_requests)

    # Unit breakdown
    unit_totals: Dict[str, float] = {}
    city_map: Dict[str, Dict[str, Any]] = {}

    for d in db["donations"]:
        c = d.get("city", "Bengaluru")
        if c not in city_map:
            city_map[c] = {"city": c, "deliveries": 0, "listings": 0, "ngos_served": set(), "volunteers_active": set(), "units": {}}
        city_map[c]["listings"] += 1

    for r in delivered_requests:
        donation = next((d for d in db["donations"] if d["id"] == r["donation_id"]), None)
        unit = r.get("unit") or (donation.get("unit", "meals") if donation else "meals")
        qty = float(r.get("quantity", 0))
        unit_totals[unit] = unit_totals.get(unit, 0.0) + qty

        city = donation.get("city", "Bengaluru") if donation else "Bengaluru"
        if city not in city_map:
            city_map[city] = {"city": city, "deliveries": 0, "listings": 0, "ngos_served": set(), "volunteers_active": set(), "units": {}}
        city_map[city]["deliveries"] += 1
        city_map[city]["ngos_served"].add(r.get("recipient_id"))
        if r.get("volunteer_id"):
            city_map[city]["volunteers_active"].add(r.get("volunteer_id"))
        city_map[city]["units"][unit] = city_map[city]["units"].get(unit, 0.0) + qty

    cities_res = []
    for c, data in city_map.items():
        cities_res.append({
            "city": c,
            "deliveries": data["deliveries"],
            "listings": data["listings"],
            "ngos_served": len(data["ngos_served"]),
            "volunteers_active": len(data["volunteers_active"]),
            "quantities": [{"unit": u, "quantity": q} for u, q in data["units"].items()]
        })

    # Stories
    stories = []
    for r in delivered_requests:
        donation = next((d for d in db["donations"] if d["id"] == r["donation_id"]), None)
        has_thank_you = bool(r.get("thank_you"))
        stories.append({
            "id": r["id"],
            "kind": "thank_you" if has_thank_you else "auto",
            "headline": r.get("thank_you") if has_thank_you else f"{int(r.get('quantity', 0))} {r.get('unit', 'meals')} delivered to {r.get('recipient_organization') or r.get('recipient_name')}",
            "message": r.get("thank_you") or r.get("message") or "Surplus food delivered safely to beneficiaries.",
            "recipient_name": r.get("recipient_name", ""),
            "provider_name": donation.get("provider_name", "") if donation else "",
            "volunteer_name": r.get("volunteer_name", "Volunteer"),
            "city": donation.get("city", "") if donation else "",
            "category": donation.get("category", "") if donation else "Cooked Meals",
            "delivered_at": str(r.get("updated_at", r.get("created_at", ""))),
            "has_photo": bool(r.get("has_proof", False))
        })

    all_ngos = {r.get("recipient_id") for r in delivered_requests}

    return {
        "total_deliveries": total_deliveries,
        "total_quantity": [{"unit": u, "quantity": q} for u, q in unit_totals.items()],
        "cities_reached": len([c for c in cities_res if c["deliveries"] > 0]),
        "ngos_served": len(all_ngos),
        "cities": cities_res,
        "stories": stories
    }

class ThankYouPayload(BaseModel):
    message: str

@app.post("/api/impact/thank-you/{request_id}")
def post_thank_you(request_id: str, body: ThankYouPayload, user: Dict[str, Any] = Depends(require_current_user)):
    req = next((r for r in db["food_requests"] if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req["thank_you"] = body.message
    req["thank_you_at"] = datetime.now(timezone.utc).isoformat()
    save_db(db)
    return format_food_request(req)

@app.get("/api/impact/stories/{story_id}/photo")
def get_story_photo(story_id: str):
    proof = next((p for p in db.get("delivery_proofs", []) if p.get("request_id") == story_id), None)
    if not proof or not proof.get("image"):
        raise HTTPException(status_code=404, detail="Photo not found")
    
    img_data = proof["image"]
    if "," in img_data:
        img_data = img_data.split(",", 1)[1]
    
    import base64
    raw_bytes = base64.b64decode(img_data)
    return Response(content=raw_bytes, media_type="image/jpeg")

# ==================== DONATIONS ENDPOINTS ====================

class DonationCreatePayload(BaseModel):
    title: str
    category: str
    quantity: float
    unit: str
    city: str
    pickup_location: str
    pickup_contact: str
    expiry_date: str
    description: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None

def ensure_donation_coords(d: Dict[str, Any]) -> Dict[str, Any]:
    lat = d.get("lat")
    lng = d.get("lng")
    if lat is None or lng is None:
        city = d.get("city", "Bengaluru")
        coords = CITY_COORDS.get(city, [12.9716, 77.5946])
        d["lat"] = coords[0]
        d["lng"] = coords[1]
        d["location_approximate"] = True
    return d

@app.get("/api/donations")
def get_donations(
    status: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    q: Optional[str] = None
):
    results = [ensure_donation_coords(d) for d in db["donations"]]
    if status:
        results = [d for d in results if d.get("status") == status]
    if city:
        results = [d for d in results if d.get("city") == city]
    if category:
        results = [d for d in results if d.get("category") == category]
    if q:
        query_str = q.lower()
        results = [
            d for d in results
            if query_str in d.get("title", "").lower()
            or query_str in d.get("description", "").lower()
            or query_str in d.get("pickup_location", "").lower()
        ]
    return results

@app.get("/api/donations/mine")
def get_my_donations(user: Dict[str, Any] = Depends(require_current_user)):
    return [d for d in db["donations"] if d.get("provider_id") == user["id"]]

@app.post("/api/donations")
def create_donation(body: DonationCreatePayload, user: Dict[str, Any] = Depends(require_current_user)):
    lat = body.lat
    lng = body.lng
    approx = False
    if lat is None or lng is None:
        coords = CITY_COORDS.get(body.city, [12.9716, 77.5946])
        lat = coords[0]
        lng = coords[1]
        approx = True

    donation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_donation = {
        "id": donation_id,
        "provider_id": user["id"],
        "provider_name": user.get("name", ""),
        "provider_organization": user.get("organization") or user.get("name", ""),
        "title": body.title,
        "category": body.category,
        "quantity": body.quantity,
        "unit": body.unit,
        "city": body.city,
        "pickup_location": body.pickup_location,
        "pickup_contact": body.pickup_contact,
        "expiry_date": body.expiry_date,
        "description": body.description,
        "status": "available",
        "created_at": now,
        "lat": lat,
        "lng": lng,
        "location_approximate": approx,
    }
    db["donations"].insert(0, new_donation)
    save_db(db)
    return new_donation

# ==================== REQUESTS ENDPOINTS ====================

class RequestCreatePayload(BaseModel):
    donation_id: str
    quantity: float
    message: str = ""

@app.post("/api/requests")
def create_food_request(body: RequestCreatePayload, user: Dict[str, Any] = Depends(require_current_user)):
    donation = next((d for d in db["donations"] if d["id"] == body.donation_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    req_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_req = {
        "id": req_id,
        "donation_id": body.donation_id,
        "recipient_id": user["id"],
        "recipient_name": user.get("name", ""),
        "recipient_organization": user.get("organization") or user.get("name", ""),
        "quantity": body.quantity,
        "unit": donation.get("unit", ""),
        "message": body.message,
        "status": "pending",
        "volunteer_id": None,
        "volunteer_name": None,
        "has_proof": False,
        "thank_you": "",
        "created_at": now,
        "updated_at": now,
    }
    db["food_requests"].insert(0, new_req)
    save_db(db)
    return format_food_request(new_req)

@app.get("/api/requests/mine")
def get_my_requests(user: Dict[str, Any] = Depends(require_current_user)):
    user_requests = [r for r in db["food_requests"] if r.get("recipient_id") == user["id"]]
    return [format_food_request(r) for r in user_requests]

@app.get("/api/requests/on-my-donations")
def get_requests_on_my_donations(user: Dict[str, Any] = Depends(require_current_user)):
    my_donation_ids = {d["id"] for d in db["donations"] if d.get("provider_id") == user["id"]}
    relevant_requests = [r for r in db["food_requests"] if r.get("donation_id") in my_donation_ids]
    return [format_food_request(r) for r in relevant_requests]

@app.get("/api/requests/{request_id}/tracking")
def get_request_tracking(request_id: str):
    req = next((r for r in db["food_requests"] if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    donation = next((d for d in db["donations"] if d["id"] == req["donation_id"]), None)
    pickup_lat = donation.get("lat") if donation else None
    pickup_lng = donation.get("lng") if donation else None

    # Check live volunteer tracking
    vol_id = req.get("volunteer_id")
    track = db.get("volunteer_tracking", {}).get(vol_id, {})
    vol_user = next((u for u in db["users"] if u["id"] == vol_id), None) if vol_id else None
    vol_phone = req.get("volunteer_phone") or (vol_user.get("phone") if vol_user else "")
    if not vol_phone and vol_id:
        vol_phone = "+91 98000 91000"
    
    return {
        "request_id": request_id,
        "status": req.get("status", ""),
        "volunteer_name": req.get("volunteer_name") or (vol_user.get("name") if vol_user else ""),
        "volunteer_phone": vol_phone,
        "sharing": track.get("sharing", False),
        "lat": track.get("lat", pickup_lat),
        "lng": track.get("lng", pickup_lng),
        "updated_at": track.get("updated_at") or req.get("updated_at"),
        "pickup_lat": pickup_lat,
        "pickup_lng": pickup_lng,
    }

@app.get("/api/requests/{request_id}/proof")
def get_request_proof(request_id: str):
    proof = next((p for p in db.get("delivery_proofs", []) if p.get("request_id") == request_id), None)
    if not proof or not proof.get("image"):
        raise HTTPException(status_code=404, detail="Proof photo not found")
    
    img_data = proof["image"]
    if "," in img_data:
        img_data = img_data.split(",", 1)[1]
    
    import base64
    raw_bytes = base64.b64decode(img_data)
    return Response(content=raw_bytes, media_type="image/jpeg")

# ==================== VOLUNTEER ENDPOINTS ====================

@app.get("/api/volunteer/pickups")
def get_volunteer_pickups(user: Dict[str, Any] = Depends(require_current_user)):
    pickups = [r for r in db["food_requests"] if r.get("status") in ["approved"]]
    return [format_food_request(r) for r in pickups]

@app.post("/api/volunteer/pickups/{request_id}/accept")
def accept_pickup(request_id: str, user: Dict[str, Any] = Depends(require_current_user)):
    req = next((r for r in db["food_requests"] if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    now = datetime.now(timezone.utc).isoformat()
    req["status"] = "assigned"
    req["volunteer_id"] = user["id"]
    req["volunteer_name"] = user.get("name", "Volunteer")
    req["volunteer_phone"] = user.get("phone") or "+91 98000 91000"
    req["updated_at"] = now
    save_db(db)
    return format_food_request(req)

@app.get("/api/volunteer/deliveries")
def get_volunteer_deliveries(user: Dict[str, Any] = Depends(require_current_user)):
    deliveries = [r for r in db["food_requests"] if r.get("volunteer_id") == user["id"]]
    return [format_food_request(r) for r in deliveries]

class DeliveryStatusPayload(BaseModel):
    status: str
    proof_photo: Optional[str] = None

@app.patch("/api/volunteer/deliveries/{delivery_id}")
def update_delivery_status(delivery_id: str, body: DeliveryStatusPayload, user: Dict[str, Any] = Depends(require_current_user)):
    req = next((r for r in db["food_requests"] if r["id"] == delivery_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Delivery request not found")

    now = datetime.now(timezone.utc).isoformat()
    req["status"] = body.status
    req["updated_at"] = now

    if body.proof_photo:
        req["has_proof"] = True
        if "delivery_proofs" not in db:
            db["delivery_proofs"] = []
        # Update or add proof
        proof = next((p for p in db["delivery_proofs"] if p.get("request_id") == delivery_id), None)
        if proof:
            proof["image"] = body.proof_photo
            proof["created_at"] = now
        else:
            db["delivery_proofs"].append({
                "request_id": delivery_id,
                "created_at": now,
                "image": body.proof_photo,
                "volunteer_id": user["id"]
            })

    if body.status == "delivered":
        donation = next((d for d in db["donations"] if d["id"] == req["donation_id"]), None)
        if donation:
            donation["status"] = "completed"

    save_db(db)
    return format_food_request(req)

class PositionPayload(BaseModel):
    lat: float
    lng: float
    sharing: bool = True

@app.patch("/api/volunteer/deliveries/{request_id}/position")
def update_delivery_position(request_id: str, body: PositionPayload, user: Dict[str, Any] = Depends(require_current_user)):
    if "volunteer_tracking" not in db:
        db["volunteer_tracking"] = {}

    now = datetime.now(timezone.utc).isoformat()
    db["volunteer_tracking"][user["id"]] = {
        "lat": body.lat,
        "lng": body.lng,
        "sharing": body.sharing,
        "updated_at": now
    }
    save_db(db)
    return get_request_tracking(request_id)

class LocationUpdatePayload(BaseModel):
    lat: float
    lng: float

@app.patch("/api/volunteer/location")
def update_volunteer_location(body: LocationUpdatePayload, user: Dict[str, Any] = Depends(require_current_user)):
    if "volunteer_tracking" not in db:
        db["volunteer_tracking"] = {}

    db["volunteer_tracking"][user["id"]] = {
        "lat": body.lat,
        "lng": body.lng,
        "sharing": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    save_db(db)

    active_count = len([
        r for r in db["food_requests"]
        if r.get("volunteer_id") == user["id"] and r.get("status") in ["assigned", "collected"]
    ])
    return {
        "id": user["id"],
        "name": user["name"],
        "city": user.get("city", "Bengaluru"),
        "transportation": user.get("transportation", "Two-Wheeler"),
        "availability": user.get("availability", "Available"),
        "lat": body.lat,
        "lng": body.lng,
        "approximate": False,
        "active_deliveries": active_count,
    }

@app.get("/api/map/volunteers")
def get_map_volunteers():
    volunteers = [u for u in db["users"] if u.get("role") == "volunteer"]
    pins = []
    for v in volunteers:
        t = db.get("volunteer_tracking", {}).get(v["id"], {})
        coords = CITY_COORDS.get(v.get("city", "Bengaluru"), [12.9716, 77.5946])
        lat = t.get("lat", coords[0] + 0.01)
        lng = t.get("lng", coords[1] + 0.01)

        active_count = len([
            r for r in db["food_requests"]
            if r.get("volunteer_id") == v["id"] and r.get("status") in ["assigned", "collected"]
        ])
        pins.append({
            "id": v["id"],
            "name": v["name"],
            "phone": v.get("phone") or "+91 98000 91000",
            "city": v.get("city", "Bengaluru"),
            "transportation": v.get("transportation", "Two-Wheeler"),
            "availability": v.get("availability", "Available"),
            "lat": lat,
            "lng": lng,
            "approximate": True,
            "active_deliveries": active_count,
        })
    return pins

# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/users")
def admin_get_users(admin: Dict[str, Any] = Depends(require_current_user)):
    return [user_to_public(u) for u in db["users"]]

@app.get("/api/admin/donations")
def admin_get_donations(admin: Dict[str, Any] = Depends(require_current_user)):
    return db["donations"]

@app.get("/api/admin/requests")
def admin_get_requests(admin: Dict[str, Any] = Depends(require_current_user)):
    return [format_food_request(r) for r in db["food_requests"]]

@app.get("/api/admin/stats")
def admin_get_stats(admin: Dict[str, Any] = Depends(require_current_user)):
    users = db["users"]
    donations = db["donations"]
    requests = db["food_requests"]

    category_counts: Dict[str, int] = {}
    for d in donations:
        cat = d.get("category", "Other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    city_counts: Dict[str, int] = {}
    for d in donations:
        c = d.get("city", "Other")
        city_counts[c] = city_counts.get(c, 0) + 1

    rescued_total = 0.0
    for r in requests:
        if r.get("status") == "delivered":
            rescued_total += float(r.get("quantity", 0))

    return {
        "total_users": len(users),
        "providers": len([u for u in users if u.get("role") == "provider"]),
        "recipients": len([u for u in users if u.get("role") == "recipient"]),
        "volunteers": len([u for u in users if u.get("role") == "volunteer"]),
        "total_donations": len(donations),
        "available_donations": len([d for d in donations if d.get("status") == "available"]),
        "completed_donations": len([d for d in donations if d.get("status") == "completed"]),
        "total_requests": len(requests),
        "pending_requests": len([r for r in requests if r.get("status") == "pending"]),
        "approved_requests": len([r for r in requests if r.get("status") in ["approved", "assigned", "collected"]]),
        "delivered_requests": len([r for r in requests if r.get("status") == "delivered"]),
        "rescued_quantity": rescued_total,
        "category_counts": [{"category": k, "count": v} for k, v in category_counts.items()],
        "city_counts": [{"city": k, "count": v} for k, v in city_counts.items()],
    }

@app.post("/api/admin/requests/{request_id}/{action}")
def admin_action_request(request_id: str, action: str, admin: Dict[str, Any] = Depends(require_current_user)):
    req = next((r for r in db["food_requests"] if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    now = datetime.now(timezone.utc).isoformat()
    if action == "approve":
        req["status"] = "approved"
        req["updated_at"] = now
        donation = next((d for d in db["donations"] if d["id"] == req["donation_id"]), None)
        if donation:
            donation["status"] = "claimed"
    elif action == "reject":
        req["status"] = "rejected"
        req["updated_at"] = now
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    save_db(db)
    return format_food_request(req)

@app.get("/api/admin/backup-full.json")
def admin_download_backup_json(admin: Dict[str, Any] = Depends(require_current_user)):
    backup_data = {
        "app": "foodlink",
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "collections": {
            "users": db.get("users", []),
            "donations": db.get("donations", []),
            "food_requests": db.get("food_requests", []),
            "delivery_proofs": db.get("delivery_proofs", [])
        }
    }
    return JSONResponse(
        content=backup_data,
        headers={"Content-Disposition": "attachment; filename=backup-full.json"}
    )

@app.get("/api/admin/backup.xlsx")
def admin_download_backup_excel(admin: Dict[str, Any] = Depends(require_current_user)):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        # Users sheet
        users_df = pd.DataFrame([user_to_public(u) for u in db.get("users", [])])
        users_df.to_excel(writer, sheet_name="Users", index=False)

        # Donations sheet
        donations_df = pd.DataFrame(db.get("donations", []))
        donations_df.to_excel(writer, sheet_name="Donations", index=False)

        # Requests sheet
        reqs_df = pd.DataFrame([format_food_request(r) for r in db.get("food_requests", [])])
        reqs_df.to_excel(writer, sheet_name="Requests", index=False)

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=backup.xlsx"}
    )

@app.post("/api/admin/restore")
async def admin_restore_backup(file: UploadFile = File(...), admin: Dict[str, Any] = Depends(require_current_user)):
    content = await file.read()
    data = json.loads(content.decode("utf-8"))
    collections = data.get("collections", {})

    users_added = 0
    users_updated = 0
    users_skipped = 0

    incoming_users = collections.get("users", [])
    for u in incoming_users:
        existing = next((x for x in db["users"] if x["id"] == u["id"]), None)
        if existing:
            existing.update(u)
            users_updated += 1
        else:
            email_exists = any(x["email"].lower() == u["email"].lower() for x in db["users"])
            if email_exists:
                users_skipped += 1
            else:
                db["users"].append(u)
                users_added += 1

    donations_added = 0
    donations_updated = 0
    for d in collections.get("donations", []):
        existing = next((x for x in db["donations"] if x["id"] == d["id"]), None)
        if existing:
            existing.update(d)
            donations_updated += 1
        else:
            db["donations"].append(d)
            donations_added += 1

    requests_added = 0
    requests_updated = 0
    for r in collections.get("food_requests", []):
        existing = next((x for x in db["food_requests"] if x["id"] == r["id"]), None)
        if existing:
            existing.update(r)
            requests_updated += 1
        else:
            db["food_requests"].append(r)
            requests_added += 1

    photos_restored = 0
    for p in collections.get("delivery_proofs", []):
        existing = next((x for x in db["delivery_proofs"] if x["request_id"] == p["request_id"]), None)
        if existing:
            existing.update(p)
        else:
            db["delivery_proofs"].append(p)
        photos_restored += 1

    save_db(db)

    return {
        "users_added": users_added,
        "users_updated": users_updated,
        "users_skipped": users_skipped,
        "donations_added": donations_added,
        "donations_updated": donations_updated,
        "requests_added": requests_added,
        "requests_updated": requests_updated,
        "photos_restored": photos_restored,
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
