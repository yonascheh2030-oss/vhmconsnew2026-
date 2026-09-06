from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import (
    FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File,
    Depends, Query, BackgroundTasks,
)
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId

from scoring import compute_lead_score, estimated_value
from storage import init_storage, put_object, get_object, APP_NAME, MIME_TYPES
from emailer import (
    send_new_lead_notification, send_customer_confirmation, send_custom_email, send_marketing_email,
)
from pdf import build_lead_pdf
import mailbox as mbx
from auth import (
    verify_password, create_access_token, decode_access_token, seed_admin,
)
from seed_data import seed_sample_leads

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="BetoDecor API")
api_router = APIRouter(prefix="/api")

MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "pdf"}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
VALID_STATUS = {"nieuw", "bezocht", "offerte_verzonden"}


# ----------------------------- Models -----------------------------
class FileRef(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str
    size: int = 0


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    project_types: List[str] = Field(default_factory=list)
    oppervlakte: Optional[int] = None
    verdiepingen: Optional[int] = None
    kamers: Optional[int] = None
    bouwjaar: Optional[int] = None
    bewoond: Optional[str] = None
    renovatie_type: Optional[str] = None
    works: List[str] = Field(default_factory=list)
    beschrijving: Optional[str] = Field(default=None, max_length=4000)
    budget: str = "unknown"
    starttermijn: str = "unknown"
    heeft_deadline: bool = False
    deadline: Optional[str] = None
    plaatsbezoek_datum: Optional[str] = None
    straat: Optional[str] = Field(default=None, max_length=200)
    huisnummer: Optional[str] = Field(default=None, max_length=30)
    postcode: Optional[str] = Field(default=None, max_length=20)
    gemeente: Optional[str] = Field(default=None, max_length=120)
    land: str = "België"
    files: List[FileRef] = Field(default_factory=list)
    voornaam: str = Field(min_length=1, max_length=100)
    achternaam: str = Field(min_length=1, max_length=100)
    telefoon: str = Field(min_length=5, max_length=40)
    email: EmailStr
    bedrijfsnaam: Optional[str] = Field(default=None, max_length=200)
    btw: Optional[str] = Field(default=None, max_length=40)
    opmerkingen: Optional[str] = Field(default=None, max_length=2000)
    lang: str = "nl"


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class StatusUpdate(BaseModel):
    status: str


class EmailSend(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=8000)


class Campaign(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=8000)
    cta_url: Optional[str] = None
    cta_label: Optional[str] = None
    lead_ids: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None


class InboxSend(BaseModel):
    from_account: str
    to: str = Field(min_length=3, max_length=500)
    cc: Optional[str] = Field(default=None, max_length=500)
    subject: str = Field(default="", max_length=300)
    body: str = Field(default="", max_length=20000)
    in_reply_to: Optional[str] = None
    references: Optional[str] = None


# ----------------------------- Auth dep -----------------------------
def _extract_token(request: Request, query_token: Optional[str] = None) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    if query_token:
        return query_token
    return request.cookies.get("access_token")


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_current_user(request: Request):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Niet ingelogd.")
    payload = decode_access_token(token)
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=401, detail="Gebruiker niet gevonden.")
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name"), "role": user.get("role", "admin")}


# ----------------------------- Public: health -----------------------------
@api_router.get("/")
async def root():
    return {"message": "BetoDecor API", "status": "online"}


# ----------------------------- Public: upload -----------------------------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "bestand"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Bestandstype niet toegestaan (jpg, png, webp, pdf).")
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Bestand te groot (max 15 MB).")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Leeg bestand.")
    fid = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{fid}.{ext}"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error("Upload naar opslag mislukt: %s", e)
        raise HTTPException(status_code=502, detail="Uploaden mislukt, probeer opnieuw.")
    return {
        "id": fid,
        "storage_path": result["path"],
        "original_filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
    }


# ----------------------------- Public: create lead -----------------------------
async def _log_email(lead_id, result, etype):
    if not result:
        return
    await db.emails.insert_one({
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "to": result.get("to"),
        "subject": result.get("subject"),
        "html": result.get("html"),
        "type": etype,
        "status": "verzonden" if result.get("ok") else "mislukt",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


async def _process_lead_emails(doc: dict):
    lead_id = doc.get("id")
    notif = await asyncio.to_thread(send_new_lead_notification, doc)
    await _log_email(lead_id, notif, "notification")
    conf = await asyncio.to_thread(send_customer_confirmation, doc)
    await _log_email(lead_id, conf, "confirmation")


@api_router.post("/leads", status_code=201)
async def create_lead(payload: LeadCreate, background_tasks: BackgroundTasks):
    if not payload.project_types:
        raise HTTPException(status_code=422, detail="Selecteer minstens één projecttype.")
    doc = payload.model_dump()
    scoring = compute_lead_score(doc)
    doc["id"] = str(uuid.uuid4())
    doc["score"] = scoring["score"]
    doc["category"] = scoring["category"]
    doc["score_breakdown"] = scoring["breakdown"]
    doc["geschatte_waarde"] = estimated_value(doc.get("budget"))
    doc["status"] = "nieuw"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.insert_one(dict(doc))
    doc.pop("_id", None)
    background_tasks.add_task(_process_lead_emails, doc)
    logger.info("Nieuwe lead %s — score %s (%s) — %s", doc["id"], doc["score"], doc["category"], doc.get("gemeente"))
    return {"id": doc["id"], "score": doc["score"], "category": doc["category"]}


# ----------------------------- Auth -----------------------------
@api_router.post("/auth/login")
async def login(payload: LoginInput, request: Request):
    email = payload.email.lower().strip()
    ip = _client_ip(request)
    identifier = f"{ip}:{email}"

    att = await db.login_attempts.find_one({"identifier": identifier})
    now = datetime.now(timezone.utc)
    if att and att.get("locked_until"):
        try:
            locked_until = datetime.fromisoformat(att["locked_until"])
            if now < locked_until:
                raise HTTPException(status_code=429, detail="Te veel pogingen. Probeer straks opnieuw.")
        except ValueError:
            pass

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        count = (att.get("count", 0) if att else 0) + 1
        update = {"identifier": identifier, "count": count, "updated_at": now.isoformat()}
        if count >= MAX_LOGIN_ATTEMPTS:
            from datetime import timedelta
            update["locked_until"] = (now + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Ongeldige inloggegevens.")

    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(str(user["_id"]), email)
    return {
        "token": token,
        "user": {"email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")},
    }


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ----------------------------- Admin: leads -----------------------------
def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.get("/admin/leads")
async def admin_list_leads(
    user=Depends(get_current_user),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    gemeente: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if gemeente:
        query["gemeente"] = {"$regex": f"^{gemeente}$", "$options": "i"}
    if project_type:
        query["project_types"] = project_type
    if q:
        query["$or"] = [
            {"voornaam": {"$regex": q, "$options": "i"}},
            {"achternaam": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"gemeente": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.leads.find(query).sort([("score", -1), ("created_at", -1)]).to_list(1000)
    return [_clean(d) for d in docs]


@api_router.get("/admin/stats")
async def admin_stats(user=Depends(get_current_user)):
    docs = await db.leads.find({}).to_list(2000)
    total = len(docs)
    by_cat = {"hot": 0, "high": 0, "normal": 0, "low": 0}
    by_status = {"nieuw": 0, "bezocht": 0, "offerte_verzonden": 0}
    per_gemeente = {}
    per_type = {}
    total_value = 0
    budgets = []
    for d in docs:
        by_cat[d.get("category", "low")] = by_cat.get(d.get("category", "low"), 0) + 1
        by_status[d.get("status", "nieuw")] = by_status.get(d.get("status", "nieuw"), 0) + 1
        g = d.get("gemeente") or "Onbekend"
        per_gemeente[g] = per_gemeente.get(g, 0) + 1
        for pt in (d.get("project_types") or []):
            per_type[pt] = per_type.get(pt, 0) + 1
        val = d.get("geschatte_waarde", 0) or 0
        total_value += val
        if val > 0:
            budgets.append(val)
    avg_budget = int(sum(budgets) / len(budgets)) if budgets else 0
    per_gemeente_sorted = sorted(per_gemeente.items(), key=lambda x: x[1], reverse=True)[:8]
    per_type_sorted = sorted(per_type.items(), key=lambda x: x[1], reverse=True)
    return {
        "total": total,
        "new": by_status.get("nieuw", 0),
        "by_category": by_cat,
        "by_status": by_status,
        "total_value": total_value,
        "avg_budget": avg_budget,
        "per_gemeente": [{"name": k, "count": v} for k, v in per_gemeente_sorted],
        "per_type": [{"name": k, "count": v} for k, v in per_type_sorted],
    }


@api_router.get("/admin/leads/{lead_id}")
async def admin_get_lead(lead_id: str, user=Depends(get_current_user)):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead niet gevonden.")
    return _clean(doc)


@api_router.patch("/admin/leads/{lead_id}/status")
async def admin_update_status(lead_id: str, payload: StatusUpdate, user=Depends(get_current_user)):
    if payload.status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail="Ongeldige status.")
    res = await db.leads.update_one({"id": lead_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead niet gevonden.")
    doc = await db.leads.find_one({"id": lead_id})
    return _clean(doc)


# ----------------------------- Protected file serving -----------------------------
@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request, token: Optional[str] = Query(None)):
    auth_token = _extract_token(request, token)
    if not auth_token:
        raise HTTPException(status_code=401, detail="Niet ingelogd.")
    payload = decode_access_token(auth_token)
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        user = None
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Niet gemachtigd.")
    record = await db.leads.find_one({"files.storage_path": path})
    if not record:
        raise HTTPException(status_code=404, detail="Bestand niet gevonden.")
    try:
        data, ctype = get_object(path)
    except Exception as e:
        logger.error("Bestand ophalen mislukt: %s", e)
        raise HTTPException(status_code=404, detail="Bestand niet gevonden.")
    return Response(content=data, media_type=ctype)


@api_router.get("/admin/leads/{lead_id}/pdf")
async def admin_lead_pdf(lead_id: str, user=Depends(get_current_user)):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead niet gevonden.")
    pdf_bytes = build_lead_pdf(doc)
    fn = f"BetoDecor-aanvraag-{(doc.get('achternaam') or 'lead')}.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{fn}"'})


@api_router.get("/admin/leads/{lead_id}/emails")
async def admin_lead_emails(lead_id: str, user=Depends(get_current_user)):
    docs = await db.emails.find({"lead_id": lead_id}).sort("created_at", -1).to_list(200)
    return [_clean(d) for d in docs]


@api_router.post("/admin/leads/{lead_id}/email")
async def admin_send_email(lead_id: str, payload: EmailSend, user=Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead niet gevonden.")
    result = await asyncio.to_thread(send_custom_email, lead.get("email"), payload.subject, payload.body)
    await _log_email(lead_id, result, "manual")
    if not result.get("ok"):
        raise HTTPException(status_code=502, detail="E-mail versturen mislukt. Controleer de SMTP-instellingen.")
    return {"ok": True}


@api_router.get("/admin/emails")
async def admin_all_emails(user=Depends(get_current_user), limit: int = Query(150)):
    docs = await db.emails.find({}).sort("created_at", -1).to_list(limit)
    return [_clean(d) for d in docs]


@api_router.post("/admin/campaign")
async def admin_campaign(payload: Campaign, user=Depends(get_current_user)):
    query = {}
    if payload.lead_ids:
        query = {"id": {"$in": payload.lead_ids}}
    else:
        if payload.category:
            query["category"] = payload.category
        if payload.status:
            query["status"] = payload.status
    leads = await db.leads.find(query).to_list(2000)
    seen, recipients = set(), []
    for l in leads:
        e = (l.get("email") or "").lower()
        if e and e not in seen:
            seen.add(e)
            recipients.append(l)
    sent = failed = 0
    for l in recipients:
        result = await asyncio.to_thread(send_marketing_email, l.get("email"), payload.subject, payload.body, payload.cta_url, payload.cta_label)
        await _log_email(l.get("id"), result, "campaign")
        if result.get("ok"):
            sent += 1
        else:
            failed += 1
    return {"recipients": len(recipients), "sent": sent, "failed": failed}


# ----------------------------- Admin: Inbox (IMAP/SMTP) -----------------------------
@api_router.get("/admin/mailboxes")
async def admin_mailboxes(user=Depends(get_current_user)):
    accounts = mbx.list_accounts()
    counts = await asyncio.to_thread(mbx.unread_counts) if mbx.configured() else {}
    for a in accounts:
        a["unread"] = counts.get(a["key"], 0)
    return {"configured": mbx.configured(), "accounts": accounts}


@api_router.get("/admin/inbox")
async def admin_inbox(
    user=Depends(get_current_user),
    account: str = Query("all"),
    folder: str = Query("INBOX"),
    limit: int = Query(30, le=100),
    offset: int = Query(0),
):
    if not mbx.configured():
        raise HTTPException(status_code=503, detail="Mailbox niet geconfigureerd.")
    keys = list(mbx.ACCOUNTS.keys()) if account == "all" else [account]
    keys = [k for k in keys if k in mbx.ACCOUNTS]
    if not keys:
        raise HTTPException(status_code=400, detail="Onbekend mailbox-account.")
    results = await asyncio.gather(*[
        asyncio.to_thread(mbx.fetch_messages, k, folder, limit, offset) for k in keys
    ], return_exceptions=True)
    messages = []
    for r in results:
        if isinstance(r, Exception):
            logger.error("Inbox ophalen mislukt: %s", r)
            continue
        messages.extend(r)
    messages.sort(key=lambda m: m.get("date") or "", reverse=True)
    return messages[:limit] if account == "all" else messages


@api_router.get("/admin/inbox/message")
async def admin_inbox_message(
    user=Depends(get_current_user),
    account: str = Query(...),
    uid: str = Query(...),
    folder: str = Query("INBOX"),
):
    if account not in mbx.ACCOUNTS:
        raise HTTPException(status_code=400, detail="Onbekend mailbox-account.")
    msg = await asyncio.to_thread(mbx.fetch_message, account, uid, folder, True)
    if not msg:
        raise HTTPException(status_code=404, detail="Bericht niet gevonden.")
    return msg


@api_router.get("/admin/inbox/attachment")
async def admin_inbox_attachment(
    request: Request,
    account: str = Query(...),
    uid: str = Query(...),
    folder: str = Query("INBOX"),
    index: int = Query(...),
    token: Optional[str] = Query(None),
):
    auth_token = _extract_token(request, token)
    if not auth_token:
        raise HTTPException(status_code=401, detail="Niet ingelogd.")
    payload = decode_access_token(auth_token)
    try:
        u = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        u = None
    if not u or u.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Niet gemachtigd.")
    if account not in mbx.ACCOUNTS:
        raise HTTPException(status_code=400, detail="Onbekend mailbox-account.")
    att = await asyncio.to_thread(mbx.fetch_attachment, account, uid, folder, index)
    if not att:
        raise HTTPException(status_code=404, detail="Bijlage niet gevonden.")
    return Response(content=att["data"], media_type=att["content_type"],
                    headers={"Content-Disposition": f'attachment; filename="{att["filename"]}"'})


@api_router.post("/admin/inbox/send")
async def admin_inbox_send(payload: InboxSend, user=Depends(get_current_user)):
    if payload.from_account not in mbx.ACCOUNTS:
        raise HTTPException(status_code=400, detail="Onbekend afzenderaccount.")
    if not payload.to.strip():
        raise HTTPException(status_code=422, detail="Vul een ontvanger in.")
    result = await asyncio.to_thread(
        mbx.send_message, payload.from_account, payload.to, payload.subject or "(geen onderwerp)",
        payload.body, payload.cc, payload.in_reply_to, payload.references,
    )
    if not result.get("ok"):
        raise HTTPException(status_code=502, detail=result.get("error") or "E-mail versturen mislukt.")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.leads.create_index("id")
        await db.leads.create_index("score")
    except Exception as e:
        logger.error("Index creatie: %s", e)
    try:
        await seed_admin(db)
    except Exception as e:
        logger.error("Admin seed: %s", e)
    try:
        init_storage()
        logger.info("Object storage geïnitialiseerd.")
    except Exception as e:
        logger.error("Storage init mislukt: %s", e)
    try:
        await seed_sample_leads(db)
    except Exception as e:
        logger.error("Sample leads seed: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
