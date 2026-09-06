"""VHM Renovation lead scoring engine (0-100).

Score = budget (30) + project type/size (25) + location (20) + timing (15) + completeness (10).
Intelligent caps prevent e.g. a huge budget far outside the work area from scoring HOT.
"""

# ---- Budget ----
BUDGET_POINTS = {
    "lt10k": 5,
    "10-25k": 10,
    "25-50k": 18,
    "50-100k": 24,
    "100-150k": 27,
    "150-250k": 29,
    "gt250k": 30,
    "unknown": 8,
}

BUDGET_VALUE = {
    "lt10k": 8000,
    "10-25k": 17500,
    "25-50k": 37500,
    "50-100k": 75000,
    "100-150k": 125000,
    "150-250k": 200000,
    "gt250k": 300000,
    "unknown": 0,
}

# ---- Timing ----
TIMING_POINTS = {
    "asap": 15,
    "1m": 15,
    "1-3m": 14,
    "3-6m": 10,
    "6-12m": 6,
    "later": 3,
    "unknown": 5,
}

# ---- Work area (configurable) ----
CORE_AREAS = {
    "sint-genesius-rode", "rhode-saint-genèse", "rhode-saint-genese", "linkebeek",
    "drogenbos", "beersel", "alsemberg", "huizingen", "dworp", "ukkel", "uccle",
}
NEAR_AREAS = {
    "brussel", "bruxelles", "brussels", "vorst", "forest", "sint-gillis", "saint-gilles",
    "elsene", "ixelles", "watermaal-bosvoorde", "watermael-boitsfort", "oudergem", "auderghem",
    "waterloo", "eigenbrakel", "braine-l'alleud", "halle", "hoeilaart", "overijse",
    "la hulpe", "terhulpen", "sint-pieters-leeuw", "lot", "buizingen", "tervuren",
}

CORE_POSTCODES = {"1640", "1630", "1620", "1650", "1180", "1428", "1470"}
CORE_POSTCODES_INT = {int(p) for p in CORE_POSTCODES}
BRUSSELS_POSTCODES = range(1000, 1300)
VL_BRABANT_POSTCODES = list(range(1300, 2000)) + list(range(3000, 3500))


def _norm(s):
    return (s or "").strip().lower()


def location_score(gemeente, postcode):
    g = _norm(gemeente)
    pc = _norm(postcode)
    pc_int = None
    try:
        pc_int = int(pc[:4]) if pc[:4].isdigit() else None
    except Exception:
        pc_int = None

    if g in CORE_AREAS or pc in CORE_POSTCODES:
        return 20, "core"
    if g in NEAR_AREAS:
        return 15, "near"
    if pc_int is not None:
        if pc_int in CORE_POSTCODES_INT:
            return 20, "core"
        if pc_int in BRUSSELS_POSTCODES:
            return 15, "near"
        if pc_int in VL_BRABANT_POSTCODES:
            return 8, "edge"
        return 0, "outside"
    # Unknown gemeente, no usable postcode -> treat as edge (benefit of the doubt within Belgium)
    if g:
        return 8, "edge"
    return 5, "unknown"


def project_score(project_types, renovatie_type, works, oppervlakte):
    types = set(project_types or [])
    works = works or []
    n_works = len(works)
    full = renovatie_type == "volledig"

    if ("woning" in types or "bedrijfspand" in types) and full:
        base = 25
    elif "woning" in types or "bedrijfspand" in types:
        base = 20
    elif "nieuwbouw" in types:
        base = 23
    elif ("handelsruimte" in types or "kantoor" in types) and full:
        base = 21
    elif "handelsruimte" in types or "kantoor" in types:
        base = 18
    elif "appartement" in types and full:
        base = 20
    elif "appartement" in types:
        base = 16
    else:
        base = 10

    if n_works >= 6:
        base += 4
    elif n_works >= 3:
        base += 2

    try:
        opp = int(oppervlakte) if oppervlakte else 0
    except (TypeError, ValueError):
        opp = 0
    if opp >= 200:
        base += 3
    elif opp >= 120:
        base += 1

    return min(base, 25)


def completeness_score(lead):
    pts = 0.0
    if lead.get("beschrijving") and len(str(lead["beschrijving"]).strip()) >= 30:
        pts += 2
    if lead.get("oppervlakte"):
        pts += 1.5
    if lead.get("budget") and lead["budget"] != "unknown":
        pts += 1.5
    if lead.get("starttermijn") and lead["starttermijn"] != "unknown":
        pts += 1.5
    if lead.get("files"):
        pts += 2
    if all(lead.get(k) for k in ("voornaam", "achternaam", "telefoon", "email")):
        pts += 1.5
    return min(round(pts), 10)


def category_for(score):
    if score >= 90:
        return "hot"
    if score >= 75:
        return "high"
    if score >= 50:
        return "normal"
    return "low"


def compute_lead_score(lead):
    budget_pts = BUDGET_POINTS.get(lead.get("budget", "unknown"), 8)
    proj_pts = project_score(
        lead.get("project_types"), lead.get("renovatie_type"),
        lead.get("works"), lead.get("oppervlakte"),
    )
    loc_pts, loc_class = location_score(lead.get("gemeente"), lead.get("postcode"))
    timing_pts = TIMING_POINTS.get(lead.get("starttermijn", "unknown"), 5)
    complete_pts = completeness_score(lead)

    raw = budget_pts + proj_pts + loc_pts + timing_pts + complete_pts

    # Intelligent caps
    capped = raw
    if loc_class == "outside":
        capped = min(capped, 75)
    if loc_class == "edge":
        capped = min(capped, 88)
    if lead.get("budget", "unknown") == "unknown":
        capped = min(capped, 84)

    score = max(0, min(100, int(round(capped))))
    return {
        "score": score,
        "category": category_for(score),
        "breakdown": {
            "budget": budget_pts,
            "project": proj_pts,
            "location": loc_pts,
            "location_class": loc_class,
            "timing": timing_pts,
            "completeness": complete_pts,
            "raw": raw,
        },
    }


def estimated_value(budget_key):
    return BUDGET_VALUE.get(budget_key or "unknown", 0)
