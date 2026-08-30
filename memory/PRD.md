# PRD — BetoDecor (betodecorexpert.be)

## Origineel probleemstatement (rebrand van "Sanivolt")
BetoDecor is een premium **totaalrenovatiebedrijf** (woningen, appartementen, bedrijfspanden) — géén spoeddienst. Doel: een conversiegerichte website met een **7-staps renovatie-intake wizard**, **automatische lead scoring (0–100)**, **beveiligd admin-CRM** voor eigenaar Roberto, **file-uploads** (foto's/plannen) en **automatische e-mails** (melding + klantbevestiging). Meertalig **NL/FR/EN/ES** (klanten in Brussel & omgeving). Commerciële regel: nooit een automatische definitieve prijs beloven ("Renovatieaanvraag"/"Projectbeoordeling").

Bedrijf: BetoDecor, Konijnenstraat 16, 1930 Zaventem — BTW BE 1010257176 — IBAN BE52 7310 6297 5809 — tel +32 475 60 83 20.
Prioriteitsregio: Zaventem, Machelen, Diegem, Vilvoorde, Kraainem, Leuven, Brussel, Vlaams-Brabant.

## Architectuur
- Frontend: React (CRA/craco) + Tailwind + framer-motion + lenis. Fonts: Cabinet Grotesk (headings) + IBM Plex Sans (body). Palet: warm terracotta (#9C5B3E) op off-white/charcoal.
- Backend: FastAPI (server.py + scoring.py, storage.py, emailer.py, auth.py, seed_data.py), routes onder /api.
- Database: MongoDB — collecties `leads`, `users`, `login_attempts`.
- Auth: JWT (PyJWT) + bcrypt, Bearer-token in localStorage; admin geseed uit env (idempotent).
- Uploads: Emergent Object Storage (privé), geserveerd via `/api/files/{path}?token=` (admin-only).
- E-mail: SMTP (smtp-auth.mailprotect.be) — graceful skip tot `SMTP_PASSWORD` gezet is.

## Lead scoring (0–100)
budget (30) + projecttype/omvang (25) + locatie (20) + timing (15) + compleetheid (10).
Caps: buiten werkgebied → max 75; randgebied → max 88; budget onbekend → max 84.
Categorieën: HOT ≥90 · HIGH 75–89 · NORMAAL 50–74 · LAAG 0–49.

## Datamodel `leads`
project_types[], oppervlakte, verdiepingen, kamers, bouwjaar, bewoond, renovatie_type, works[], beschrijving, budget, starttermijn, heeft_deadline, deadline, straat/huisnummer/postcode/gemeente/land, files[] (id, storage_path, original_filename, content_type, size), voornaam/achternaam/telefoon/email, bedrijfsnaam, btw, opmerkingen, lang, score, category, score_breakdown, geschatte_waarde, status (nieuw|bezocht|offerte_verzonden), created_at.

## API
- Publiek: `GET /api/`, `POST /api/upload`, `POST /api/leads`
- Auth: `POST /api/auth/login`, `GET /api/auth/me`
- Admin (Bearer): `GET /api/admin/leads` (filters status/category/gemeente/project_type/q), `GET /api/admin/stats`, `GET /api/admin/leads/{id}`, `PATCH /api/admin/leads/{id}/status`
- Bestanden: `GET /api/files/{path}?token=<jwt>` (admin-only)

## Frontend routes
- Home: `/`, `/fr`, `/en`, `/es`
- Wizard: `/aanvraag`, `/fr/demande`, `/en/request`, `/es/solicitud`
- Bevestiging: `/bedankt`, `/fr/merci`, `/en/thank-you`, `/es/gracias`
- Admin: `/admin/login`, `/admin` (dashboard), `/admin/lead/:id`

## Geïmplementeerd (2026-08-27)
- Volledige rebrand Sanivolt → BetoDecor; oude spoed-componenten/SEO-pagina's verwijderd.
- Premium meertalige homepage (hero, diensten, waarom, werkwijze, realisaties, regio, CTA, footer) in NL/FR/EN/ES.
- 7-staps renovatie-intake wizard met voortgangsbalk, back-navigatie zonder dataverlies, file-uploads (foto's/PDF) met previews, en commerciële disclaimer.
- Bevestigingspagina + volledige footer met contactgegevens.
- Backend: lead scoring-engine, object-storage uploads, JWT-auth + bcrypt + brute-force lockout (X-Forwarded-For), SMTP-mailer (melding + klantbevestiging, meertalig), 8 realistische seed-leads.
- Admin-CRM: beveiligde login, dashboard met KPI's + gesorteerde leadtabel (score/categorie/status-badges) + filters, lead-detailpagina (project, media-gallery, contact-acties, score-breakdown, statuswijziging).

### 2026-08-30 — E-mail live, PDF, CRM-uitbreiding & branding
- SMTP geactiveerd (mailprotect.be): automatische lead-melding naar Roberto + klantbevestiging; alle mails met professionele BetoDecor-template & handtekening. Alle verzendingen gelogd in `emails`-collectie.
- Admin lead-detail: **PDF-download** (reportlab) van de aanvraag, **e-mail versturen** naar klant + **geschiedenis** van verzonden mails ("Bekijk").
- Nieuwe **Mailmarketing**-pagina: gebrande campagne-mails naar doelgroep (Alle/HOT/HIGH/NORMAAL/LAAG) met optionele CTA-knop.
- Wizard stap 5: optioneel veld **Voorkeursdatum plaatsbezoek** (4 talen).
- Nieuwe homepage-sectie **Team & wagenpark** met gebrande BetoDecor-bedrijfswagens + team (AI-gegenereerd, on-brand) en uitgebreide realisaties-galerij.

## Geverifieerd
- Backend: 24/24 pytest (auth, scoring-caps, upload-validatie, beveiligde /files, admin filters/stats/status). Extra: lockout 429 na 5 pogingen, /files 401/404, /auth/me 200.
- Frontend (testing agent): home + taalwissel, volledige wizard-flow + validatie + submit → /bedankt, admin login/dashboard/filters/detail/status/logout, mobiel. Geen console/pagina-fouten.

## Backlog (prioriteit)
- ✅ (klaar) SMTP-verzending live — lead-meldingen + klantbevestigingen + handmatige mails + campagnes.
- P1: Echte realisatie-foto's van eigen projecten i.p.v. stockbeelden (interieurtegels).
- P1: Domein betodecorexpert.be koppelen + deploy.
- P2: Meertalige SEO-landingspagina's per gemeente (renovatie) voor vindbaarheid.
- P2: Uitbreidbaar CRM: extra statussen, notities, agenda/plaatsbezoek, PDF-offerte, WhatsApp/CRM-koppeling.
