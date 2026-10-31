import re
"""Turn the school facts workbook into site/campuses.js.
Usage: python3 -I gen.py <workbook.xlsx> <out campuses.js>"""
import datetime, json, re, sys
import openpyxl

wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
EMPTY = {"", "na", "n/a", "tbc", "tbs", "none", "not made", "-", "–"}


def clean(v):
    if v is None:
        return None
    if isinstance(v, datetime.time):  # "12:1" typed into Excel becomes a time
        return f"{v.hour}:{v.minute}"
    if isinstance(v, datetime.datetime):
        return v.strftime("%-d %b %Y")
    s = re.sub(r"\s+", " ", str(v).replace("\n", " / ")).strip(" /|,")
    return None if s.lower() in EMPTY else fix(s)


FIX = [("Badmintton", "Badminton"), ("Biol lab", "Biology lab"), ("Drama threatre", "Drama theatre"), ("Cafetaria", "Cafeteria"),
       ("Euresko lab", "Eurisko Lab"), ("Sciece", "Science"), ("2. acres", "2 acres"), ("Galop Nagar", "Gholap Nagar"),
       (" , ", ", "), ("Adhaar", "Aadhaar"), ("by acer", "by ACER"), ("A.M", "am"), ("P.M", "pm"), ("AM -", "am –"), ("PM ", "pm "),
       ("Mr.", "Mr "), ("Ms.", "Ms "), ("Mrs.", "Mrs "), ("Dr.", "Dr "), ("Maharastra", "Maharashtra"), ("'C'road", "'C' Road"),
       ("Music & Performing Arts:", "Music & performing arts:"), ("Smary City", "Smart City")]


def fix(s):
    if not s:
        return s
    for a, b in FIX:
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()


def split_list(s):
    if not s:
        return []
    s = fix(s)
    parts = re.split(r"\s*(?:\||/|\n)\s*", s) if "|" in s else re.split(r"\s*(?:/|,|\n)\s*", s)
    out = []
    for p in parts:
        p = p.strip(" .")
        if p and p.lower() not in EMPTY and p not in out:
            out.append(p[0].upper() + p[1:])
    return out


# ---- Campus facts ----
ws = wb["Campus facts"]
rows = list(ws.iter_rows(values_only=True))
hdr = next(r for r in rows if r[1] == "Fact we need")
facts = {}
for i, h in enumerate(hdr):
    if i < 4 or not h:
        continue
    d = {}
    for r in rows:
        if r[1] and r[1] != "Fact we need" and i < len(r):
            d[r[1].strip()] = clean(r[i]) if not isinstance(r[i], str) else clean(r[i].replace("\n", " | "))
    facts[h] = d

# ---- Admissions 2027-28 ----
ws = wb["Admissions 2027-28"]
arows = list(ws.iter_rows(values_only=True))
ahdr = next(r for r in arows if r[1] == "Fact we need")
adm = {}
for i, h in enumerate(ahdr):
    if i < 3 or not h:
        continue
    adm[h] = {r[1]: clean(r[i]) for r in arows if r[1] and r[1] != "Fact we need" and i < len(r)}

# ---- Fees 2027-28 ----
ws = wb["Financials NEW"]
frows = {r[0]: r for r in ws.iter_rows(values_only=True) if r[0]}
col = {c: i for i, c in enumerate("ABCDEFGHIJKLMNO")}
GRADES = ["Pre-KG", "Nursery", "Junior KG", "Senior KG"] + [f"Grade {n}" for n in range(1, 13)]


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def fee_block(letter):
    c = col[letter]
    def one(label):
        return num(frows[label][c]) if label in frows else None
    annual_rows, tuition_rows = {}, {}
    # The workbook lists each grade twice: annual fee (rows 14-29) then tuition (rows 32-47).
    seen = {}
    for r in ws.iter_rows(values_only=True):
        if r[0] in GRADES:
            seen[r[0]] = seen.get(r[0], 0) + 1
            (annual_rows if seen[r[0]] == 1 else tuition_rows)[r[0]] = num(r[c])
    return {
        "registration": one("Registration Fee (form fee)"),
        "admission": one("Admission Fee (seat-blocking fee)"),
        "prospectus": one("Prospectus Fee (physical brochure)"),
        "rows": [(g, tuition_rows.get(g), annual_rows.get(g)) for g in GRADES if tuition_rows.get(g)],
    }


def fee_table(blocks, labels=None, only=None, tag=None):
    """blocks: list of (letter, board tag or None). Returns grade rows and one-time fees."""
    rows, onetime = [], {}
    for letter, board in blocks:
        b = fee_block(letter)
        for g, tuition, annual in b["rows"]:
            if only and g not in only:
                continue
            label = (labels or {}).get(g, g)
            if board:
                label += f" ({board})"
            row = {"grade": label, "tuition": tuition}
            if annual:
                row["annual"] = annual
            rows.append(row)
        for k in ("prospectus", "registration", "admission"):
            if b[k]:
                onetime.setdefault(k, set()).add(b[k])
    one = {k: sorted(v)[0] if len(v) == 1 else None for k, v in onetime.items()}
    return rows, one


VIK_LABELS = {"Pre-KG": "Playgroup", "Junior KG": "Jr KG", "Senior KG": "Sr KG"}


def details(f, extra=()):
    out = []
    def add(k, v):
        if v:
            out.append([k, v])
    add("Official name", f.get("Full official school name"))
    addr = f.get("Full postal address, as on official records")
    pin = f.get("PIN code")
    if addr and pin and pin not in addr:
        addr = f"{addr} {pin}"
    add("Address", addr)
    add("Landmark", f.get("Nearest landmark parents use"))
    add("Admissions phone", f.get("Admissions phone"))
    wa = f.get("WhatsApp number for admissions")
    if wa and wa != f.get("Admissions phone"):
        add("WhatsApp", wa)
    rec = f.get("Main reception phone")
    if rec and rec != f.get("Admissions phone"):
        add("Reception", rec)
    add("Admissions email", f.get("Admissions email"))
    mf, sat = f.get("Office hours, Monday to Friday"), f.get("Office hours, Saturday")
    if mf:
        add("Office hours", f"Mon–Fri {mf}" + (f"; Sat {sat}" if sat else ""))
    p, t = f.get("Principal — full name"), f.get("Principal — exact title")
    if p:
        add(t or "Principal", p)
    add("Vice principal", f.get("Vice principal — name"))
    add("Head of admissions", f.get("Head of admissions — name"))
    add("Established", f.get("Year this school was established"))
    add("CBSE affiliation no.", f.get("CBSE affiliation number"))
    langs = ", ".join(x for x in [f.get("Second language offered"), f.get("Third language offered")] if x)
    add("Languages (2nd, 3rd)", langs)
    add("Streams (Grades 11–12)", f.get("Streams at senior secondary"))
    s, tch = f.get("Students currently enrolled"), f.get("Number of teachers")
    if s:
        add("Students", s + (f" · {tch} teachers" if tch else ""))
    add("Student–teacher ratio", f.get("Student–teacher ratio"))
    size = f.get("Campus size, acres")
    add("Campus size", size + " acre" if size and re.fullmatch(r"[\d.]+", size) else size)
    meals = f.get("Meals provided (Y/N)")
    if meals:
        add("Meals provided", {"Y": "Yes", "N": "No"}.get(meals.upper(), meals))
    for k, v in extra:
        add(k, v)
    return out


def admissions(a):
    if not a:
        return []
    keys = [("Admissions open date, 2027-28", "Admissions open"), ("Admissions close date, 2027-28", "Admissions close"),
            ("Age cut-off date", "Age cut-off"), ("Assessment or interaction format", "Assessment"),
            ("Documents required at application", "Documents"), ("Free or scholarship seat policy", "Scholarships"),
            ("How a parent books a campus visit", "Booking a visit"), ("Who handles enquiries at this campus", "Enquiries handled by")]
    return [[lbl, a[k]] for k, lbl in keys if a.get(k)]


def facility_rows(f):
    out = []
    fac = split_list((f.get("Key facilities — list") or "").replace("Music & Performing Arts:", "|"))
    if fac:
        out.append(["Facilities", fac])
    sp = split_list(f.get("Sports facilities — list"))
    if sp:
        out.append(["Sports", sp])
    return out


def awards(f):
    a = f.get("Awards or recognitions — name, year, awarding body")
    return [x.strip(" *") for x in re.split(r"\s*\*\s*", a or "") if x.strip(" */")]


def routes(campus_key):
    out = []
    for r in wb["Transport routes"].iter_rows(values_only=True):
        if r[0] and str(r[0]).strip().upper().startswith(campus_key) and r[1]:
            no = re.sub(r"(?i)route no\.?\s*", "", str(r[1])).strip()
            area = clean(r[2])
            pick, drop = clean(r[4]), clean(r[5])
            if area:
                out.append([no, area.replace("/", ", ").replace(" ,", ","), pick or "", drop or ""])
    return out


NO_HOSTEL = "No hostel facility at any GEMS campus. Day school only."


CATS = ["Labs and learning", "Performing arts", "Life skills", "Indoor sports", "Outdoor sports", "Campus and safety"]
KW = [
    ("Campus and safety", ["auditorium", "classroom", "cctv", "rfid", "sen ", "infirmary", "cafeteria", "mph", "corridor", "architecture", "bala", "newspaper"]),
    ("Performing arts", ["music", "dance", "drama", "theatre", "keyboard", "piano", "guitar", "ukulele", "drums", "sitar", "vocal", "public speaking", "media lab"]),
    ("Life skills", ["pottery", "culinary", "carpentry", "fashion", "art room", "art,"]),
    ("Outdoor sports", ["football", "cricket", "athletic", "track", "tennis court", "volleyball", "throwball", "turf", "play area", "long jump", "swimming", "pool", "pickleball", "padel", "shooting", "mountaineering", "wall climbing", "basketball"]),
    ("Indoor sports", ["table tennis", "chess", "carrom", "skating", "martial", "boxing", "yoga", "gym", "taekwondo", "indoor sports", "badminton"]),
]


def categorise(items):
    out = {k: [] for k in CATS}
    for it in items:
        low = it.lower() + " "
        cat = next((c for c, kws in KW if any(k in low for k in kws)), "Labs and learning")
        if cat == "Outdoor sports" and "table tennis" in low:
            cat = "Indoor sports"
        out[cat].append(it)
    return [[k, v] for k, v in out.items()]


NO_HOSTEL = "No hostel facility at any GEMS campus. Day school only."
EXAM_BOARDS = {"CBSE": "CBSE", "ICSE": "ICSE", "Cambridge": "Cambridge", "IB": "IB"}


def campus(slug, brand, short, city, fkey, blocks, labels=None, only=None, **_):
    f = facts.get(fkey, {})
    rows, one = fee_table(blocks, labels, only)
    boards = []
    for _, b in blocks:
        if b and b not in boards:
            boards.append(b)
    if not boards:
        boards = [x.strip() for x in re.split(r",|and", f.get("Board(s) offered") or "CBSE") if x.strip()][:1] or ["CBSE"]
    name = (f.get("Full official school name") or short).split(",")[0].strip()
    items = []
    for _, lst in facility_rows(f):
        items += lst
    # Kept only for the record; the Vikhroli template has no column for these.
    not_shown = {k: v for k, v in {"annualFee": next((r["annual"] for r in rows if r.get("annual")), None), "prospectusFee": one.get("prospectus")}.items() if v}
    return {
        "slug": slug, "live": True, "brand": brand, "name": name, "short": short, "city": city,
        "updated": "30 Oct 2026",
        "board": " and ".join(boards),
        "grades": f"{rows[0]['grade'].split(' (')[0]} to {rows[-1]['grade'].split(' (')[0]}" if rows else None,
        "keyNotes": [NO_HOSTEL],
        "feeRows": [{"grade": r["grade"], "tuition": r["tuition"]} for r in rows],
        "applicationFee": one.get("registration"),
        "admissionFee": one.get("admission"),
        "extraFees": [{"key": "Uniform", "cell": None, "max": None}, {"key": "Books", "cell": None, "max": None}] +
                     [{"key": f"{b} examination fee", "cell": None, "max": None} for b in boards],
        "transport": [["0 – 1 km", None], ["1 – 3 km", None], ["3 – 5 km", None], ["5 – 8 km", None], ["8 km and above", None]],
        "bus": [["Bus type", None], ["Attendant", None], ["GPS tracking", None], ["CCTV in bus", None]],
        "facilities": categorise(items),
        "curriculum": None,
        "notShown": not_shown,
    }


C = []
C.append(campus("gurugram", "GMS", "GMS Gurugram", "Gurugram", "Gurugram", [("B", None)], akey="Gurugram"))
C.append(campus("indirapuram", "GMS", "GMS Indirapuram", "Indirapuram, Ghaziabad", "Indirapuram", [("J", None)], akey="Indirapuram",
                only=GRADES[:12], notes=["First session 2027–28 runs up to Grade 8. Grades 9 to 12 open in later years."]))
C.append(campus("kalyan", "GMS", "GMS Kalyan", "Kalyan", "Kalyan", [("O", None)]))
C.append(campus("kochi-gms", "GMS", "GMS Kochi", "Kochi", "Millennium Kochi", [("E", None)]))
C.append(campus("varanasi", "GMS", "GMS Varanasi", "Varanasi", "Varanasi", [("I", None)]))
C.append(campus("lucknow", "GSE", "GSE Lucknow", "Lucknow SCR", "Lucknow", [("F", None)], akey="Lucknow", route_key="LUCKNOW"))
C.append(campus("jodhpur", "GSE", "GSE Jodhpur", "Jodhpur", "Jodhpur", [("G", None)], akey="Jodhpur", route_key="JODHPUR"))
C.append(campus("kochi-gma", "GMA", "GMA Kochi", "Kochi", "Modern Academy Kochi", [("D", "IB"), ("C", "Cambridge")], route_key="GEMS MODERN ACADEMY KOCHI"))
C.append(campus("coimbatore", "GMA", "GMA Coimbatore", "Coimbatore", "Coimbatore", [("K", "CBSE"), ("L", "IB")]))

# Vikhroli: 2027-28 fees from the workbook plus the hand-checked Word-file details.
v = campus("vikhroli", "GMS", "GMS Vikhroli", "Vikhroli, Mumbai", "Vikhroli", [("M", "ICSE"), ("N", "Cambridge")], labels=VIK_LABELS)
v["keyNotes"].append("Book and uniform samples are available at school for parents to see.")
# Vikhroli keeps exactly the approved Word-file figures (Playgroup to Grade 7).
E, P = ("9:30 am – 1:30 pm", "8:00 am – 3:00 pm")
v["feeRows"] = [{"grade": g, "tuition": t, "max": m, "ratio": r, "timings": tm} for g, t, m, r, tm in [
    ("Playgroup", 149000, 24, "12:1", E), ("Nursery", 160000, 24, "12:1", E), ("Jr KG", 172000, 24, "12:1", E), ("Sr KG", 183000, 24, "12:1", E),
    ("Grade 1", 210000, 24, "12:1", P), ("Grade 2", 220000, 30, "12:1", P), ("Grade 3", 232000, 30, "30:1", P), ("Grade 4", 243000, 30, "30:1", P),
    ("Grade 5", 255000, 30, "30:1", P), ("Grade 6 (ICSE)", 255000, 30, "30:1", P), ("Grade 7 (ICSE)", 255000, 30, "30:1", P),
    ("Grade 6 (Cambridge)", 287000, 30, "30:1", P), ("Grade 7 (Cambridge)", 287000, 30, "30:1", P)]]
v["applicationFee"], v["admissionFee"] = 2000, 40000
v["grades"] = "Playgroup to Grade 7"
v["board"] = "ICSE and Cambridge"
v["extraFees"] = [
    {"key": "Uniform", "cell": "Up to 10K", "max": 10000},
    {"key": "Books", "cell": "8K – 10K", "max": 10000},
    {"key": "ICSE examination fee", "cell": "≈ 4K – 5K", "max": None},
    {"key": "Cambridge examination fee", "cell": "≈ 8K – 10K / subject", "max": None},
]
v["transport"] = [["0 – 1 km", 15000], ["1 – 3 km", 24000], ["3 – 5 km", 30000], ["5 – 8 km", 40000], ["8 km and above", 60000]]
v["bus"] = [["Bus type", "AC buses"], ["Attendant", "1 per bus"], ["GPS tracking", "Yes"], ["CCTV in bus", "Yes"]]
v["facilities"] = [
    ["Labs and learning", ["Physics lab", "Chemistry lab", "Biology lab", "Eurisko Lab", "Montessori Lab", "Robotics and coding", "Computer lab", "Design lab", "Atelier", "Library"]],
    ["Performing arts", ["Western and Indian dance", "Music (Torrence): keyboard, guitar, percussion lab, tabla and drums", "Theatre and drama"]],
    ["Life skills", ["Pottery", "Culinary", "Carpentry"]],
    ["Indoor sports", ["Basketball", "Yoga", "Taekwondo", "Gymnastics", "Table tennis", "Chess", "Skating", "Physical education"]],
    ["Outdoor sports", ["Cricket nets", "Turf", "Badminton", "Play area"]],
    ["Campus and safety", ["Auditorium", "AC classrooms", "CCTV", "RFID", "SEN room", "Infirmary"]],
]
v.pop("notShown", None)
v["curriculum"] = {
    "icse": {"title": "ICSE subject groups · Grades 9 and 10", "note": "Set by CISCE. Final choices depend on what the school offers and CISCE rules.", "groups": [
        ["Group I", "Compulsory, take all", "English, Second language (Hindi, Marathi or another approved language), History, Civics and Geography"],
        ["Group II", "Electives, pick 2 or 3", "Mathematics, Science (Physics, Chemistry, Biology), Economics, Commercial Studies, Environmental Science, French"],
        ["Group III", "Skill based, pick 1 or 2", "Computer Applications, Economic Applications, Commercial Applications, Art, Performing Arts, Physical Education, Yoga, Environmental Applications"]]},
    "igcse": {"title": "Cambridge IGCSE subject groups", "note": "Subjects that can be offered, grouped the Cambridge way for subject selection.", "groups": [
        ["Group 1", "Languages", "English (First Language), English (Second Language), Hindi, French"],
        ["Group 2", "Humanities and social sciences", "History, Geography, Global Perspectives"],
        ["Group 3", "Sciences", "Biology, Chemistry, Physics"],
        ["Group 4", "Mathematics", "Mathematics"],
        ["Group 5", "Professional and creative", "Art and Design, Computer Science, ICT, Business Studies, Economics, Accounting"]]},
}
# Jay, 31 Oct 2026: Coimbatore stops at Grade 8 for 2027-28.
_hi = {"Grade 9", "Grade 10", "Grade 11", "Grade 12"}
for c in C:
    if c["slug"] == "coimbatore":
        c["feeRows"] = [fr for fr in c["feeRows"] if fr["grade"].split(" (")[0] not in _hi]
        c["grades"] = "Nursery to Grade 8"
# Jay, 31 Oct 2026: GMA Kochi Pre EY = Nursery, EYP 1 = Junior KG, EYP 2 = Senior KG; MYP rows are the IB class size for Grades 6-9.
GMA_KOCHI_MAX = {"Nursery (IB)": 20, "Junior KG (IB)": 18, "Senior KG (IB)": 25,
                 **{f"Grade {g} (IB)": 30 for g in range(1, 6)}, **{f"Grade {g} (IB)": 20 for g in range(6, 10)},
                 **{f"Grade {g} (Cambridge)": 30 for g in range(6, 9)}, "Grade 9 (Cambridge)": 20,
                 "Grade 10 (IB)": 29, "Grade 10 (Cambridge)": 29, "Grade 11 (IB)": 20, "Grade 11 (Cambridge)": 20,
                 "Grade 12 (IB)": 20, "Grade 12 (Cambridge)": 20}
for c in C:
    if c["slug"] == "kochi-gma":
        for fr in c["feeRows"]:
            if fr["grade"] in GMA_KOCHI_MAX: fr["max"] = GMA_KOCHI_MAX[fr["grade"]]

# Max students per class, from the "School Capacities" sheet of the GEMS CRM Requirements workbook (31 Oct 2026).
# GMA Kochi is left out: its sheet uses PYP/MYP/CIE labels that don't map cleanly to the page's rows.
CAP_SCHOOL = {"Gurgaon": "gurugram", "Millenium School Kochi": "kochi-gms", "Lucknow": "lucknow", "Jodhpur": "jodhpur",
              "Varanasi": "varanasi", "Indirapuram": "indirapuram", "Coimbatore": "coimbatore", "Kalyan": "kalyan"}
if len(sys.argv) > 3:
    import openpyxl as _ox
    ws = _ox.load_workbook(sys.argv[3], data_only=True)["School Capacities"]
    caps, cur = {}, None
    for r in range(18, ws.max_row + 1):
        a, b, c3 = (ws.cell(r, k).value for k in (1, 2, 3))
        if a and b is None and c3 is None and "Grade" not in str(a):
            cur = next((v for k, v in CAP_SCHOOL.items() if k in str(a)), None)
        elif cur and a and isinstance(c3, (int, float)):
            g = re.sub(r" (Science|Commerce|Humanities)$", "", str(a).strip()).replace("Pre-Kindergarten", "Pre-KG")
            caps.setdefault(cur, {})[g] = int(c3)
    for c in C:
        for fr in c["feeRows"]:
            m = caps.get(c["slug"], {}).get(fr["grade"].split(" (")[0])
            if m: fr["max"] = m
C.insert(0, v)
for c in C:
    if c["slug"] == "coimbatore":
        c["name"] = "GEMS Modern Academy"
with open(sys.argv[2], "w") as fh:
    fh.write("// Generated from the GEMS school facts workbook (AOD 6 Oct 2026) plus the Vikhroli Word file.\n"
             "// Edit values here directly; run `node build-pdfs.mjs` afterwards to rebuild the PDFs.\n"
             "// Brand: \"GMS\" (maroon), \"GSE\" (navy), \"GMA\" (gold).\n")
    fh.write("window.CAMPUSES = " + json.dumps(C, ensure_ascii=False, indent=1) + ";\n")
for c in C:
    print(c["slug"], len(c["feeRows"]), c["applicationFee"], c["admissionFee"], c["grades"], "|", c["board"], "|", c.get("notShown"), [len(x[1]) for x in c["facilities"]])
