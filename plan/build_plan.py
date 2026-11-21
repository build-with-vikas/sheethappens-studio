# Builds the 30-day Sheet Happens content calendar as an .xlsx (Calendar + Playbook).
import datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

START = dt.date(2026, 11, 22)

# (stop doing, do this instead, short topic) — every reel opens "Stop doing this ❌ / Do this instead ✅"
REELS = [
 ("Splitting names by hand", "Ctrl + E (Flash Fill) splits them in 1 second", "Flash Fill"),
 ("Using VLOOKUP", "XLOOKUP looks left, right and never breaks", "XLOOKUP"),
 ("Clicking Data > Filter every time", "Ctrl + Shift + L toggles filters instantly", "Filter shortcut"),
 ("Typing SUM formulas", "Alt + = adds AutoSum in one keystroke", "AutoSum"),
 ("Typing today's date", "Ctrl + ; puts today's date in", "Date shortcut"),
 ("Dragging formulas down 10,000 rows", "Double-click the fill handle", "Fill handle"),
 ("Deleting blank rows one by one", "Go To Special > Blanks > Delete, all at once", "Delete blanks"),
 ("Scrolling to the last row", "Ctrl + Down Arrow jumps there", "Jump to end"),
 ("Hunting duplicates by eye", "Conditional Formatting > Duplicate Values", "Highlight duplicates"),
 ("Deleting duplicates manually", "Data > Remove Duplicates", "Remove duplicates"),
 ("Merging cells for headings", "Center Across Selection (no broken sorting)", "Center across"),
 ("Writing 5 nested IFs", "IFS() reads like plain English", "IFS"),
 ("Copy-pasting rows into columns", "Paste Special > Transpose", "Transpose"),
 ("Working on a plain range", "Ctrl + T turns it into a smart Table", "Tables"),
 ("Building charts click by click", "Alt + F1 makes a chart instantly", "Instant chart"),
 ("Typing 1, 2, 3 … 500", "=SEQUENCE(500) does it", "SEQUENCE"),
 ("Showing ugly #N/A errors", "IFERROR (or XLOOKUP's if_not_found)", "IFERROR"),
 ("Counting values by hand", "COUNTIF counts them for you", "COUNTIF"),
 ("Re-filtering a report every day", "=FILTER() updates itself", "FILTER"),
 ("Sorting the same list again and again", "=SORT() keeps it sorted live", "SORT"),
 ("Copying a list to get unique values", "=UNIQUE() in one formula", "UNIQUE"),
 ("Joining text with & & &", "TEXTJOIN with a separator", "TEXTJOIN"),
 ("Retyping names in proper case", "=PROPER() fixes caps", "PROPER"),
 ("Deleting extra spaces by hand", "=TRIM() cleans them", "TRIM"),
 ("Using Ctrl + F one by one", "Ctrl + H replaces everything at once", "Find & Replace"),
 ("Inserting rows one at a time", "Select 10 rows, then Ctrl + Shift + +", "Insert rows"),
 ("Losing your headers while scrolling", "View > Freeze Panes", "Freeze panes"),
 ("Adding totals rows by hand", "Table Design > Total Row", "Total row"),
 ("Calculating age on a calculator", "=DATEDIF(birth, TODAY(), \"y\")", "Age formula"),
 ("Counting working days on a calendar", "=NETWORKDAYS() skips weekends", "NETWORKDAYS"),
 ("Guessing dates 3 months later", "=EDATE(date, 3)", "EDATE"),
 ("Looking up month-end dates", "=EOMONTH(date, 0)", "EOMONTH"),
 ("Fighting numbers stored as text", "Convert to Number in one click", "Text to numbers"),
 ("Splitting text by commas manually", "=TEXTSPLIT(A2, \",\")", "TEXTSPLIT"),
 ("Using LEFT + FIND to get the first word", "=TEXTBEFORE(A2, \" \")", "TEXTBEFORE"),
 ("Extracting email domains by hand", "=TEXTAFTER(A2, \"@\")", "TEXTAFTER"),
 ("Adding sales by region manually", "SUMIFS with 2 conditions", "SUMIFS"),
 ("Averaging with a calculator", "AVERAGEIFS by condition", "AVERAGEIFS"),
 ("Calculating % change on paper", "(New - Old) / Old + Ctrl + Shift + %", "% change"),
 ("Avoiding Pivot Tables", "A Pivot Table in 10 seconds", "Pivot table"),
 ("Pasting filtered data (hidden rows come too)", "Alt + ; selects visible cells only", "Visible cells"),
 ("Letting people type random entries", "Data Validation dropdown", "Dropdowns"),
 ("Typing Yes/No in task lists", "Insert > Checkbox", "Checkboxes"),
 ("Reading numbers to compare them", "Data Bars show it visually", "Data bars"),
 ("Scanning a table for highs and lows", "Color Scales heatmap", "Heatmap"),
 ("Formulas breaking when you copy them", "F4 locks the cell ($A$1)", "Absolute refs"),
 ("Writing B2:B500 everywhere", "Name the range once", "Named ranges"),
 ("Repeating the same calc in one formula", "LET() names it once", "LET"),
 ("Ranking scores manually", "=RANK.EQ()", "RANK"),
 ("Picking the top 5 by hand", "=TAKE(SORT(...), 5)", "Top 5"),
 ("Comparing two lists by eye", "COUNTIF shows what's missing", "Compare lists"),
 ("Checking two columns cell by cell", "Ctrl + \\ selects row differences", "Row differences"),
 ("Copy-pasting sheets together", "=VSTACK() stacks them live", "VSTACK"),
 ("Splitting one column by hand", "Data > Text to Columns", "Text to Columns"),
 ("Retyping the cell above", "Ctrl + D fills down", "Fill down"),
 ("Redoing the same format again", "F4 repeats your last action", "Repeat action"),
 ("Double-clicking to edit a cell", "F2 edits it", "Edit cell"),
 ("Typing in two cells for two lines", "Alt + Enter adds a line break", "Line break"),
 ("Dragging column borders to resize", "Double-click the border to autofit", "Autofit"),
 ("Hiding rows one by one", "Group rows (Alt + Shift + Right)", "Group rows"),
 ("Clicking sheet tabs with the mouse", "Ctrl + PgUp / PgDn switches sheets", "Switch sheets"),
 ("Clicking cells to see formulas", "Ctrl + ` shows every formula", "Show formulas"),
 ("Searching menus for charts and totals", "Ctrl + Q Quick Analysis", "Quick Analysis"),
 ("Making a chart for every row", "Sparklines inside cells", "Sparklines"),
 ("Trying numbers until you hit a target", "Goal Seek finds it", "Goal Seek"),
 ("Coloring rows by hand", "Conditional format the whole row with a formula", "Row highlight"),
 ("Checking deadlines yourself", "Auto-highlight overdue dates", "Overdue dates"),
 ("Showing 1,250,000 in dashboards", "Custom format 0.0,,\"M\" shows 1.3M", "Number format M/K"),
 ("Seeing zeros everywhere", "Custom format hides zeros", "Hide zeros"),
 ("Losing leading zeros in IDs", "Custom format 00000", "Leading zeros"),
 ("Typing month names", "Type Jan and drag", "Autofill lists"),
 ("Looking up what day a date was", "=TEXT(A2, \"dddd\")", "Weekday"),
 ("Counting unique names manually", "=COUNTA(UNIQUE())", "Count unique"),
 ("Scrolling to find a name", "A search box with FILTER + SEARCH", "Search box"),
 ("Pasting images that float around", "=IMAGE() puts them inside cells", "IMAGE"),
 ("Copying values that keep formulas", "Ctrl + Shift + V pastes values only", "Paste values"),
 ("Translating text in another tab", "=GOOGLETRANSLATE() in Google Sheets", "GOOGLETRANSLATE"),
 ("Copy-pasting between Google Sheets", "=IMPORTRANGE() links them live", "IMPORTRANGE"),
 ("Making rows look like a zebra by hand", "Format as Table banded rows", "Banded rows"),
 ("Using a calculator for EMI", "=PMT() gives the monthly EMI", "EMI formula"),
 ("Calculating GST by hand", "One formula for GST in seconds", "GST formula"),
 ("Writing marks to grades by hand", "XLOOKUP approximate match grades", "Grades"),
 ("Typing time sheets totals wrong", "Format [h]:mm to sum hours", "Sum hours"),
 ("Making attendance sheets manually", "Checkboxes + COUNTIF attendance", "Attendance"),
 ("Building a to-do list on paper", "Excel to-do list with progress bar", "To-do tracker"),
 ("Tracking expenses in notebooks", "A 2-minute expense tracker", "Expense tracker"),
 ("Making invoice numbers by hand", "Auto invoice numbers with a formula", "Invoice numbers"),
]
assert len(REELS) >= 87, len(REELS)

IMAGES = [
 "10 shortcuts that save 1 hour a day", "XLOOKUP syntax cheat card", "Ctrl shortcuts A-Z", "Date formulas cheat sheet",
 "Text cleaning formulas (TRIM, PROPER, CLEAN)", "IF vs IFS vs SWITCH", "VLOOKUP vs XLOOKUP side by side", "Function key cheat sheet (F2, F4, F9)",
 "Formatting shortcuts", "Conditional formatting recipes", "Custom number format codes", "Dynamic array functions (FILTER, SORT, UNIQUE)",
 "Navigation shortcuts", "Pivot Table in 5 steps", "Common errors and fixes (#N/A, #REF!, #VALUE!)", "Data cleaning checklist",
 "COUNTIF / SUMIFS / AVERAGEIFS cheat card", "Text functions (TEXTSPLIT, TEXTBEFORE, TEXTAFTER)", "Paste Special options explained", "Google Sheets-only functions",
 "Excel for interviews: top 10 asked", "Selection shortcuts", "Chart types: which to use when", "Excel vs Google Sheets shortcuts",
 "Formula auditing tools", "Lookup functions compared", "Excel finance formulas (PMT, FV, NPV)", "Dashboard design rules",
 "Keyboard shortcuts for Mac users", "30-day recap: the best tricks",
]

TIMES = {"Reel 1": "08:30", "Image": "11:00", "Reel 2": "13:30", "Reel 3": "19:45"}
HASHTAGS = [
 "#excel #exceltips #exceltricks #msexcel #spreadsheet",
 "#excelshortcuts #learnexcel #officehacks #productivity #worksmarter",
 "#googlesheets #exceltutorial #corporatelife #datanalytics #careertips",
]

wb = Workbook()
cal = wb.active
cal.title = "Calendar"
HEAD = ["Day", "Date", "Weekday", "Slot", "Post time (IST)", "Topic", "Hook: stop doing this", "Do this instead", "Caption idea", "Hashtags",
        "Status", "Views", "Likes", "Saves", "Shares", "Follows", "Notes"]
cal.append(HEAD)
r = 0
rows = []
for d in range(30):
    date = START + dt.timedelta(days=d)
    n_reels = 2 if d < 3 else 3  # 3-day warm-up after the account flag, then 3 a day
    slots = ["Reel 1", "Image", "Reel 2"] + (["Reel 3"] if n_reels == 3 else [])
    for s in slots:
        if s == "Image":
            topic = IMAGES[d]
            hook, do, cap = "Save this cheat card", topic, f"Save this {topic.lower()} for later. Which one did you not know? 👇"
            note = "Single image or carousel"
        else:
            stop, do, topic = REELS[r]; r += 1
            hook = f"Stop {stop[0].lower() + stop[1:]} ❌"
            cap = f"{topic} in 15 seconds. {do}. Save this and follow @sheethappens.daily for one Excel trick a day."
            note = "Reel, 15 s, US male voice + subtitles"
        rows.append([d + 1, date, date.strftime("%a"), s, TIMES[s], topic, hook, do if s != "Image" else "Cheat card", cap,
                     HASHTAGS[(d + len(rows)) % 3], "Planned", None, None, None, None, None, note])
for row in rows:
    cal.append(row)

hdr_fill = PatternFill("solid", fgColor="E3F1E8")
for c in cal[1]:
    c.font = Font(bold=True, color="0B5A2F")
    c.fill = hdr_fill
    c.alignment = Alignment(vertical="center")
for row in cal.iter_rows(min_row=2):
    row[1].number_format = "dd mmm yyyy"
    for c in (row[5], row[6], row[7], row[8], row[16]):
        c.alignment = Alignment(wrap_text=True, vertical="top")
widths = {"A": 6, "B": 13, "C": 9, "D": 9, "E": 14, "F": 22, "G": 34, "H": 34, "I": 48, "J": 42, "K": 12, "L": 9, "M": 9, "N": 9, "O": 9, "P": 9, "Q": 30}
for k, v in widths.items():
    cal.column_dimensions[k].width = v
cal.freeze_panes = "B2"

pb = wb.create_sheet("Playbook")
PB = [
 ["Sheet Happens: 30-day playbook", ""],
 ["", ""],
 ["Goal", "30,000 followers (stretch). Realistic base: 3,000 to 10,000 without a viral reel."],
 ["Posting", "3 reels a day (2 a day for the first 3 days as a warm-up) + 1 image post a day"],
 ["Start times (IST)", "08:30 reel, 11:00 image, 13:30 reel, 19:45 reel. Adjusted weekly from insights."],
 ["Hook rule", "Every reel opens with 'Stop doing this ❌' then 'Do this instead ✅' in the first 2 seconds"],
 ["Reel format", "15 s, real-Excel look, US male voice, word-by-word subtitles, end card: Save + Follow"],
 ["Image format", "One cheat card or carousel, same green/off-white brand look"],
 ["Captions", "Keyword first line (Instagram search), one-line value, CTA: save + follow"],
 ["Hashtags", "3 rotating sets of 5 (see Calendar). Winners kept, losers swapped weekly"],
 ["", ""],
 ["Daily routine", ""],
 ["1", "Pull insights for every post: views, watch time, likes, saves, shares, follows"],
 ["2", "Fill the numbers into this Calendar"],
 ["3", "Rank hooks, topics, captions, hashtags and times; update the playbook"],
 ["4", "Make today's reels and image, push notification for approval"],
 ["5", "Post at the planned times"],
 ["", ""],
 ["Weekly targets", ""],
 ["Week 1", "Test 5 formats; find the 2 best hooks. Target 300 to 1,000 followers"],
 ["Week 2", "Double down on winners; launch 'Comment SHEET' cheatsheet. Target 1,500 to 3,000"],
 ["Week 3", "Sequels of top reels; comment-question reels. Target 3,000 to 7,000"],
 ["Week 4", "Scale winners; collab outreach. Target 7,000 to 10,000+ (30,000 needs a viral reel)"],
 ["", ""],
 ["KPIs to watch", ""],
 ["3-second hold", "Above 60% means the hook works"],
 ["Average watch", "Above 70% of a 15 s reel"],
 ["Saves per 1,000 views", "Above 15 is great for tips content"],
 ["Shares per 1,000 views", "Above 5 is what makes reels travel"],
 ["Follows per 1,000 views", "Above 3 means the page converts"],
]
for row in PB:
    pb.append(row)
pb["A1"].font = Font(bold=True, size=14, color="0B5A2F")
for cell in ("A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A12", "A19", "A25"):
    pb[cell].font = Font(bold=True)
pb.column_dimensions["A"].width = 24
pb.column_dimensions["B"].width = 95
for row in pb.iter_rows():
    row[1].alignment = Alignment(wrap_text=True, vertical="top")

wb.save("/home/user/sheethappens-plan/sheet-happens-30-day-plan.xlsx")
print(len(rows), "calendar rows,", r, "reels")
