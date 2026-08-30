"""Dutch label maps for backend PDF/email rendering (keys match scoring.py / frontend)."""

PROJECT_TYPES = {
    "woning": "Volledige woning", "appartement": "Appartement", "bedrijfspand": "Bedrijfspand",
    "kantoor": "Kantoor", "handelsruimte": "Handelsruimte", "badkamer": "Badkamer",
    "keuken": "Keuken", "andere": "Andere renovatie",
}
RENO_TYPE = {"volledig": "Volledige renovatie", "gedeeltelijk": "Gedeeltelijke renovatie", "onzeker": "Nog niet zeker"}
BEWOOND = {"ja": "Ja", "nee": "Nee", "onbekend": "Onbekend"}
WORKS = {
    "afbraak": "Afbraakwerken", "ruwbouw": "Ruwbouw", "muren-verwijderen": "Muren verwijderen", "nieuwe-indeling": "Nieuwe indeling",
    "elektriciteit": "Elektriciteit", "sanitair": "Sanitair", "verwarming": "Verwarming", "ventilatie": "Ventilatie", "waterleidingen": "Waterleidingen",
    "badkamer": "Badkamer", "keuken": "Keuken", "vloeren": "Vloeren", "tegelwerken": "Tegelwerken", "pleisterwerken": "Pleisterwerken", "gyproc": "Gyproc", "schilderwerken": "Schilderwerken", "deuren": "Deuren", "afwerking": "Volledige afwerking",
    "gevel": "Gevel", "dak": "Dak", "isolatie": "Isolatie", "andere-werk": "Andere",
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
