export const SITE = {
  name: "VHM Renovation",
  tagline: "Schilder- & afwerkingswerken",
  domain: "https://www.vhmconstructionrenovation.be",
  phoneDisplay: "+32 499 91 57 86",
  phoneHref: "tel:+32499915786",
  whatsapp:
    "https://wa.me/32499915786?text=Hallo%20VHM%20Renovation%2C%20ik%20heb%20een%20schilder-%20of%20afwerkingsproject%20en%20wil%20graag%20een%20offerte.",
  email: "info@vhmconstructionrenovation.be",
  address: "Zoniënwoudlaan 333/101, 1640 Sint-Genesius-Rode",
  vat: "BE 0791.888.501",
  iban: "",
};

export const IMAGES = {
  hero:
    "https://images.unsplash.com/photo-1633330977020-2bdfb8530cc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600&ixlib=rb-4.1.0",
  living:
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  kitchen:
    "https://images.unsplash.com/photo-1632829882891-5047ccc421bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  bathroom:
    "https://images.pexels.com/photos/34046207/pexels-photo-34046207.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200",
  bathroom2:
    "https://images.pexels.com/photos/1669754/pexels-photo-1669754.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200",
  construction:
    "https://images.unsplash.com/photo-1776214570723-cd9ce2795d32?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  ladder:
    "https://images.unsplash.com/photo-1709086566151-9a88641579b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  blueprint:
    "https://images.unsplash.com/photo-1709086566151-9a88641579b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  van:
    "https://images.pexels.com/photos/1669754/pexels-photo-1669754.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200",
  fleet:
    "https://images.unsplash.com/photo-1709086566151-9a88641579b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  team:
    "https://images.unsplash.com/photo-1776214570723-cd9ce2795d32?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
  facade:
    "https://images.unsplash.com/photo-1734475318787-b2b737296469?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200&ixlib=rb-4.1.0",
};

// Wizard option keys — MUST match backend scoring.py / labels_nl.py keys.
export const WIZARD = {
  projectTypes: ["woning", "appartement", "nieuwbouw", "handelsruimte", "kantoor", "andere"],
  renovatieType: ["volledig", "gedeeltelijk", "onzeker"],
  bewoond: ["ja", "nee", "onbekend"],
  works: {
    schilderwerk: ["binnen", "buiten", "plafonds", "behang"],
    afwerking: ["gyproc", "plamuren", "herstellingen", "vloerbekleding"],
    voorbereiding: ["reinigen", "afplakken", "schuren"],
  },
  budget: ["lt10k", "10-25k", "25-50k", "50-100k", "100-150k", "150-250k", "gt250k", "unknown"],
  starttermijn: ["asap", "1m", "1-3m", "3-6m", "6-12m", "later", "unknown"],
  maxFiles: 10,
};

export const CATEGORY_STYLE = {
  hot: { label: "HOT", bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  high: { label: "HIGH", bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  normal: { label: "NORMAAL", bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  low: { label: "LAAG", bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
};

export const STATUS_LABEL = {
  nl: { nieuw: "Nieuw", bezocht: "Bezocht", offerte_verzonden: "Offerte verzonden" },
};
