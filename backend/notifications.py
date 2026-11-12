import os
import smtplib
import threading
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any, Optional

# SMTP Configuration from Environment Variables (optional)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "FoodLink Dispatch <noreply@foodlink.org>")
SMTP_TLS = os.environ.get("SMTP_TLS", "true").lower() in ["true", "1", "yes"]

BASE_WEB_URL = os.environ.get("FRONTEND_URL", "https://surplus-to-share.vercel.app")


def _send_email_worker(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: str,
    event_type: str,
    metadata: Dict[str, Any],
    db_ref: Optional[Dict[str, Any]] = None,
    save_fn: Optional[Any] = None,
):
    """Background worker that attempts real SMTP send if configured, and logs to db."""
    timestamp = datetime.now(timezone.utc).isoformat()
    status = "logged"
    error_msg = None

    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD and to_emails:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = ", ".join(to_emails)

            part1 = MIMEText(text_body, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            if SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15)
            else:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
                if SMTP_TLS:
                    server.starttls()

            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_emails, msg.as_string())
            server.quit()
            status = "sent"
            print(f"[Email Notification] Successfully sent '{subject}' to {to_emails}")
        except Exception as e:
            status = "failed"
            error_msg = str(e)
            print(f"[Email Notification] SMTP Error sending to {to_emails}: {e}")
    else:
        # In demo or when SMTP not set: recorded and logged
        print(f"[Email Notification Logged] Event: {event_type} | To: {to_emails} | Subject: {subject}")

    # Record notification in database audit log
    if db_ref is not None:
        if "email_notifications" not in db_ref:
            db_ref["email_notifications"] = []
        
        record = {
            "id": f"notif-{len(db_ref['email_notifications']) + 1}",
            "event_type": event_type,
            "to_emails": to_emails,
            "subject": subject,
            "status": status,
            "error": error_msg,
            "created_at": timestamp,
            "metadata": metadata,
        }
        db_ref["email_notifications"].append(record)
        if save_fn:
            try:
                save_fn(db_ref)
            except Exception as e:
                print(f"[Email Notification] Failed to persist log: {e}")


def dispatch_notification_async(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: str,
    event_type: str,
    metadata: Dict[str, Any],
    db_ref: Optional[Dict[str, Any]] = None,
    save_fn: Optional[Any] = None,
):
    """Spawns non-blocking daemon thread to deliver email."""
    if not to_emails:
        return
    thread = threading.Thread(
        target=_send_email_worker,
        args=(to_emails, subject, html_body, text_body, event_type, metadata, db_ref, save_fn),
        daemon=True,
    )
    thread.start()


# =========================================================================
# 1. TRIGGER: NEW SURPLUS ADDED -> NOTIFY NEARBY RECIPIENT NGOS
# =========================================================================

def notify_nearby_ngos_new_surplus(donation: Dict[str, Any], users: List[Dict[str, Any]], db_ref: Dict[str, Any], save_fn: Any):
    city = donation.get("city", "India")
    city_lower = city.strip().lower()

    # Find recipient NGOs in the same city (or all if none in city)
    city_ngos = [
        u["email"] for u in users
        if u.get("role") == "recipient" and u.get("email") and u.get("city", "").strip().lower() == city_lower
    ]
    all_ngos = [
        u["email"] for u in users
        if u.get("role") == "recipient" and u.get("email")
    ]
    target_emails = city_ngos if city_ngos else all_ngos

    # If no registered NGOs exist yet, notify admin dispatch so it can be routed
    if not target_emails:
        admin_emails = [u["email"] for u in users if u.get("role") == "admin" and u.get("email")]
        target_emails = admin_emails or ["admin@foodlink.org"]

    title = donation.get("title", "Fresh Surplus Food")
    quantity = donation.get("quantity", "")
    unit = donation.get("unit", "meals")
    provider = donation.get("provider_name", "Local Food Donor")
    location = donation.get("pickup_location", city)
    expiry = donation.get("expiry_date", "Today")

    subject = f"🍲 New Surplus Food Available in {city}: {title} ({quantity} {unit})"

    text_body = f"""
Hello NGO Partner,

A new surplus food donation is available in {city}:
- Title: {title}
- Quantity: {quantity} {unit}
- Donor: {provider}
- Pickup Location: {location}
- Expiry / SLA: {expiry}

Log in to FoodLink to claim meals for your shelter or community kitchen:
{BASE_WEB_URL}/explore

Best regards,
FoodLink Dispatch Network
"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px; text-align: center; color: #ffffff; }}
    .content {{ padding: 28px; color: #1e293b; line-height: 1.6; }}
    .badge {{ display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0; margin-bottom: 8px; }}
    .table {{ width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; }}
    .table td {{ padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
    .table td.label {{ color: #64748b; font-weight: 600; width: 38%; }}
    .table td.value {{ color: #0f172a; font-weight: 700; }}
    .button {{ display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 14px; }}
    .footer {{ padding: 20px 28px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">FoodLink Surplus Alert</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Rapid Food Rescue Network &bull; {city}</p>
    </div>
    <div class="content">
      <span class="badge">Immediate Claim Available</span>
      <h2 style="margin: 6px 0 14px 0; font-size: 18px; color: #0f172a;">{title}</h2>
      <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
        A verified food donor just posted untouched surplus meals in <strong>{city}</strong>. Review the details below and request meals for your beneficiaries:
      </p>

      <table class="table">
        <tr><td class="label">Total Quantity:</td><td class="value">{quantity} {unit}</td></tr>
        <tr><td class="label">Food Donor:</td><td class="value">{provider}</td></tr>
        <tr><td class="label">Category:</td><td class="value">{donation.get("category", "Cooked Meals")}</td></tr>
        <tr><td class="label">Pickup Location:</td><td class="value">{location}</td></tr>
        <tr><td class="label">Best Before:</td><td class="value">{expiry}</td></tr>
      </table>

      <div style="text-align: center;">
        <a href="{BASE_WEB_URL}/explore" class="button">View & Claim on FoodLink &rarr;</a>
      </div>
    </div>
    <div class="footer">
      FoodLink Surplus-to-Share &bull; FSSAI Compliant Thermal Chain &bull; Toll-Free Hotline: +91 98000 91000
    </div>
  </div>
</body>
</html>
"""

    dispatch_notification_async(
        to_emails=target_emails,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        event_type="donation_created",
        metadata={
            "donation_id": donation.get("id"),
            "city": city,
            "quantity": quantity,
            "unit": unit,
        },
        db_ref=db_ref,
        save_fn=save_fn,
    )


# =========================================================================
# 2. TRIGGER: NGO ACCEPTS / REQUESTS -> NOTIFY NEARBY VOLUNTEERS
# =========================================================================

def notify_volunteers_ngo_requested(
    food_request: Dict[str, Any],
    donation: Dict[str, Any],
    users: List[Dict[str, Any]],
    db_ref: Dict[str, Any],
    save_fn: Any,
):
    city = donation.get("city", "India")
    city_lower = city.strip().lower()

    # Find volunteers in the same city (or all volunteers)
    city_vols = [
        u["email"] for u in users
        if u.get("role") == "volunteer" and u.get("email") and u.get("city", "").strip().lower() == city_lower
    ]
    all_vols = [
        u["email"] for u in users
        if u.get("role") == "volunteer" and u.get("email")
    ]
    target_emails = city_vols if city_vols else all_vols

    # If no registered volunteers yet, notify admin dispatch
    if not target_emails:
        admin_emails = [u["email"] for u in users if u.get("role") == "admin" and u.get("email")]
        target_emails = admin_emails or ["admin@foodlink.org"]

    ngo_name = food_request.get("recipient_organization") or food_request.get("recipient_name", "Partner Shelter")
    quantity = food_request.get("quantity", donation.get("quantity", ""))
    unit = food_request.get("unit", donation.get("unit", "meals"))
    provider = donation.get("provider_name", "Food Donor")
    pickup = donation.get("pickup_location", city)

    subject = f"🚴 New Delivery Mission in {city}: {quantity} {unit} for {ngo_name}"

    text_body = f"""
Hello Volunteer Courier,

A new urgent food rescue mission is ready in {city}:
- Beneficiary NGO: {ngo_name}
- Requested Quantity: {quantity} {unit}
- Pickup From: {provider} ({pickup})
- Contact: {donation.get("pickup_contact", "+91 98000 91000")}

Open the Volunteer Workspace on FoodLink to accept this mission and start pickup:
{BASE_WEB_URL}/volunteer

Thank you for rescuing food and feeding families!
FoodLink Dispatch Network
"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px; text-align: center; color: #ffffff; }}
    .content {{ padding: 28px; color: #1e293b; line-height: 1.6; }}
    .badge {{ display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #bae6fd; margin-bottom: 8px; }}
    .table {{ width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; }}
    .table td {{ padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
    .table td.label {{ color: #64748b; font-weight: 600; width: 38%; }}
    .table td.value {{ color: #0f172a; font-weight: 700; }}
    .button {{ display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 14px; }}
    .footer {{ padding: 20px 28px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">🚴 New Delivery Mission!</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Urgent Courier Dispatch &bull; {city}</p>
    </div>
    <div class="content">
      <span class="badge">NGO Accepted &bull; Ready for Pickup</span>
      <h2 style="margin: 6px 0 14px 0; font-size: 18px; color: #0f172a;">{ngo_name} requested meals</h2>
      <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
        A verified NGO has claimed surplus food and needs a volunteer courier to pick up and deliver the packages:
      </p>

      <table class="table">
        <tr><td class="label">Destination Shelter:</td><td class="value">{ngo_name}</td></tr>
        <tr><td class="label">Quantity:</td><td class="value">{quantity} {unit}</td></tr>
        <tr><td class="label">Pickup Location:</td><td class="value">{pickup}</td></tr>
        <tr><td class="label">Donor:</td><td class="value">{provider}</td></tr>
        <tr><td class="label">Donor Contact:</td><td class="value">{donation.get("pickup_contact", "+91 98000 91000")}</td></tr>
      </table>

      <div style="text-align: center;">
        <a href="{BASE_WEB_URL}/volunteer" class="button">Accept Delivery Run on FoodLink &rarr;</a>
      </div>
    </div>
    <div class="footer">
      FoodLink Volunteer Fleet &bull; Live GPS Tracking &bull; Hotline: +91 98000 91000
    </div>
  </div>
</body>
</html>
"""

    dispatch_notification_async(
        to_emails=target_emails,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        event_type="ngo_accepted",
        metadata={
            "request_id": food_request.get("id"),
            "donation_id": donation.get("id"),
            "ngo_name": ngo_name,
            "quantity": quantity,
        },
        db_ref=db_ref,
        save_fn=save_fn,
    )


# =========================================================================
# 3. TRIGGER: FOOD IS DELIVERED -> NOTIFY ADMIN
# =========================================================================

def notify_admin_food_delivered(
    food_request: Dict[str, Any],
    donation: Dict[str, Any],
    users: List[Dict[str, Any]],
    db_ref: Dict[str, Any],
    save_fn: Any,
):
    admin_emails = [
        u["email"] for u in users
        if u.get("role") == "admin" and u.get("email")
    ]
    target_emails = admin_emails if admin_emails else ["admin@foodlink.org"]

    ngo_name = food_request.get("recipient_organization") or food_request.get("recipient_name", "Shelter Partner")
    volunteer = food_request.get("volunteer_name", "Volunteer Courier")
    quantity = food_request.get("quantity", donation.get("quantity", ""))
    unit = food_request.get("unit", donation.get("unit", "meals"))
    title = donation.get("title", "Surplus Donation")
    city = donation.get("city", "India")
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")

    subject = f"✅ Mission Complete: {quantity} {unit} successfully delivered to {ngo_name}"

    text_body = f"""
Hello Administrator,

A food rescue mission has been successfully completed:
- Food Item: {title}
- Delivered Quantity: {quantity} {unit}
- Delivered To: {ngo_name} ({city})
- Courier: {volunteer}
- Completed At: {now_str}
- Photo Proof: {"Verified / Uploaded" if food_request.get("has_proof") else "Logged"}

Review full audit metrics in the Admin Dashboard:
{BASE_WEB_URL}/admin

FoodLink Operations Management
"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px; text-align: center; color: #ffffff; }}
    .content {{ padding: 28px; color: #1e293b; line-height: 1.6; }}
    .badge {{ display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #86efac; margin-bottom: 8px; }}
    .table {{ width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; }}
    .table td {{ padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
    .table td.label {{ color: #64748b; font-weight: 600; width: 38%; }}
    .table td.value {{ color: #0f172a; font-weight: 700; }}
    .button {{ display: inline-block; background: #15803d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 14px; }}
    .footer {{ padding: 20px 28px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">✅ Delivery Completed</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Audit & ESG Impact Logged &bull; {city}</p>
    </div>
    <div class="content">
      <span class="badge">Mission Accomplished</span>
      <h2 style="margin: 6px 0 14px 0; font-size: 18px; color: #0f172a;">{quantity} {unit} safely handed over</h2>
      <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
        Volunteer courier <strong>{volunteer}</strong> has delivered the banquet surplus to <strong>{ngo_name}</strong>. Impact metrics and carbon offsets have been updated:
      </p>

      <table class="table">
        <tr><td class="label">Listing:</td><td class="value">{title}</td></tr>
        <tr><td class="label">Quantity Rescued:</td><td class="value">{quantity} {unit}</td></tr>
        <tr><td class="label">Recipient Shelter:</td><td class="value">{ngo_name}</td></tr>
        <tr><td class="label">Courier:</td><td class="value">{volunteer}</td></tr>
        <tr><td class="label">City Hub:</td><td class="value">{city}</td></tr>
        <tr><td class="label">Delivered At:</td><td class="value">{now_str}</td></tr>
        <tr><td class="label">Proof Status:</td><td class="value">{"Photo Uploaded & Verified" if food_request.get("has_proof") else "Digital Sign-Off"}</td></tr>
      </table>

      <div style="text-align: center;">
        <a href="{BASE_WEB_URL}/admin" class="button">Open Admin Compliance Panel &rarr;</a>
      </div>
    </div>
    <div class="footer">
      FoodLink Operations &bull; Real-time Audit Trail &bull; FSSAI Standard
    </div>
  </div>
</body>
</html>
"""

    dispatch_notification_async(
        to_emails=target_emails,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        event_type="delivery_completed",
        metadata={
            "request_id": food_request.get("id"),
            "donation_id": donation.get("id"),
            "quantity": quantity,
            "ngo_name": ngo_name,
            "courier": volunteer,
        },
        db_ref=db_ref,
        save_fn=save_fn,
    )
