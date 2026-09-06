"""Dutch label maps for backend PDF/email rendering (keys match scoring.py / frontend)."""

PROJECT_TYPES = {
    "woning": "Woning", "appartement": "Appartement", "nieuwbouw": "Nieuwbouw",
    "handelsruimte": "Handels-/bedrijfsruimte", "kantoor": "Kantoor", "andere": "Andere",
}
RENO_TYPE = {"volledig": "Volledig pand", "gedeeltelijk": "Enkele ruimtes", "onzeker": "Nog niet zeker"}
BEWOOND = {"ja": "Ja", "nee": "Nee", "onbekend": "Onbekend"}
WORKS = {
    "binnen": "Binnenschilderwerk", "buiten": "Buitenschilderwerk & gevel", "plafonds": "Plafonds", "behang": "Behangwerk",
    "gyproc": "Gyproc-wanden plaatsen", "plamuren": "Plamuren & schuren", "herstellingen": "Herstellen scheuren & gaten", "vloerbekleding": "Vloerbekleding plaatsen",
    "reinigen": "Reinigen & ontvetten", "afplakken": "Afplakken & afdekken", "schuren": "Schuren & voorstrijken",
}
BUDGET = {
    "lt10k": "< €10.000", "10-25k": "€10.000–€25.000", "25-50k": "€25.000–€50.000",
    "50-100k": "€50.000–€100.000", "100-150k": "€100.000–€150.000",
    "150-250k": "€150.000–€250.000", "gt250k": "> €250.000", "unknown": "Nog niet bepaald",
}
TIMING = {
    "asap": "Zo snel mogelijk", "1m": "Binnen 1 maand", "1-3m": "Binnen 1–3 maanden",
    "3-6m": "Binnen 3–6 maanden", "6-12m": "Binnen 6–12 maanden", "later": "Later", "unknown": "Nog niet bepaald",
}
CATEGORY = {"hot": "HOT LEAD", "high": "HIGH PRIORITY", "normal": "NORMAAL", "low": "LAGE PRIORITEIT"}


def project_types_label(keys):
    return ", ".join(PROJECT_TYPES.get(k, k) for k in (keys or [])) or "—"


def works_label(keys):
    return ", ".join(WORKS.get(k, k) for k in (keys or [])) or "—"
