"""Seed realistic sample painting/finishing leads so the dashboard is testable in dev."""
import uuid
from datetime import datetime, timezone, timedelta

from scoring import compute_lead_score, estimated_value

_SAMPLES = [
    {
        "project_types": ["woning"], "oppervlakte": 160, "verdiepingen": 2, "kamers": 6,
        "bouwjaar": 1972, "bewoond": "nee", "renovatie_type": "volledig",
        "works": ["binnen", "plafonds", "plamuren", "herstellingen", "vloerbekleding"],
        "beschrijving": "Volledige woning binnen schilderen (muren + plafonds), muren plamuren en herstellen, en nieuwe vloerbekleding plaatsen voor intrek.",
        "budget": "25-50k", "starttermijn": "1m", "heeft_deadline": True, "deadline": "2026-08-15",
        "straat": "Waterloosesteenweg", "huisnummer": "88", "postcode": "1640", "gemeente": "Sint-Genesius-Rode", "land": "België",
        "voornaam": "Sophie", "achternaam": "Delvaux", "telefoon": "+32 476 12 34 56", "email": "sophie.delvaux@example.com",
        "opmerkingen": "Graag afspraak in de voormiddag.", "lang": "nl", "status": "nieuw", "days_ago": 0,
    },
    {
        "project_types": ["handelsruimte"], "oppervlakte": 220, "verdiepingen": 2, "kamers": 8,
        "bouwjaar": 1990, "bewoond": "nee", "renovatie_type": "volledig",
        "works": ["binnen", "buiten", "gyproc", "plamuren", "vloerbekleding", "reinigen"],
        "beschrijving": "Handelsruimte volledig opfrissen voor nieuwe huurder: gyproc-wanden, plamuren, schilderwerk binnen en buiten en vloerbekleding.",
        "budget": "50-100k", "starttermijn": "asap", "heeft_deadline": True, "deadline": "2026-07-30",
        "straat": "Chaussée de Bruxelles", "huisnummer": "150", "postcode": "1410", "gemeente": "Waterloo", "land": "België",
        "voornaam": "Marc", "achternaam": "Lambert", "telefoon": "+32 470 99 88 77", "email": "marc@lambert-invest.be",
        "bedrijfsnaam": "Lambert Invest SRL", "btw": "BE0777.888.999", "lang": "fr", "status": "nieuw", "days_ago": 1,
    },
    {
        "project_types": ["appartement"], "oppervlakte": 95, "verdiepingen": 1, "kamers": 4,
        "bouwjaar": 2004, "bewoond": "ja", "renovatie_type": "volledig",
        "works": ["binnen", "plafonds", "behang", "vloerbekleding"],
        "beschrijving": "Appartement volledig opfrissen: alle muren en plafonds schilderen, behang in de slaapkamer en nieuwe vloerbekleding.",
        "budget": "25-50k", "starttermijn": "1-3m", "heeft_deadline": False, "deadline": None,
        "straat": "Avenue Brugmann", "huisnummer": "210", "postcode": "1180", "gemeente": "Ukkel", "land": "België",
        "voornaam": "Marie", "achternaam": "Dubois", "telefoon": "+32 478 55 44 33", "email": "marie.dubois@example.com",
        "lang": "fr", "status": "bezocht", "days_ago": 3,
    },
    {
        "project_types": ["woning"], "oppervlakte": 130, "verdiepingen": 2, "kamers": 5,
        "bouwjaar": 1985, "bewoond": "ja", "renovatie_type": "gedeeltelijk",
        "works": ["buiten", "herstellingen"],
        "beschrijving": "Gevel en houtwerk buiten schilderen en enkele scheuren herstellen.",
        "budget": "10-25k", "starttermijn": "3-6m", "heeft_deadline": False, "deadline": None,
        "straat": "Gemeentehuisstraat", "huisnummer": "12", "postcode": "1630", "gemeente": "Linkebeek", "land": "België",
        "voornaam": "Jan", "achternaam": "Willems", "telefoon": "+32 471 22 33 44", "email": "jan.willems@example.com",
        "lang": "nl", "status": "nieuw", "days_ago": 4,
    },
    {
        "project_types": ["woning"], "oppervlakte": 175, "verdiepingen": 2, "kamers": 7,
        "bouwjaar": 1968, "bewoond": "nee", "renovatie_type": "volledig",
        "works": ["binnen", "buiten", "gyproc", "plamuren", "herstellingen", "vloerbekleding", "reinigen"],
        "beschrijving": "Volledige afwerking van een gerenoveerde woning: gyproc, plamuren, binnen- en buitenschilderwerk en vloerbekleding.",
        "budget": "50-100k", "starttermijn": "1-3m", "heeft_deadline": True, "deadline": "2026-10-01",
        "straat": "Basiliekstraat", "huisnummer": "24", "postcode": "1500", "gemeente": "Halle", "land": "België",
        "voornaam": "Peter", "achternaam": "Maes", "telefoon": "+32 472 11 22 33", "email": "peter.maes@example.com",
        "lang": "nl", "status": "nieuw", "days_ago": 2,
    },
    {
        "project_types": ["appartement"], "oppervlakte": 70, "verdiepingen": 1, "kamers": 3,
        "bouwjaar": 2012, "bewoond": "ja", "renovatie_type": "gedeeltelijk",
        "works": ["binnen", "plafonds"],
        "beschrijving": "Living en gang schilderen (muren en plafond).",
        "budget": "lt10k", "starttermijn": "6-12m", "heeft_deadline": False, "deadline": None,
        "straat": "Calle de Alcalá", "huisnummer": "44", "postcode": "1650", "gemeente": "Beersel", "land": "België",
        "voornaam": "Elena", "achternaam": "García", "telefoon": "+32 479 66 55 44", "email": "elena.garcia@example.com",
        "lang": "es", "status": "nieuw", "days_ago": 6,
    },
    {
        "project_types": ["kantoor"], "oppervlakte": 90, "verdiepingen": 1, "kamers": 4,
        "bouwjaar": 2000, "bewoond": "nee", "renovatie_type": "gedeeltelijk",
        "works": ["binnen", "plafonds", "vloerbekleding"],
        "beschrijving": "Kantoorruimte opfrissen — buiten onze regio (kust).",
        "budget": "25-50k", "starttermijn": "1-3m", "heeft_deadline": False, "deadline": None,
        "straat": "Zeedijk", "huisnummer": "3", "postcode": "8400", "gemeente": "Oostende", "land": "België",
        "voornaam": "Tom", "achternaam": "Claes", "telefoon": "+32 473 44 55 66", "email": "tom.claes@example.com",
        "lang": "nl", "status": "offerte_verzonden", "days_ago": 8,
    },
]


async def seed_sample_leads(db):
    count = await db.leads.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc)
    docs = []
    for s in _SAMPLES:
        days_ago = s.pop("days_ago", 0)
        s.setdefault("files", [])
        scoring = compute_lead_score(s)
        doc = {
            **s,
            "id": str(uuid.uuid4()),
            "score": scoring["score"],
            "category": scoring["category"],
            "score_breakdown": scoring["breakdown"],
            "geschatte_waarde": estimated_value(s.get("budget")),
            "created_at": (now - timedelta(days=days_ago, hours=days_ago)).isoformat(),
        }
        docs.append(doc)
    if docs:
        await db.leads.insert_many(docs)
