"""Generate a clean PDF summary of a renovation lead (reportlab)."""
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from labels_nl import (
    PROJECT_TYPES, RENO_TYPE, BEWOOND, BUDGET, TIMING, CATEGORY,
    project_types_label, works_label,
)

PRIMARY = colors.HexColor("#1E5AA8")
INK = colors.HexColor("#0F2137")
MUTED = colors.HexColor("#78716C")
LINE = colors.HexColor("#E7E5E4")
DASH = colors.HexColor("#F5F5F4")


def _eur(n):
    try:
        return "€ {:,.0f}".format(n or 0).replace(",", ".")
    except Exception:
        return "€ 0"


def _fmt_date(iso):
    try:
        from datetime import datetime
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception:
        return iso or "—"


def _info_table(rows, styles):
    data = [[Paragraph(f"<font color='#78716C'>{k}</font>", styles["cell"]), Paragraph(str(v) if v not in (None, "") else "—", styles["cellb"])] for k, v in rows]
    t = Table(data, colWidths=[55 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def build_lead_pdf(lead: dict) -> bytes:
    buf = io.BytesIO()
    naam = f"{lead.get('voornaam','')} {lead.get('achternaam','')}".strip()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm, title=f"Offerteaanvraag {naam}",
    )
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle("h1", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=22, textColor=INK, leading=26),
        "tag": ParagraphStyle("tag", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=PRIMARY, leading=12),
        "h2": ParagraphStyle("h2", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=13, textColor=INK, leading=18, spaceBefore=6, spaceAfter=6),
        "cell": ParagraphStyle("cell", parent=base["Normal"], fontName="Helvetica", fontSize=10, textColor=MUTED, leading=13),
        "cellb": ParagraphStyle("cellb", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, textColor=INK, leading=13),
        "body": ParagraphStyle("body", parent=base["Normal"], fontName="Helvetica", fontSize=10, textColor=INK, leading=15),
        "muted": ParagraphStyle("muted", parent=base["Normal"], fontName="Helvetica", fontSize=8.5, textColor=MUTED, leading=12),
        "score": ParagraphStyle("score", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=26, textColor=colors.white, leading=28, alignment=TA_RIGHT),
        "scorelbl": ParagraphStyle("scorelbl", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=colors.white, leading=11, alignment=TA_RIGHT),
    }

    story = []
    # Header row: brand + score box
    brand = Paragraph("<font color='#0F2137'><b>VHM </b></font><font color='#1E5AA8'><b>Renovation</b></font>", ParagraphStyle("b", fontName="Helvetica-Bold", fontSize=20, leading=22))
    tagline = Paragraph("<font color='#78716C'>SCHILDER- &amp; AFWERKINGSWERKEN</font>", styles["tag"])
    left = Table([[brand], [tagline]], colWidths=[95 * mm])
    left.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))

    score = lead.get("score", 0)
    cat = lead.get("category", "low")
    catlbl = CATEGORY.get(cat, "")
    score_box = Table([[Paragraph(f"{score}/100", styles["score"])], [Paragraph(catlbl, styles["scorelbl"])]], colWidths=[60 * mm])
    score_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIMARY if cat != "hot" else colors.HexColor("#991B1B")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (0, 0), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    header = Table([[left, score_box]], colWidths=[100 * mm, 64 * mm])
    header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    story.append(header)
    story.append(Spacer(1, 10))
    story.append(Paragraph("Offerteaanvraag", styles["h1"]))
    story.append(Paragraph(f"<font color='#78716C'>Ingediend op {_fmt_date(lead.get('created_at'))}</font>", styles["muted"]))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Contact", styles["h2"]))
    story.append(_info_table([
        ("Naam", naam), ("Telefoon", lead.get("telefoon")), ("E-mail", lead.get("email")),
        ("Bedrijf", lead.get("bedrijfsnaam")), ("BTW", lead.get("btw")),
        ("Adres", f"{lead.get('straat','') or ''} {lead.get('huisnummer','') or ''}, {lead.get('postcode','') or ''} {lead.get('gemeente','') or ''}".strip(" ,")),
    ], styles))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Project", styles["h2"]))
    story.append(_info_table([
        ("Projecttype", project_types_label(lead.get("project_types"))),
        ("Renovatie", RENO_TYPE.get(lead.get("renovatie_type"), "—")),
        ("Oppervlakte", f"{lead.get('oppervlakte')} m²" if lead.get("oppervlakte") else "—"),
        ("Verdiepingen", lead.get("verdiepingen")),
        ("Kamers", lead.get("kamers")),
        ("Bouwjaar", lead.get("bouwjaar")),
        ("Bewoond", BEWOOND.get(lead.get("bewoond"), "—")),
        ("Budget", f"{BUDGET.get(lead.get('budget'),'—')}  ({_eur(lead.get('geschatte_waarde'))})"),
        ("Start", TIMING.get(lead.get("starttermijn"), "—")),
        ("Deadline", (lead.get("deadline") or "Ja") if lead.get("heeft_deadline") else "Nee"),
        ("Voorkeur plaatsbezoek", lead.get("plaatsbezoek_datum") or "—"),
    ], styles))
    story.append(Spacer(1, 12))

    if lead.get("works"):
        story.append(Paragraph("Gewenste werken", styles["h2"]))
        story.append(Paragraph(works_label(lead.get("works")), styles["body"]))
        story.append(Spacer(1, 10))

    if lead.get("beschrijving"):
        story.append(Paragraph("Omschrijving", styles["h2"]))
        story.append(Paragraph(lead.get("beschrijving").replace("\n", "<br/>"), styles["body"]))
        story.append(Spacer(1, 10))

    files = lead.get("files") or []
    story.append(Paragraph("Bijlagen", styles["h2"]))
    story.append(Paragraph(f"{len(files)} bestand(en) toegevoegd door de klant." if files else "Geen bestanden toegevoegd.", styles["body"]))

    story.append(Spacer(1, 20))
    disc = Paragraph(
        "<font color='#78716C'>Een definitieve offerte wordt pas opgesteld na beoordeling van het project en, indien nodig, een plaatsbezoek.</font>",
        styles["muted"],
    )
    disc_box = Table([[disc]], colWidths=[164 * mm])
    disc_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), DASH), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LINEBEFORE", (0, 0), (0, -1), 3, PRIMARY)]))
    story.append(disc_box)
    story.append(Spacer(1, 14))
    story.append(Paragraph("VHM Renovation · Zoniënwoudlaan 333/101, 1640 Sint-Genesius-Rode · +32 499 91 57 86 · info@vhmconstructionrenovation.be · BTW BE 0791.888.501", styles["muted"]))

    doc.build(story)
    return buf.getvalue()
