/* Site settings. Change these without touching the rest of the code. */
window.GCT_CONFIG = {
  // Google Apps Script web app URL (ends in /exec). Leave empty to keep results on this device only.
  SHEET_URL: "https://script.google.com/macros/s/AKfycbwibA-poLLnkaDbvmiSyCfazEYWzU-oofqvDWpIAsR5LReoM7PgVRHaP87fMLX5w5I/exec",

  // Percentage needed to pass a module quiz and the final exam.
  PASS_MARK: 70,

  // Questions drawn from each module's bank per attempt (all of them if the bank is smaller).
  QUIZ_SIZE: 10,
  FINAL_SIZE: 25,
  REFRESHER_SIZE: 5,

  // Share of a video that must be watched before "Next" unlocks the first time through.
  WATCH_SHARE: 0.8,

  CRM_URL: "https://gemseducation.m.frappe.cloud/crm",
  EXOTEL_URL: "https://my.in.exotel.com",
  EXOTEL_VERIFY_NUMBER: "080 4863 6969",

  CAMPUSES: [
    { name: "GMS Gurugram", brand: "gms", slug: "gems-millennium-school-gurugram" },
    { name: "GMS Indirapuram", brand: "gms", slug: "gems-millennium-school-indirapuram" },
    { name: "GMS Varanasi", brand: "gms", slug: "gems-millennium-school-varanasi" },
    { name: "GMS Raipur", brand: "gms", slug: "gems-millennium-school-raipur" },
    { name: "GMS Kochi", brand: "gms", slug: "gems-millennium-school-kochi" },
    { name: "GMS Vikhroli", brand: "gms", slug: "gems-millennium-school-vikhroli" },
    { name: "GMS Kalyan", brand: "gms", slug: "gems-millennium-school-kalyan" },
    { name: "GMA Kochi", brand: "gma", slug: "gems-modern-academy-kochi" },
    { name: "GMA Coimbatore", brand: "gma", slug: "gems-modern-academy-coimbatore" },
    { name: "GSE Jodhpur", brand: "gse", slug: "gems-school-of-excellence-jodhpur" },
    { name: "GSE Lucknow", brand: "gse", slug: "gems-school-of-excellence-lucknow" },
    { name: "Little GEMS Kochi", brand: "gma", slug: "little-gems-kochi" }
  ],
  WALKIN_BASE: "https://gemseducation.m.frappe.cloud/walk-in/"
};
