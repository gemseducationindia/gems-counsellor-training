"""Apply a filled-in "Campus Fact Files - Data Needed" workbook to campuses.js.

Usage: python3 apply-school-sheet.py <filled workbook.xlsx> campuses.js [--date "4 Nov 2026"] [--prev <previous filled workbook.xlsx>]
(--prev lets an edit to the "On the page now" facilities column win over the older "Correct / complete list".)

Rules (Jay, Nov 2026):
- What the school wrote wins. A cell left blank in the sheet stays blank on the page (no guessing).
- Exceptions are listed in OVERRIDES below, each with the reason, so they can be dropped once the
  school sends a corrected sheet.
- GMS Vikhroli keeps the original Word-file fact file; the "GMS Vikhroli" tab is skipped because it
  is a copy of the Kalyan tab.
"""
import datetime as dt
import json
import re
import sys

import openpyxl

TABS = {
    "GMS Gurugram": "gurugram", "GMS Indirapuram": "indirapuram", "GMS Kalyan": "kalyan",
    "GMS Kochi": "kochi-gms", "GMS Varanasi": "varanasi", "GSE Lucknow": "lucknow",
    "GSE Jodhpur": "jodhpur", "GMA Kochi": "kochi-gma", "GMA Coimbatore": "coimbatore",
}

# Deliberate departures from the sheet, each with its reason.
OVERRIDES = {
    # The "max per class" column holds whole-grade enrolment (e.g. 127 in Grade 3), not class size.
    "keep_old_max": {"gurugram", "kochi-gma"},
    "blank_ratio": set(),
    # Ratio typed as "2:1" / "4:1"; Jay confirmed 4 Nov 2026 it means 20:1 and 40:1.
    "ratio_map": {"indirapuram": {"2:1": "20:1", "4:1": "40:1"}},
    # The stop table was cleared and replaced with one unclear line; keep the 15 routes already shown.
    "keep_old_routes": {"lucknow", "jodhpur"},
    # Rows the school says do not run in 2027-28.
    "drop_grades": {"jodhpur": {"Grade 11", "Grade 12"}},
    "grades_text": {"jodhpur": "Pre-KG to Grade 10"},
    "board": {"varanasi": "CBSE and IB"},
    # 3rd sheet added labels ("CIE", "IGCSE", "IBDP") inside the board column; subjects unchanged, keep the tables.
    "keep_old_curriculum": {"kochi-gma"},  # answered "yes" to "Is IB offered in 2027-28?"
}

TYPO = {
    "Instruments Western": "Instruments, Western", "drums Sitar": "drums, Sitar", "Torrence": "Torrins",
    "4 Nos Picke Ball, Courts": "4 pickleball courts", "Nos Picke Ball, Courts": "Pickleball courts",
    "Badmintton": "Badminton", "Badinton": "Badminton", "Brittanica": "Britannica",
    "Fooseball": "Foosball", "Literrature": "Literature", "Prespectives": "Perspectives",
    "Mathermatics": "Mathematics", "Picke Ball": "Pickleball", "TT": "Table tennis",
}
DROP_ITEMS = {"Design a"}  # cut off mid-word in the Varanasi tab
SAMPLES_NOTE = "Book and uniform samples are available at school for parents to see."


def clean(v):
    if v is None:
        return None
    if isinstance(v, str):
        v = re.sub(r"[ \s]+", " ", v).strip().strip("`").strip()
        for a, b in TYPO.items():
            v = re.sub(r"\b%s\b" % re.escape(a), b, v)
        return v or None
    return v


def is_na(v):
    return isinstance(v, str) and v.strip().lower() in {"na", "n/a", "nil", "to be finalised", "tbd", "yet to decide", "yet to deicide"}


def num(v):
    """Number from a cell: int, '₹42,000', '=5400*4'. None if not a number."""
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return int(round(v))
    if isinstance(v, str):
        s = v.replace("₹", "").replace(",", "").strip()
        m = re.fullmatch(r"=?\s*(\d+(?:\.\d+)?)\s*(?:\*\s*(\d+(?:\.\d+)?))?", s)
        if m:
            return int(round(float(m.group(1)) * float(m.group(2) or 1)))
    return None


def inr(n):
    s = str(n)
    if len(s) <= 3:
        return s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return ",".join(parts) + "," + tail


def clock(t, pm=None):
    """'7:05 am' from a time object or text; pm=True/False forces the half of the day."""
    if isinstance(t, dt.time):
        h, m = t.hour, t.minute
        suf = "pm" if h >= 12 else "am"
        h = h % 12 or 12
        return f"{h}:{m:02d} {suf}"
    t = clean(t)
    if not t:
        return None
    low = t.lower()
    suf = "a" if re.search(r"a\.?\s*m", low) else "p" if re.search(r"p\.?\s*m", low) else None
    digits = re.sub(r"[ap]\.?\s*m\.?", "", low).replace(".", ":").strip()
    m = re.fullmatch(r"(\d{1,2})(?::(\d{2}))?(?::\d{2})?", digits) or re.fullmatch(r"(\d{1,2})(\d{2})", digits)
    if not m:
        return t
    h, mi = int(m.group(1)), int(m.group(2) or 0)
    if suf is None:
        suf = "p" if (pm if pm is not None else (h < 7 or h == 12)) else "a"
    return f"{h}:{mi:02d} {suf}m"


def timings(v):
    v = clean(v)
    if not v:
        return None
    parts = re.split(r"\s*(?:-|–|to)\s*", v, maxsplit=1)
    if len(parts) != 2:
        return v
    a = clock(parts[0], pm=False)
    b = clock(parts[1], pm=None)
    return f"{a} – {b}"


def ratio(v):
    if v is None or is_na(v):
        return None
    if isinstance(v, dt.time):  # Excel read "1:30" as a time
        h, m = v.hour, v.minute
        return f"{m}:1" if h == 1 else f"{h}:{m}"
    if isinstance(v, dt.timedelta):  # Excel read "40:1" as 40 hours 1 minute
        h, m = int(v.total_seconds() // 3600), int(v.total_seconds() % 3600 // 60)
        return f"{h}:{m}"
    if isinstance(v, (int, float)):
        return f"{int(v)}:1"
    s = clean(v)
    if re.fullmatch(r"\d+\s*:\s*\.\d", s):  # "30:.1", "15:.2" typed for 30:1 / 15:1
        return s.split(":")[0].strip() + ":1"
    m = re.fullmatch(r"(\d+)\s*[/:]\s*(\d+)", s)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        if b and a >= b:
            q = a / b
            return f"{q:g}:1"
        return f"{a}:{b}"
    return s


def yes_no(v):
    v = clean(v)
    if not v or is_na(v):
        return None
    low = v.lower()
    if low in {"yes", "y"}:
        return "Yes"
    if low in {"no", "n"}:
        return "No"
    if low in {"ac", "ac bus", "ac type"}:
        return "AC"
    return v


def items(v):
    v = clean(v)
    if not v or v.lower() in {"yes", "no", "na"}:
        return []
    # Keep "Music (Torrins): keyboard, guitar, ..." as one item.
    keep = re.findall(r"Music \([^)]*\):[^,]*(?:,[^,:]*?)*?drums", v)
    for i, k in enumerate(keep):
        v = v.replace(k, f"@@{i}@@")
    out, seen = [], set()
    for x in v.split(","):
        x = clean(x)
        for i, k in enumerate(keep):
            x = x.replace(f"@@{i}@@", k) if x else x
        if x and len(x) > 1 and x.lower() not in seen:
            seen.add(x.lower())
            out.append(x)
    return out


def find_row(ws, text, start=1):
    for r in range(start, ws.max_row + 1):
        a = ws.cell(r, 1).value
        if isinstance(a, str) and a.strip().lower().startswith(text.lower()):
            return r
    return None


def km(v):
    v = clean(v)
    if not v:
        return None
    v = v.lstrip(". ")
    v = re.sub(r"\s*(km|KM|Km)\b", " km", v)
    v = re.sub(r"(\d)\s*M\b", r"\1 m", v)
    return v.strip()


def slab(v):
    v = clean(v)
    if not v:
        return None
    v = re.sub(r"\s*(?:-|–)\s*", " – ", v)
    v = re.sub(r"\.km", " km", v)
    if v.lower().startswith("above") and "km" not in v:
        v += " km"
    return v


def ride(v):
    v = clean(v)
    if not v:
        return None
    v = re.sub(r"(\d)\s*hr\s*:?\s*", r"\1 hr ", v)
    v = re.sub(r"\bminutes\b", "min", v)
    return v.strip()

def pick_fac(prev_b, b, f):
    """Column F (corrected list) wins, unless the school edited column B since the previous sheet."""
    norm = lambda xs: [clean(x).lower() for x in (xs or [])]
    if f is not None and (prev_b is None or norm(b) == norm(prev_b) or not b):
        return f
    return b


def same_fac(a, b):
    """True when a facilities row (B list, F list) is unchanged between two sheets, in any column layout."""
    if a is None:
        return False
    norm = lambda xs: [clean(x).lower() for x in (xs or [])]
    pick = lambda bf: norm(bf[1]) if bf[1] else norm(bf[0])
    return pick(a) == pick(b)


def read_tab(ws):
    out = {}
    # 1. Fees
    hdr = find_row(ws, "Grade")
    heads = [clean(ws.cell(hdr, c).value) for c in range(1, ws.max_column + 1)]
    col = {h: i + 1 for i, h in enumerate(heads) if h}
    rows = []
    r = hdr + 1
    while True:
        g = ws.cell(r, 1).value
        if g is None or (isinstance(g, str) and g.startswith("Application, admission")):
            break
        rows.append({h: ws.cell(r, c).value for h, c in col.items()})
        r += 1
    out["heads"], out["rows"] = heads, rows
    # 2. Transport slabs
    t = find_row(ws, "Distance slab")
    slabs = []
    r = t + 1
    while ws.cell(r, 1).value and not str(ws.cell(r, 1).value).startswith("3."):
        slabs.append((clean(ws.cell(r, 1).value), num(ws.cell(r, 2).value)))
        r += 1
    out["slabs"] = slabs
    # 3. Bus
    b = find_row(ws, "Bus type")
    out["bus"] = [(clean(ws.cell(b + i, 1).value), yes_no(ws.cell(b + i, 2).value)) for i in range(4)]
    # 4. Facilities (column F "Correct / complete list" wins unless it just says yes)
    f = find_row(ws, "Labs and learning")
    fac = []
    for i in range(6):
        area = clean(ws.cell(f + i, 1).value)
        bv = ws.cell(f + i, 2).value
        fv = ws.cell(f + i, 6).value
        if fv is None:
            fv = ws.cell(f + i, 4).value if clean(ws.cell(f - 1, 4).value or "") else None
        # B is "On the page now" and F the corrected list; when a school edits B itself, B is newer.
        fi = items(fv) if (clean(fv) and clean(fv).lower() not in {"yes", "y"}) else None
        fac.append([area, items(bv), fi])
    out["facilities"] = fac

    # 5. Technology
    s = find_row(ws, "Smart boards")
    out["technology"] = [[clean(ws.cell(s + i, 1).value), yes_no(ws.cell(s + i, 2).value)] for i in range(3)]
    # 6. Tie-ups
    tu = find_row(ws, "Area (e.g. cricket")
    ties = []
    r = tu + 1
    while ws.cell(r, 1).value and clean(ws.cell(r, 2).value) and not str(ws.cell(r, 1).value).startswith("Bus reaches"):
        ties.append([clean(ws.cell(r, 1).value), clean(ws.cell(r, 2).value)])
        r += 1
    out["tieups"] = ties
    # 7. Bus band + stop list
    band = find_row(ws, "Bus reaches school")
    out["band"] = [None if is_na(ws.cell(band + 1, c).value) else ws.cell(band + 1, c).value for c in (1, 2, 3)] if band else [None] * 3
    st = find_row(ws, "Stop", band or 1)
    sh = {clean(ws.cell(st, c).value): c for c in range(1, ws.max_column + 1) if ws.cell(st, c).value}
    stops = []
    r = st + 1
    while r <= ws.max_row:
        a = ws.cell(r, 1).value
        if isinstance(a, str) and (a.startswith("Routes already") or a.startswith("Board") or re.match(r"\d+\. ", a)):
            break
        get = lambda h: ws.cell(r, sh[h]).value if h in sh else None
        if clean(get("Pickup point / area")) and not is_na(clean(get("Pickup point / area"))):
            stops.append({
                "stop": clean(str(a)) if a is not None else None,
                "area": clean(get("Pickup point / area")),
                "landmark": clean(get("Nearest landmark")),
                "route": clean(re.sub(r"(?i)^route\s*", "", str(get("Route")))) if get("Route") else None,
                "dist": km(get("Distance from school (km)")),
                "slab": slab(get("Fee slab")),
                "fee": num(get("Annual transport fee (₹)")),
                "pick": clock(get("Morning pick-up")) if clean(get("Morning pick-up")) or isinstance(get("Morning pick-up"), dt.time) else None,
                "drop": clock(get("Afternoon drop"), pm=True) if clean(get("Afternoon drop")) or isinstance(get("Afternoon drop"), dt.time) else None,
                "ride": ride(get("Ride time")),
            })
        r += 1
    out["stops"] = stops
    # 8. Subject groups
    out["groups"] = []
    g = find_row(ws, "Board", st or 1)
    if g:
        r, cur = g + 1, None
        while r <= ws.max_row and not str(ws.cell(r, 1).value or "").startswith("9."):
            a, b_, c_, e = (clean(ws.cell(r, k).value) for k in (1, 2, 3, 5))
            if a:
                cur = a
            if e and e.upper() != "NA":
                out["groups"].append([cur, b_, c_, e])
            r += 1
    # 9. Samples note
    n = find_row(ws, "Book and uniform samples")
    out["samples"] = clean(ws.cell(n, 5).value) if n else None
    return out


def extra_cell(vals):
    """Display text and upper figure for one extra fee cell (or a list of uniform parts)."""
    if all(v is None or is_na(v) for v in vals):
        return None
    ns = [num(v) for v in vals]
    if all(n is not None for n in ns):
        tot = sum(ns)
        return {"cell": inr(tot) if tot else "–", "max": tot}
    if all((n == 0) or (isinstance(v, str) and v.strip() in {"-", "–"}) for v, n in zip(vals, ns)):
        return {"cell": "–", "max": 0}
    return None


def apply(c, d, date, prev=None):
    slug = c["slug"]
    changes = []
    old = json.loads(json.dumps(c))
    rows = [r for r in d["rows"]]
    keep_rows = [fr for fr in c["feeRows"] if fr["grade"] not in OVERRIDES["drop_grades"].get(slug, set())]
    if len(rows) > len(keep_rows):
        rows = rows[:len(keep_rows)]
    assert len(rows) == len(keep_rows), (slug, len(rows), len(keep_rows))
    heads = [h for h in d["heads"] if h]
    unif = [h for h in heads if h.startswith("Uniform")]
    books = [h for h in heads if h.startswith("Books")]
    exams = [h for h in heads if "examination fee" in h]
    ex_keys = (["Uniform"] if unif else []) + (["Books"] if books else []) + [h.replace(" (₹)", "") for h in exams]
    app = {num(r.get("Application fee (₹)")) for r in rows} - {None}
    adm = {num(r.get("Admission fee (₹)")) for r in rows} - {None}
    if len(app) == 1:
        c["applicationFee"] = app.pop()
    if len(adm) == 1:
        c["admissionFee"] = adm.pop()
    new_rows = []
    for fr, r in zip(keep_rows, rows):
        nr = {"grade": fr["grade"]}
        tu = r.get("Annual tuition (₹)")
        nr["tuition"] = num(tu)
        mx = num(r.get("Max students per class"))
        nr["max"] = fr.get("max") if slug in OVERRIDES["keep_old_max"] else mx
        if slug not in OVERRIDES["blank_ratio"]:
            nr["ratio"] = ratio(r.get("Student–teacher ratio"))
            nr["ratio"] = OVERRIDES["ratio_map"].get(slug, {}).get(nr["ratio"], nr["ratio"])
        nr["timings"] = timings(r.get("School timings"))
        an = num(r.get("Annual fee (₹)"))
        if an:
            nr["annual"] = an
        ex = {}
        if unif:
            u = extra_cell([r.get(h) for h in unif if "Boys" in h or len(unif) == 1])
            g = extra_cell([r.get(h) for h in unif if "Girls" in h]) if len(unif) > 1 else None
            if u and g and u["max"] != g["max"]:
                lo, hi = sorted([u["max"], g["max"]])
                u = {"cell": f"{inr(lo)} – {inr(hi)}", "max": hi}
            if u:
                ex["Uniform"] = u
        if books:
            b = extra_cell([r.get(books[0])])
            if b:
                ex["Books"] = b
        for h in exams:
            e = extra_cell([r.get(h)])
            if e:
                ex[h.replace(" (₹)", "")] = e
        nr["ex"] = ex
        new_rows.append({k: v for k, v in nr.items() if v is not None})
    c["feeRows"] = new_rows
    c["extraFees"] = [{"key": k, "cell": None, "max": None} for k in ex_keys]
    if slug in OVERRIDES["grades_text"]:
        c["grades"] = OVERRIDES["grades_text"][slug]
    if slug in OVERRIDES["board"]:
        c["board"] = OVERRIDES["board"][slug]
    # Transport slabs: replace only when the school gave at least one fee.
    if any(v is not None for _, v in d["slabs"]):
        c["transport"] = [[re.sub(r"(\d)\s*K\s*\+", r"\1 km +", re.sub(r"\s*(?:-|–)\s*", " – ", k)), v] for k, v in d["slabs"]]
    c["bus"] = [[k, v] for k, v in d["bus"]]
    oldfac = dict((a, v) for a, v in c["facilities"])
    fac = []
    prevb = {a: b for a, b, _ in prev["facilities"]} if prev else {}
    prevf = {a: (b, f) for a, b, f in prev["facilities"]} if prev else {}
    for area, b_, f_ in d["facilities"]:
        if prev and same_fac(prevf.get(area), (b_, f_)) and area in oldfac:
            fac.append([area, oldfac[area]])  # school did not touch this area since the last sheet
            continue
        its = pick_fac(prevb.get(area) if prev else None, b_, f_)
        if its and ", ".join(its) == ", ".join(items(", ".join(oldfac.get(area, [])))):
            its = [clean(i) for i in oldfac[area]]
        its = [i for i in its if i not in DROP_ITEMS]
        fac.append([area, its])
    c["facilities"] = fac
    c["technology"] = d["technology"]
    c["tieups"] = d["tieups"]
    # Routes
    if slug not in OVERRIDES["keep_old_routes"] and d["stops"]:
        R = c.get("routes") or {}
        old_rows = R.get("rows", [])
        if slug == "gurugram":
            # Senior routes already on the page match the sheet; add the new junior routes.
            have = {r_["route"] for r_ in old_rows}
            add = [s for s in d["stops"] if s["route"] not in have]
            for i, s in enumerate(add):
                s["stop"] = len(old_rows) + i + 1
            rows_ = old_rows + add
        else:
            rows_ = d["stops"]
        reach, leave, nstops = d["band"]
        c["routes"] = {
            "stops": num(nstops) if num(nstops) else None,
            "routes": len({r_["route"] for r_ in rows_ if r_.get("route")}) or None,
            "reach": (clock(reach) if isinstance(reach, dt.time) else clean(re.sub(r"(\d:\d\d):00", r"\1", str(reach)).replace("A.M.", "am").replace("P.M.", "pm"))) if reach and slug not in {"gurugram"} else None,
            "leave": (clock(leave) if isinstance(leave, dt.time) else clean(re.sub(r"(\d:\d\d):00", r"\1", str(leave)).replace("A.M.", "am").replace("P.M.", "pm"))) if leave and slug not in {"gurugram"} else None,
            "rows": rows_,
        }
    # Subject groups (senior grades), only boards the page shows
    cur = []
    if d["groups"]:
        blocks = {}
        for a, g_, t_, e in d["groups"]:
            if slug == "kochi-gma" and not (a or "").startswith(("Grade 9", "Grade 11")):
                continue
            blocks.setdefault(a, []).append([g_ or "", t_ or "", e])
        for a, groups in blocks.items():
            if slug in {"gurugram", "varanasi"} and a == "CBSE":
                # Last line ("Optional 2") belongs to Group 3.
                merged = []
                for g_, t_, e in groups:
                    if not g_ and merged:
                        merged[-1][2] += "; " + e
                        continue
                    m = re.match(r"\(?\s*(Non Medical|Medical)\s*\)?\s*:\s*(.*)", e)
                    if m:
                        t_, e = ("Non-medical" if m.group(1).startswith("Non") else "Medical"), m.group(2)
                    elif e.startswith("Optional"):
                        t_ = "Optionals"
                    merged.append([g_, t_, e])
                cur.append({"title": "CBSE subject groups · Grades 11 and 12", "note": "As listed by the school. Final choices depend on what the school offers and CBSE rules.", "groups": merged})
            elif slug == "kochi-gma":
                groups = [[g_, t_, ", ".join(x.strip() for x in e.split(",") if x.strip())] for g_, t_, e in groups]
                title = "Cambridge IGCSE subject groups · Grades 9 and 10" if a.startswith("Grade 9") else "Cambridge AS & A Level subject groups · Grades 11 and 12"
                cur.append({"title": title, "note": "As listed by the school. Final choices depend on what the school offers.", "groups": groups})
    if cur and slug not in OVERRIDES["keep_old_curriculum"]:
        c["curriculum"] = cur
    # Tell every parent
    notes = [n for n in c["keyNotes"] if n != SAMPLES_NOTE]
    if (d["samples"] or "").lower().startswith("y"):
        notes.append(SAMPLES_NOTE)
    c["keyNotes"] = notes
    if json.dumps(old, sort_keys=True) != json.dumps(c, sort_keys=True):
        c["updated"] = date
    return old


def main():
    wb = openpyxl.load_workbook(sys.argv[1], data_only=False)
    path = sys.argv[2]
    pwb = openpyxl.load_workbook(sys.argv[sys.argv.index("--prev") + 1]) if "--prev" in sys.argv else None
    date = sys.argv[sys.argv.index("--date") + 1] if "--date" in sys.argv else dt.date.today().strftime("%-d %b %Y")
    src = open(path, encoding="utf8").read()
    head, body = src.split("window.CAMPUSES = ", 1)
    C = json.loads(body.rstrip().rstrip(";"))
    by = {c["slug"]: c for c in C}
    olds = {}
    # Vikhroli keeps its Word-file page; only facility areas edited in the example tab are applied.
    ex = "GMS Vikhroli (example)"
    if ex in wb.sheetnames:
        v = by["vikhroli"]
        before = json.dumps(v["facilities"])
        cur = dict((a, its) for a, its in v["facilities"])
        prevb = {a: b for a, b, _ in read_tab(pwb[ex])["facilities"]} if pwb and ex in pwb.sheetnames else {}
        prevf = {a: (b, f) for a, b, f in read_tab(pwb[ex])["facilities"]} if pwb and ex in pwb.sheetnames else {}
        for area, b_, f_ in read_tab(wb[ex])["facilities"]:
            if pwb and same_fac(prevf.get(area), (b_, f_)):
                continue
            its = pick_fac(prevb.get(area) if pwb else None, b_, f_)
            if its and [x.lower() for x in its] != [clean(x).lower() for x in cur.get(area, [])]:
                cur[area] = its
                print("vikhroli", area, "->", its)
        v["facilities"] = [[a, cur[a]] for a, _ in v["facilities"]]
        if json.dumps(v["facilities"]) != before:
            v["updated"] = date
    for tab, slug in TABS.items():
        if tab in wb.sheetnames:
            prev = read_tab(pwb[tab]) if pwb and tab in pwb.sheetnames else None
            olds[slug] = apply(by[slug], read_tab(wb[tab]), date, prev)
    with open(path, "w", encoding="utf8") as fh:
        fh.write(head + "window.CAMPUSES = " + json.dumps(C, ensure_ascii=False, indent=1) + ";\n")
    json.dump(olds, open("/tmp/claude-0/olds.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
