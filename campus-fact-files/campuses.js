// One entry per campus. To add a campus: copy the Vikhroli block, change the
// values, set live: true, then run `node build-pdfs.mjs` to make its PDF.
// Brand: "GMS" (maroon), "GSE" (navy), "GMA" / "LG" (gold).
window.CAMPUSES = [
  {
    slug: "vikhroli",
    live: true,
    brand: "GMS",
    name: "GEMS Millennium School",
    short: "GMS Vikhroli",
    city: "Vikhroli, Mumbai",
    updated: "30 Oct 2026",
    board: "ICSE and Cambridge",
    grades: "Playgroup to Grade 7",
    keyNotes: [
      "No hostel facility at any GEMS campus. Day school only.",
      "Book and uniform samples are available at school for parents to see."
    ],
    gradeGroups: [
      { label: "Early years", rows: [
        ["Playgroup", 149000, 24, "12:1", "9:30 am – 1:30 pm"],
        ["Nursery",   160000, 24, "12:1", "9:30 am – 1:30 pm"],
        ["Jr KG",     172000, 24, "12:1", "9:30 am – 1:30 pm"],
        ["Sr KG",     183000, 24, "12:1", "9:30 am – 1:30 pm"]
      ]},
      { label: "Primary", rows: [
        ["Grade 1", 210000, 24, "12:1", "8:00 am – 3:00 pm"],
        ["Grade 2", 220000, 30, "12:1", "8:00 am – 3:00 pm"],
        ["Grade 3", 232000, 30, "30:1", "8:00 am – 3:00 pm"],
        ["Grade 4", 243000, 30, "30:1", "8:00 am – 3:00 pm"],
        ["Grade 5", 255000, 30, "30:1", "8:00 am – 3:00 pm"]
      ]},
      { label: "Middle school · ICSE", rows: [
        ["Grade 6 (ICSE)", 255000, 30, "30:1", "8:00 am – 3:00 pm"],
        ["Grade 7 (ICSE)", 255000, 30, "30:1", "8:00 am – 3:00 pm"]
      ]},
      { label: "Middle school · Cambridge", rows: [
        ["Grade 6 (Cambridge)", 287000, 30, "30:1", "8:00 am – 3:00 pm"],
        ["Grade 7 (Cambridge)", 287000, 30, "30:1", "8:00 am – 3:00 pm"]
      ]}
    ],
    // Fee columns follow the CEO's sample sheet, left to right.
    // max = upper figure used in the Total column; null = not added to Total.
    applicationFee: 2000,
    admissionFee: 40000,
    extraFees: [
      { key: "Uniform", cell: "Up to 10K", text: "Up to ₹10,000", max: 10000 },
      { key: "Books", cell: "8K – 10K", text: "₹8,000 – 10,000", max: 10000 },
      { key: "ICSE examination fee", cell: "≈ 4K – 5K", text: "Approx. ₹4,000 – 5,000", max: null },
      { key: "Cambridge examination fee", cell: "≈ 8K – 10K / subject", text: "Approx. ₹8,000 – 10,000 per subject", max: null }
    ],
    transport: [
      ["0 – 1 km", 15000],
      ["1 – 3 km", 24000],
      ["3 – 5 km", 30000],
      ["5 – 8 km", 40000],
      ["8 km and above", 60000]
    ],
    bus: [
      ["Bus type", "AC buses"],
      ["Attendant", "1 per bus"],
      ["GPS tracking", "Yes"],
      ["CCTV in bus", "Yes"]
    ],
    facilities: [
      ["Labs and learning", ["Physics lab", "Chemistry lab", "Biology lab", "Eurisko Lab", "Montessori Lab", "Robotics and coding", "Computer lab", "Design lab", "Atelier", "Library"]],
      ["Performing arts", ["Western and Indian dance", "Music (Torrence): keyboard, guitar, percussion lab, tabla and drums", "Theatre and drama"]],
      ["Life skills", ["Pottery", "Culinary", "Carpentry"]],
      ["Indoor sports", ["Basketball", "Yoga", "Taekwondo", "Gymnastics", "Table tennis", "Chess", "Skating", "Physical education"]],
      ["Outdoor sports", ["Cricket nets", "Turf", "Badminton", "Play area"]],
      ["Campus and safety", ["Auditorium", "AC classrooms", "CCTV", "RFID", "SEN room", "Infirmary"]]
    ],
    curriculum: {
      icse: {
        title: "ICSE subject groups · Grades 9 and 10",
        note: "Set by CISCE. Final choices depend on what the school offers and CISCE rules.",
        groups: [
          ["Group I", "Compulsory, take all", "English, Second language (Hindi, Marathi or another approved language), History, Civics and Geography"],
          ["Group II", "Electives, pick 2 or 3", "Mathematics, Science (Physics, Chemistry, Biology), Economics, Commercial Studies, Environmental Science, French"],
          ["Group III", "Skill based, pick 1 or 2", "Computer Applications, Economic Applications, Commercial Applications, Art, Performing Arts, Physical Education, Yoga, Environmental Applications"]
        ]
      },
      igcse: {
        title: "Cambridge IGCSE subject groups",
        note: "Subjects that can be offered, grouped the Cambridge way for subject selection.",
        groups: [
          ["Group 1", "Languages", "English (First Language), English (Second Language), Hindi, French"],
          ["Group 2", "Humanities and social sciences", "History, Geography, Global Perspectives"],
          ["Group 3", "Sciences", "Biology, Chemistry, Physics"],
          ["Group 4", "Mathematics", "Mathematics"],
          ["Group 5", "Professional and creative", "Art and Design, Computer Science, ICT, Business Studies, Economics, Accounting"]
        ]
      }
    },
    awards: []
  },
  { slug: "kalyan", brand: "GMS", name: "GEMS Millennium School", short: "GMS Kalyan", city: "Kalyan" },
  { slug: "gurugram", brand: "GMS", name: "GEMS Millennium School", short: "GMS Gurugram", city: "Gurugram" },
  { slug: "indirapuram", brand: "GMS", name: "GEMS Millennium School", short: "GMS Indirapuram", city: "Indirapuram" },
  { slug: "kochi-gms", brand: "GMS", name: "GEMS Millennium School", short: "GMS Kochi", city: "Kochi" },
  { slug: "varanasi", brand: "GMS", name: "GEMS Millennium School", short: "GMS Varanasi", city: "Varanasi" },
  { slug: "raipur", brand: "GMS", name: "GEMS Millennium School", short: "GMS Raipur", city: "Raipur" },
  { slug: "jodhpur", brand: "GSE", name: "GEMS School of Excellence", short: "GSE Jodhpur", city: "Jodhpur" },
  { slug: "lucknow", brand: "GSE", name: "GEMS School of Excellence", short: "GSE Lucknow", city: "Lucknow" },
  { slug: "kochi-gma", brand: "GMA", name: "GEMS Modern Academy", short: "GMA Kochi", city: "Kochi" },
  { slug: "coimbatore", brand: "GMA", name: "GEMS Modern Academy", short: "GMA Coimbatore", city: "Coimbatore" },
  { slug: "little-gems-kochi", brand: "LG", name: "Little GEMS", short: "Little GEMS Kochi", city: "Kochi" }
];
