"""IMAP/SMTP mailbox for the VHM Renovation admin inbox.
Reads and sends real e-mail for the configured mailboxes.
Blocking calls (imaplib/smtplib) are meant to be run via asyncio.to_thread.
"""
import os
import re
import ssl
import socket
import imaplib
import smtplib
import logging
import html as htmllib
from email import message_from_bytes
from email.header import decode_header, make_header
from email.utils import parseaddr, parsedate_to_datetime, formatdate, make_msgid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

IMAP_HOST = os.environ.get("IMAP_HOST")
IMAP_PORT = int(os.environ.get("IMAP_PORT", "993"))
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))

_UID_RE = re.compile(rb"UID (\d+)")
_FLAGS_RE = re.compile(rb"FLAGS \(([^)]*)\)")


def _accounts() -> dict:
    accts = {}
    r_user, r_pass = os.environ.get("SMTP_USER"), os.environ.get("SMTP_PASSWORD")
    if r_user and r_pass:
        accts["roberto"] = {"key": "roberto", "email": r_user, "password": r_pass, "label": "VHM"}
    i_user, i_pass = os.environ.get("INFO_EMAIL"), os.environ.get("INFO_PASSWORD")
    if i_user and i_pass:
        accts["info"] = {"key": "info", "email": i_user, "password": i_pass, "label": "Info"}
    return accts


ACCOUNTS = _accounts()


def list_accounts() -> list:
    return [{"key": a["key"], "email": a["email"], "label": a["label"]} for a in ACCOUNTS.values()]


def configured() -> bool:
    return bool(IMAP_HOST and ACCOUNTS)


# ----------------------------- helpers -----------------------------
def _dec(value) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return str(value)


def _iso(date_header):
    try:
        dt = parsedate_to_datetime(date_header)
        return dt.isoformat()
    except Exception:
        return date_header or ""


def _nl2br(text: str) -> str:
    return "<br>".join(htmllib.escape(text or "").split("\n"))


def _connect(account_key: str) -> imaplib.IMAP4_SSL:
    acc = ACCOUNTS[account_key]
    socket.setdefaulttimeout(30)
    ctx = ssl.create_default_context()
    M = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=ctx)
    M.login(acc["email"], acc["password"])
    return M


# ----------------------------- list -----------------------------
def fetch_messages(account_key: str, folder: str = "INBOX", limit: int = 30, offset: int = 0) -> list:
    if account_key not in ACCOUNTS:
        return []
    M = _connect(account_key)
    out = []
    try:
        M.select(f'"{folder}"', readonly=True)
        typ, data = M.uid("search", None, "ALL")
        if typ != "OK" or not data or not data[0]:
            return []
        uids = data[0].split()
        uids.reverse()  # newest first
        page = uids[offset:offset + limit]
        if not page:
            return []
        uid_set = b",".join(page)
        typ, resp = M.uid(
            "fetch", uid_set,
            "(FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])",
        )
        by_uid = {}
        for part in resp:
            if not isinstance(part, tuple):
                continue
            meta, header_bytes = part[0], part[1]
            m_uid = _UID_RE.search(meta)
            if not m_uid:
                continue
            uid = m_uid.group(1).decode()
            flags = b""
            m_fl = _FLAGS_RE.search(meta)
            if m_fl:
                flags = m_fl.group(1)
            msg = message_from_bytes(header_bytes)
            name, addr = parseaddr(_dec(msg.get("From")))
            _, to_addr = parseaddr(_dec(msg.get("To")))
            by_uid[uid] = {
                "account": account_key,
                "folder": folder,
                "uid": uid,
                "from_name": name or addr,
                "from_email": addr,
                "to": to_addr,
                "subject": _dec(msg.get("Subject")) or "(geen onderwerp)",
                "date": _iso(msg.get("Date")),
                "seen": b"\\Seen" in flags,
            }
        # preserve newest-first ordering of page
        for u in page:
            key = u.decode()
            if key in by_uid:
                out.append(by_uid[key])
        return out
    finally:
        try:
            M.logout()
        except Exception:
            pass


# ----------------------------- single message -----------------------------
def _extract_body_and_attachments(msg):
    html_body = None
    text_body = None
    attachments = []
    idx = 0
    if msg.is_multipart():
        for part in msg.walk():
            if part.is_multipart():
                continue
            disp = str(part.get("Content-Disposition") or "")
            ctype = part.get_content_type()
            filename = part.get_filename()
            if filename:
                filename = _dec(filename)
            if "attachment" in disp.lower() or (filename and ctype not in ("text/html", "text/plain")):
                payload = part.get_payload(decode=True) or b""
                attachments.append({
                    "index": idx,
                    "filename": filename or f"bijlage-{idx}",
                    "content_type": ctype,
                    "size": len(payload),
                })
                idx += 1
                continue
            try:
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                decoded = payload.decode(charset, errors="replace")
            except Exception:
                decoded = ""
            if ctype == "text/html" and html_body is None:
                html_body = decoded
            elif ctype == "text/plain" and text_body is None:
                text_body = decoded
    else:
        try:
            payload = msg.get_payload(decode=True) or b""
            charset = msg.get_content_charset() or "utf-8"
            decoded = payload.decode(charset, errors="replace")
        except Exception:
            decoded = ""
        if msg.get_content_type() == "text/html":
            html_body = decoded
        else:
            text_body = decoded
    if html_body is None:
        html_body = f'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1C1917;line-height:1.6;">{_nl2br(text_body or "")}</div>'
    return html_body, text_body, attachments


def fetch_message(account_key: str, uid: str, folder: str = "INBOX", mark_read: bool = True) -> dict:
    if account_key not in ACCOUNTS:
        return None
    M = _connect(account_key)
    try:
        M.select(f'"{folder}"', readonly=not mark_read)
        typ, data = M.uid("fetch", str(uid).encode(), "(RFC822)")
        if typ != "OK" or not data or not isinstance(data[0], tuple):
            return None
        raw = data[0][1]
        msg = message_from_bytes(raw)
        name, addr = parseaddr(_dec(msg.get("From")))
        html_body, text_body, attachments = _extract_body_and_attachments(msg)
        if mark_read:
            try:
                M.uid("store", str(uid).encode(), "+FLAGS", "(\\Seen)")
            except Exception:
                pass
        return {
            "account": account_key,
            "folder": folder,
            "uid": str(uid),
            "from_name": name or addr,
            "from_email": addr,
            "to": _dec(msg.get("To")),
            "cc": _dec(msg.get("Cc")),
            "subject": _dec(msg.get("Subject")) or "(geen onderwerp)",
            "date": _iso(msg.get("Date")),
            "message_id": msg.get("Message-ID") or "",
            "references": msg.get("References") or "",
            "html": html_body,
            "text": text_body or "",
            "attachments": attachments,
        }
    finally:
        try:
            M.logout()
        except Exception:
            pass


def fetch_attachment(account_key: str, uid: str, folder: str, index: int):
    if account_key not in ACCOUNTS:
        return None
    M = _connect(account_key)
    try:
        M.select(f'"{folder}"', readonly=True)
        typ, data = M.uid("fetch", str(uid).encode(), "(RFC822)")
        if typ != "OK" or not data or not isinstance(data[0], tuple):
            return None
        msg = message_from_bytes(data[0][1])
        idx = 0
        for part in msg.walk():
            if part.is_multipart():
                continue
            disp = str(part.get("Content-Disposition") or "")
            ctype = part.get_content_type()
            filename = part.get_filename()
            is_att = "attachment" in disp.lower() or (filename and ctype not in ("text/html", "text/plain"))
            if not is_att:
                continue
            if idx == index:
                return {
                    "data": part.get_payload(decode=True) or b"",
                    "content_type": ctype,
                    "filename": _dec(filename) if filename else f"bijlage-{index}",
                }
            idx += 1
        return None
    finally:
        try:
            M.logout()
        except Exception:
            pass


def mark_seen(account_key: str, uid: str, folder: str = "INBOX", seen: bool = True):
    if account_key not in ACCOUNTS:
        return False
    M = _connect(account_key)
    try:
        M.select(f'"{folder}"', readonly=False)
        op = "+FLAGS" if seen else "-FLAGS"
        M.uid("store", str(uid).encode(), op, "(\\Seen)")
        return True
    finally:
        try:
            M.logout()
        except Exception:
            pass


def unread_counts() -> dict:
    counts = {}
    for key in ACCOUNTS:
        try:
            M = _connect(key)
            try:
                M.select('"INBOX"', readonly=True)
                typ, data = M.uid("search", None, "UNSEEN")
                counts[key] = len(data[0].split()) if typ == "OK" and data and data[0] else 0
            finally:
                M.logout()
        except Exception as e:
            logger.warning("Unread count mislukt voor %s: %s", key, e)
            counts[key] = 0
    return counts


# ----------------------------- send -----------------------------
def _append_to_sent(account_key: str, raw_message: bytes):
    try:
        M = _connect(account_key)
        try:
            M.append('"Sent"', "(\\Seen)", None, raw_message)
        finally:
            M.logout()
    except Exception as e:
        logger.warning("Kopie naar Verzonden mislukt (%s): %s", account_key, e)


def send_message(account_key: str, to: str, subject: str, body: str,
                 cc: str = None, in_reply_to: str = None, references: str = None) -> dict:
    if account_key not in ACCOUNTS:
        return {"ok": False, "error": "Onbekend account."}
    acc = ACCOUNTS[account_key]
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = acc["email"]
    msg["To"] = to
    if cc:
        msg["Cc"] = cc
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="vhmconstructionrenovation.be")
    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
        msg["References"] = (references or in_reply_to)
    msg.attach(MIMEText(body or "", "plain", "utf-8"))
    html_body = f'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1C1917;line-height:1.6;">{_nl2br(body)}</div>'
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    recipients = [r.strip() for r in (to or "").split(",") if r.strip()]
    if cc:
        recipients += [r.strip() for r in cc.split(",") if r.strip()]
    if not recipients:
        return {"ok": False, "error": "Geen ontvanger."}

    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
            server.starttls()
        server.login(acc["email"], acc["password"])
        server.sendmail(acc["email"], recipients, msg.as_string())
        server.quit()
    except Exception as e:
        logger.error("Inbox verzenden mislukt (%s): %s", account_key, e)
        return {"ok": False, "error": str(e)}

    _append_to_sent(account_key, msg.as_bytes())
    return {"ok": True, "from": acc["email"], "to": to, "subject": subject}
