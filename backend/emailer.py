"""SMTP email for VHM Renovation: transactional (notification + confirmation + manual)
and marketing templates. Branded, with a professional signature.
Gracefully no-ops when SMTP is not configured, so lead capture never fails.
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from labels_nl import BUDGET, TIMING, CATEGORY, project_types_label

logger = logging.getLogger(__name__)

COMPANY = {
    "name": "VHM Renovation",
    "tagline": "Schilder- & afwerkingswerken",
    "address": "Zoniënwoudlaan 333/101, 1640 Sint-Genesius-Rode",
    "phone": "+32 499 91 57 86",
    "email": "info@vhmconstructionrenovation.be",
    "vat": "BE 0791.888.501",
    "site": "https://www.vhmconstructionrenovation.be",
    "owner": "Victor",
}
PRIMARY = "#1E5AA8"
INK = "#0F2137"


def _smtp_configured() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASSWORD"))


def _send(to_email: str, subject: str, html: str) -> bool:
    if not _smtp_configured():
        logger.warning("SMTP niet geconfigureerd — e-mail overgeslagen (naar %s): %s", to_email, subject)
        return False
    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ["SMTP_USER"]
    password = os.environ["SMTP_PASSWORD"]
    sender = os.environ.get("SMTP_FROM") or user
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=25)
        else:
            server = smtplib.SMTP(host, port, timeout=25)
            server.starttls()
        server.login(user, password)
        server.sendmail(sender, [to_email], msg.as_string())
        server.quit()
        logger.info("E-mail verzonden naar %s: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error("E-mail versturen mislukt (%s): %s", to_email, e)
        return False


def _signature() -> str:
    c = COMPANY
    return f"""
    <table style="margin-top:24px;border-top:1px solid #E7E5E4;padding-top:16px;width:100%;">
      <tr><td>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:{INK};">Met vriendelijke groeten,</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:{INK};">{c['owner']} — {c['name']}</p>
        <p style="margin:2px 0 0;font-family:Arial,sans-serif;font-size:12px;color:{PRIMARY};font-weight:bold;letter-spacing:1px;text-transform:uppercase;">{c['tagline']}</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#57534E;line-height:1.6;">
          {c['address']}<br>
          <a href="tel:{c['phone'].replace(' ','')}" style="color:#57534E;text-decoration:none;">{c['phone']}</a> ·
          <a href="mailto:{c['email']}" style="color:#57534E;text-decoration:none;">{c['email']}</a><br>
          BTW {c['vat']}
        </p>
      </td></tr>
    </table>
    """


def _shell(inner_html: str, signature: bool = True) -> str:
    sig = _signature() if signature else ""
    return f"""
    <div style="background:#F5F5F4;padding:24px 0;">
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #E7E5E4;border-radius:10px;overflow:hidden;">
        <div style="background:{INK};padding:22px 28px;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">VHM <span style="color:{PRIMARY};">Renovation</span></p>
          <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,.6);letter-spacing:2px;text-transform:uppercase;">{COMPANY['tagline']}</p>
        </div>
        <div style="padding:28px;">
          {inner_html}
          {sig}
        </div>
      </div>
      <p style="text-align:center;color:#A8A29E;font-size:11px;margin-top:14px;font-family:Arial,sans-serif;">VHM Renovation · {COMPANY['address']} · BTW {COMPANY['vat']}</p>
    </div>
    """


# ---------------- Notification to Roberto ----------------
def send_new_lead_notification(lead: dict):
    to_email = os.environ.get("NOTIFY_EMAIL")
    if not to_email:
        return None
    cat = lead.get("category", "normal")
    urgent = cat == "hot"
    prefix = "🔥 URGENTE HOT LEAD" if urgent else f"Nieuwe lead ({CATEGORY.get(cat, '')})"
    naam = f"{lead.get('voornaam', '')} {lead.get('achternaam', '')}".strip()
    ptypes = project_types_label(lead.get("project_types"))
    subject = f"{prefix} — {ptypes} in {lead.get('gemeente', '')} ({lead.get('score')}/100)"
    inner = f"""
      <div style="background:{'#991B1B' if urgent else PRIMARY};color:#fff;padding:16px 18px;border-radius:8px;margin-bottom:18px;">
        <p style="margin:0;font-size:18px;font-weight:bold;">{prefix}</p>
        <p style="margin:5px 0 0;opacity:.9;font-size:14px;">Leadscore: <strong>{lead.get('score')}/100</strong> — {CATEGORY.get(cat, '')}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:{INK};font-family:Arial,sans-serif;">
        <tr><td style="padding:5px 0;color:#78716C;width:130px;">Naam</td><td style="padding:5px 0;font-weight:bold;">{naam}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Telefoon</td><td style="padding:5px 0;font-weight:bold;">{lead.get('telefoon', '')}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">E-mail</td><td style="padding:5px 0;font-weight:bold;">{lead.get('email', '')}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Projecttype</td><td style="padding:5px 0;font-weight:bold;">{ptypes}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Oppervlakte</td><td style="padding:5px 0;font-weight:bold;">{lead.get('oppervlakte') or '—'} m²</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Budget</td><td style="padding:5px 0;font-weight:bold;">{BUDGET.get(lead.get('budget'), '—')}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Start</td><td style="padding:5px 0;font-weight:bold;">{TIMING.get(lead.get('starttermijn'), '—')}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Plaatsbezoek</td><td style="padding:5px 0;font-weight:bold;">{lead.get('plaatsbezoek_datum') or '—'}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Locatie</td><td style="padding:5px 0;font-weight:bold;">{lead.get('straat', '')} {lead.get('huisnummer', '')}, {lead.get('postcode', '')} {lead.get('gemeente', '')}</td></tr>
        <tr><td style="padding:5px 0;color:#78716C;">Bestanden</td><td style="padding:5px 0;font-weight:bold;">{len(lead.get('files') or [])}</td></tr>
      </table>
      <p style="margin:16px 0 6px;color:#78716C;font-size:13px;">Omschrijving</p>
      <p style="margin:0;font-size:14px;color:{INK};background:#F5F5F4;padding:12px;border-radius:6px;">{(lead.get('beschrijving') or '—')}</p>
    """
    html = _shell(inner, signature=False)
    ok = _send(to_email, subject, html)
    return {"ok": ok, "to": to_email, "subject": subject, "html": html}


# ---------------- Customer confirmation ----------------
_CONFIRM = {
    "nl": {"subject": "Bedankt voor uw aanvraag — VHM Renovation", "title": "Bedankt voor uw aanvraag",
           "hi": "Beste", "body": "We hebben uw projectgegevens goed ontvangen. VHM Renovation bekijkt uw aanvraag zorgvuldig en neemt contact met u op om de mogelijkheden en een eventueel plaatsbezoek te bespreken.",
           "note": "Een definitieve offerte wordt pas opgesteld na beoordeling van het project en, indien nodig, een plaatsbezoek."},
    "fr": {"subject": "Merci pour votre demande — VHM Renovation", "title": "Merci pour votre demande",
           "hi": "Bonjour", "body": "Nous avons bien reçu les détails de votre projet. VHM Renovation examine votre demande avec soin et vous contactera pour discuter des possibilités et d'une éventuelle visite sur place.",
           "note": "Un devis définitif ne sera établi qu'après évaluation du projet et, si nécessaire, une visite sur place."},
    "en": {"subject": "Thank you for your request — VHM Renovation", "title": "Thank you for your request",
           "hi": "Dear", "body": "We have received your project details. VHM Renovation will carefully review your request and contact you to discuss the possibilities and a possible site visit.",
           "note": "A final quote is only drawn up after assessment of the project and, if necessary, a site visit."},
    "es": {"subject": "Gracias por su solicitud — VHM Renovation", "title": "Gracias por su solicitud",
           "hi": "Hola", "body": "Hemos recibido los detalles de su proyecto. VHM Renovation revisará su solicitud cuidadosamente y se pondrá en contacto con usted para hablar de las posibilidades y una posible visita.",
           "note": "Un presupuesto definitivo solo se elabora tras la evaluación del proyecto y, si es necesario, una visita."},
}


def send_customer_confirmation(lead: dict):
    to_email = lead.get("email")
    if not to_email:
        return None
    c = _CONFIRM.get(lead.get("lang", "nl"), _CONFIRM["nl"])
    inner = f"""
      <h2 style="margin:0 0 14px;font-size:20px;color:{INK};font-family:Arial,sans-serif;">{c['title']}</h2>
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:{INK};">{c['hi']} {lead.get('voornaam','')},</p>
      <p style="margin:12px 0;font-family:Arial,sans-serif;font-size:14px;color:#44403C;line-height:1.6;">{c['body']}</p>
      <p style="margin:16px 0;padding:14px;background:#F5F5F4;border-left:3px solid {PRIMARY};border-radius:4px;font-family:Arial,sans-serif;font-size:13px;color:#57534E;">{c['note']}</p>
    """
    html = _shell(inner, signature=True)
    ok = _send(to_email, c["subject"], html)
    return {"ok": ok, "to": to_email, "subject": c["subject"], "html": html}


# ---------------- Manual email from admin ----------------
def send_custom_email(to_email: str, subject: str, body: str, is_html: bool = False):
    body_html = body if is_html else "".join(
        f'<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:14px;color:{INK};line-height:1.6;">{line}</p>'
        for line in (body or "").split("\n") if line.strip() != ""
    ) or f'<p style="font-family:Arial,sans-serif;font-size:14px;color:{INK};">{body}</p>'
    html = _shell(body_html, signature=True)
    ok = _send(to_email, subject, html)
    return {"ok": ok, "to": to_email, "subject": subject, "html": html}


# ---------------- Marketing / campaign ----------------
def send_marketing_email(to_email: str, subject: str, body: str, cta_url: str = None, cta_label: str = None):
    paras = "".join(
        f'<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;color:#44403C;line-height:1.7;">{line}</p>'
        for line in (body or "").split("\n") if line.strip() != ""
    )
    cta = ""
    if cta_url:
        cta = f"""
        <div style="text-align:center;margin:26px 0 6px;">
          <a href="{cta_url}" style="display:inline-block;background:{PRIMARY};color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;padding:14px 30px;border-radius:999px;">{cta_label or 'Vraag een offerte aan'}</a>
        </div>
        """
    inner = f"""
      <div style="background:{INK};margin:-28px -28px 24px;padding:34px 28px;">
        <p style="margin:0;color:#fff;font-family:Arial,sans-serif;font-size:24px;font-weight:800;line-height:1.25;">{subject}</p>
      </div>
      {paras}
      {cta}
    """
    html = f"""
    <div style="background:#F5F5F4;padding:24px 0;">
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #E7E5E4;border-radius:10px;overflow:hidden;">
        <div style="background:{INK};padding:18px 28px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">VHM <span style="color:{PRIMARY};">Renovation</span></p>
          <p style="margin:3px 0 0;font-size:11px;color:rgba(255,255,255,.6);letter-spacing:2px;text-transform:uppercase;">{COMPANY['tagline']}</p>
        </div>
        <div style="padding:28px;">{inner}</div>
        <div style="background:#F5F5F4;padding:18px 28px;text-align:center;border-top:1px solid #E7E5E4;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#78716C;">{COMPANY['name']} · {COMPANY['address']}<br>{COMPANY['phone']} · {COMPANY['email']}</p>
          <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#A8A29E;">U ontvangt deze e-mail omdat u contact had met VHM Renovation.</p>
        </div>
      </div>
    </div>
    """
    ok = _send(to_email, subject, html)
    return {"ok": ok, "to": to_email, "subject": subject, "html": html}
