export const SITE = {
  name: "BetoDecor",
  tagline: "Totaalrenovatie & Bouw",
  domain: "https://www.betodecorexpert.be",
  phoneDisplay: "+32 475 60 83 20",
  phoneHref: "tel:+32475608320",
  whatsapp:
    "https://wa.me/32475608320?text=Hallo%20BetoDecor%2C%20ik%20heb%20een%20renovatieproject%20en%20wil%20graag%20een%20offerte.",
  email: "info@betodecorexpert.be",
  address: "Konijnenstraat 16, 1930 Zaventem",
  vat: "BE 1010257176",
  iban: "BE52 7310 6297 5809",
};

export const IMAGES = {
  hero:
    "https://images.unsplash.com/photo-1720247520862-7e4b14176fa8?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600&ixlib=rb-4.1.0",
  living:
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200&ixlib=rb-4.1.0",
  kitchen:
    "https://images.unsplash.com/photo-1628745277862-bc0b2d68c50c?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200&ixlib=rb-4.1.0",
  bathroom:
    "https://images.unsplash.com/photo-1661107259637-4e1c55462428?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200&ixlib=rb-4.1.0",
  bathroom2:
    "https://images.pexels.com/photos/35868664/pexels-photo-35868664.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200",
  construction:
    "https://images.unsplash.com/photo-1634586648651-f1fb9ec10d90?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200&ixlib=rb-4.1.0",
  ladder:
    "https://images.unsplash.com/photo-1664662568348-24b1482b6354?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200&ixlib=rb-4.1.0",
  blueprint:
    "https://images.pexels.com/photos/4134179/pexels-photo-4134179.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200",
  van:
    "https://static.prod-images.emergentagent.com/jobs/4f0c0b54-6234-4007-b180-bfdf30f2c829/images/ef159b7aab5de1511de99280aabef668744799beef3eb924c2719dd72b15dc1f.jpeg",
  fleet:
    "https://static.prod-images.emergentagent.com/jobs/4f0c0b54-6234-4007-b180-bfdf30f2c829/images/0f77627170ab1c0d1bd8455fbad24823a4a670d124eefa890e33001a2ad46cfb.jpeg",
  team:
    "https://static.prod-images.emergentagent.com/jobs/4f0c0b54-6234-4007-b180-bfdf30f2c829/images/b64a95937e26d32469c77d3744c2c59d972afca81321388c234702518812eca3.jpeg",
  facade:
    "https://static.prod-images.emergentagent.com/jobs/4f0c0b54-6234-4007-b180-bfdf30f2c829/images/57fa188832657c01964d3d88bd81b61757e59e89a0165f14cee205512554bc71.jpeg",
};

// Wizard option keys — MUST match backend scoring.py keys.
export const WIZARD = {
  projectTypes: ["woning", "appartement", "bedrijfspand", "kantoor", "handelsruimte", "badkamer", "keuken", "andere"],
  renovatieType: ["volledig", "gedeeltelijk", "onzeker"],
  bewoond: ["ja", "nee", "onbekend"],
  works: {
    afbraak: ["afbraak", "ruwbouw", "muren-verwijderen", "nieuwe-indeling"],
    technieken: ["elektriciteit", "sanitair", "verwarming", "ventilatie", "waterleidingen"],
    interieur: ["badkamer", "keuken", "vloeren", "tegelwerken", "pleisterwerken", "gyproc", "schilderwerken", "deuren", "afwerking"],
    andere: ["gevel", "dak", "isolatie", "andere-werk"],
  },
  budget: ["lt10k", "10-25k", "25-50k", "50-100k", "100-150k", "150-250k", "gt250k", "unknown"],
  starttermijn: ["asap", "1m", "1-3m", "3-6m", "6-12m", "later", "unknown"],
  maxFiles: 10,
};

export const CATEGORY_STYLE = {
  hot: { label: "HOT", bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  high: { label: "HIGH", bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  normal: { label: "NORMAAL", bg: "#E0F2FE", text: "#075985", border: "#BAE6FD" },
  low: { label: "LAAG", bg: "#F5F5F4", text: "#57534E", border: "#E7E5E4" },
};

export const STATUS_LABEL = {
  nl: { nieuw: "Nieuw", bezocht: "Bezocht", offerte_verzonden: "Offerte verzonden" },
};
