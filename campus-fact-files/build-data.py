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


def campus(slug, brand, short, city, fkey, blocks, akey=None, route_key=None, labels=None, only=None, notes=(), extra=()):
    f = facts.get(fkey, {})
    rows, one = fee_table(blocks, labels, only)
    kn = [NO_HOSTEL]
    former = f.get("Former name still used by parents")
    if former:
        kn.append(f"Parents may know it by its former name, {former}.")
    kn += list(notes)
    gfrom, gto = f.get("Grades offered, from"), f.get("Grades offered, to")
    name = (f.get("Full official school name") or short).split(",")[0].strip()
    radius = f.get("Transport radius covered, km")
    return {
        "slug": slug, "live": True, "brand": brand, "name": name, "short": short, "city": city,
        "updated": "30 Oct 2026", "feeYear": "2027–28",
        "board": (f.get("Board(s) offered") or "").replace(" ,", ",").strip() or None,
        "grades": f"{rows[0]['grade'].split(' (')[0]} to {rows[-1]['grade'].split(' (')[0]}" if rows else None,
        "keyNotes": kn,
        "feeRows": rows,
        "oneTime": one,
        "transportNote": f"School transport covers about {radius} around the campus." if radius else None,
        "routes": routes(route_key) if route_key else [],
        "details": details(f, extra),
        "admissions": admissions(adm.get(akey)) if akey else [],
        "facilities": facility_rows(f),
        "awards": awards(f),
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
v = campus("vikhroli", "GMS", "GMS Vikhroli", "Vikhroli, Mumbai", "Vikhroli", [("M", "ICSE"), ("N", "Cambridge")], labels=VIK_LABELS,
           notes=["Book and uniform samples are available at school for parents to see."])
for r in v["feeRows"]:
    early = r["grade"].split(" (")[0] in ("Playgroup", "Nursery", "Jr KG", "Sr KG")
    g = r["grade"].split(" (")[0]
    small = early or g == "Grade 1"
    r["max"] = 24 if small else 30
    r["ratio"] = "12:1" if small or g == "Grade 2" else "30:1"
    r["timings"] = "9:30 am – 1:30 pm" if early else "8:00 am – 3:00 pm"
    if r["grade"].endswith("(ICSE)") and g in ("Playgroup", "Nursery", "Jr KG", "Sr KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4"):
        r["grade"] = g  # only one board for these grades
v["grades"] = "Playgroup to Grade 8"
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
C.insert(0, v)
BOARD = {"kochi-gma": "IB (PYP, MYP) and Cambridge (IGCSE)", "coimbatore": "CBSE and IB"}
for c in C:
    if c["slug"] == "coimbatore":
        c["name"] = "GEMS Modern Academy"
    c["board"] = BOARD.get(c["slug"], (c["board"] or "").replace(", ", " and "))

with open(sys.argv[2], "w") as fh:
    fh.write("// Generated from the GEMS school facts workbook (AOD 6 Oct 2026) plus the Vikhroli Word file.\n"
             "// Edit values here directly; run `node build-pdfs.mjs` afterwards to rebuild the PDFs.\n"
             "// Brand: \"GMS\" (maroon), \"GSE\" (navy), \"GMA\" (gold).\n")
    fh.write("window.CAMPUSES = " + json.dumps(C, ensure_ascii=False, indent=1) + ";\n")
for c in C:
    print(c["slug"], len(c["feeRows"]), c["oneTime"], c["grades"], "| board:", c["board"], "| details", len(c["details"]), "adm", len(c["admissions"]), "routes", len(c["routes"]), "awards", len(c["awards"]))
