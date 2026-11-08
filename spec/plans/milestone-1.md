# תוכנית – Milestone 1: Walking Skeleton

מקורות: MILESTONES.md (Milestone 1), ARCHITECTURE.md (סעיפים 2, 3, 6, 7, ADR-1), DESIGN.md, course-stack.md.
**מטרה:** האתר ומסד הנתונים מחוברים ורצים מקצה לקצה, בלי פיצ'רים. n8n לא נכנס כאן (Milestone 6).
**הערכה:** כ-10 שעות.

---

## 1. מה נבנה ומה לא

**נבנה:**
- ארבעה דפים ריקים (`index.html`, `login.html`, `shopping.html`, `pending.html`) עם ניווט ביניהם.
- CSS בסיס: RTL, Assistant, משתני `tokens/tokens.css` בלבד.
- `js/config.js` ו-`js/supabase.js` (חיבור ל-Supabase עם המפתח הציבורי).
- ב-Supabase: שלוש טבלאות, RLS שמתיר רק לשני ההורים, ונתוני דמה (5 שורות לפחות בכל טבלה).
- `data/members.json` עם המשפחה המומצאת.

**לא נבנה (שייך ל-Milestones הבאים, ולכן מוסתר לגמרי):**
- טופס הכניסה, בדיקת Session והפניה ל-`login.html`, שם ההורה ויציאה (Milestone 2). בדף הכניסה אין שדות, כי שדה שלא עושה כלום אסור.
- סרגל הניווט המעוצב (`js/nav.js`), מונה Pending ואווטארים (Milestone 2 ו-6).
- כל תוכן של לוח, קניות או Pending, וכל קריאת נתונים בדפים (Milestone 3 ואילך). לכן אין בדפים מצבי טעינה, ריק ושגיאה עדיין: אין בהם טעינה.
- `calendar.html`, `api/`, `package.json`, `n8n/`, `ai-tests.md`, `assets/avatars/`.

**אין צורך ב-`.env` ב-Milestone הזה.** לפי ARCHITECTURE.md (סעיף 6), כתובת Supabase והמפתח הציבורי יושבים ב-`js/config.js` בריפו, וזה מותר כי הם מוגנים ב-RLS. המפתח הסודי של Supabase לא נדרש בכלל: את קובצי ה-SQL מריצים בעורך ה-SQL של Supabase.

**Development ו-Production:** לפי ADR-1 יש פרויקט Supabase אחד לאתר המקומי ולאתר החי. אין הפרדה, ולכן אין צורך בנוהל Migrations נפרד.

---

## 2. צעדים שאתה מבצע (Claude מדריך צעד אחר צעד)

### לפני הבנייה
1. **פתיחת פרויקט Supabase** (תוכנית חינמית): שם `homie`, אזור קרוב (למשל Frankfurt). שמור את סיסמת מסד הנתונים אצלך, לא בריפו.
   - אם בפתיחה מופיעות האפשרויות "Enable Data API" ו-"Automatically expose new tables" — להשאיר מסומנות.
2. **כיבוי הרשמה:** Authentication ← Sign In / Providers ← לכבות "Allow new users to sign up".
3. **יצירת שני חשבונות הורים:** Authentication ← Users ← Add user ← Create new user, עם "Auto Confirm User". אחד ליואב ואחד לדנה. האימיילים והסיסמאות נשארים אצלך בלבד (לא בריפו).
4. **לשלוח לי בצ'אט** (כולם ציבוריים ואינם סוד):
   - Project URL (Settings ← API).
   - המפתח הציבורי (Publishable key, או anon key הישן).
   - ה-UUID של יואב ושל דנה (העמודה UID ברשימת המשתמשים), ומי מהם הוא מי.
   - **לא לשלוח** את ה-Secret / service_role key ואת הסיסמאות.

### במהלך הבנייה
5. **הרצת קובצי ה-SQL:** אחרי שאכתוב אותם, תדביק בעורך ה-SQL של Supabase (SQL Editor ← New query) את התוכן של `sql/schema.sql`, תריץ, ואחריו `sql/policies.sql` ו-`sql/seed.sql`, בסדר הזה. אחרי כל אחד תגיד לי אם הופיעה שגיאה.

---

## 3. קבצים ליצירה

```
index.html          login.html          shopping.html       pending.html
css/styles.css
js/config.js        js/supabase.js      js/skeleton-nav.js
data/members.json
sql/schema.sql      sql/policies.sql    sql/seed.sql
```
קבצים קיימים שמתעדכנים: `CLAUDE.md` (פקודות הרצה), `spec/MILESTONES.md` (סימון 🟡), `spec/ARCHITECTURE.md` (ADR-2, ADR-3).

### 3.1 דפי HTML
כל דף, לפי מוסכמות ARCHITECTURE.md סעיף 7:
- `<html lang="he" dir="rtl">`, `meta charset`, `meta viewport`, `<title>` בעברית (למשל "לוח היום · Homie").
- Assistant מ-Google Fonts במשקלים 400, 600, 700.
- `tokens/tokens.css` ואחריו `css/styles.css`. נתיבים יחסיים בלבד (כדי שיעבדו גם ב-`/Homie/` ב-GitHub Pages).
- `supabase-js` v2 בתג `<script>` רגיל מ-jsDelivr, **בגרסה מדויקת נעולה** (הגרסה היציבה האחרונה שפורסמה לפחות שבועיים לפני הבנייה), לפני המודולים.
- `<script type="module" src="js/supabase.js">` — הדף יוצר את החיבור, כדי לוודא שאין שגיאה בטעינה. אין שאילתה בדף.

תוכן כל דף (מינימלי, רק כדי לזהות אותו):
| דף | תוכן |
|---|---|
| `login.html` | שם המוצר "Homie" (ירוק אשוח, 32/40) והשאלה "מי אחראי למה היום?". בלי שדות ובלי כפתור |
| `index.html` | כותרת מסך "לוח היום" |
| `shopping.html` | כותרת מסך "רשימת קניות" |
| `pending.html` | כותרת מסך "ממתין לאישור" ושורת ההסבר "פריטים שממתינים לפעולת הורה" |

### 3.2 ניווט זמני – `js/skeleton-nav.js`
- מודול קטן שמוסיף לכל דף `<nav aria-label="ניווט ראשי">` עם ארבעה קישורים: כניסה, לוח היום, קניות, ממתין לאישור. הקישור של הדף הנוכחי מקבל `aria-current="page"` ומסומן גם בקו תחתון (לא רק בצבע).
- **זמני:** ב-Milestone 2 הוא נמחק ובמקומו נבנה `js/nav.js` (סרגל תחתון בטלפון, עליון במחשב, בלי "כניסה"). הערה על כך בראש הקובץ.
- **החלטה:** קובץ אחד משותף במקום להעתיק את הקישורים לארבעה דפים, כדי שהמחיקה ב-Milestone 2 תהיה במקום אחד.

### 3.3 `css/styles.css`
- רק `var(--…)` מ-tokens.css. אין צבע, גודל או מרווח קבוע.
- `box-sizing: border-box`, `body`: רקע `--color-bg`, טקסט `--color-text`, `--font-body`, שוליים `--space-screen-margin`.
- כותרות: `--font-display` לשם המוצר, `--font-title-l` לכותרת מסך, `--font-caption` לשורת הסבר בצבע `--color-text-secondary`.
- מיכל תוכן: רוחב מלא בטלפון (375), ובמחשב רוחב מרבי ובמרכז.
- קישורי הניווט הזמני: אזור לחיצה 44 לפחות, צבע `--color-primary`, קו תחתון לפעיל.
- Focus: `:focus-visible { box-shadow: var(--focus-ring); outline: none; }` לכל רכיב לחיץ.
- מובייל קודם, ו-`@media (min-width: 768px)` לפריסה רחבה.

### 3.4 `js/config.js`
```js
export const SUPABASE_URL = '…';          // Project URL – public
export const SUPABASE_ANON_KEY = '…';     // publishable/anon key – public, protected by RLS
export const TIMEZONE = 'Asia/Jerusalem';
export const TIMELINE_START_HOUR = 7;     // PRD 4.13
export const TIMELINE_END_HOUR = 22;
export const RECURRENCE_WEEKS = 4;        // F16, after MVP
```

### 3.5 `js/supabase.js`
- קורא ל-`window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` ומייצא `export const db`.
- אם ה-global לא נטען (ה-CDN נכשל), כותב שגיאה ברורה ל-Console.

### 3.6 `data/members.json`
בדיוק לפי הטבלה ב-ARCHITECTURE.md סעיף 2: m1 יואב, m2 דנה, m3 נועה, m4 איתי, עם `name`, `tint`, `color`, `avatar`, `is_parent`, ו-`supabase_user_id` רק להורים (ה-UUID שתשלח). הקובץ לא נטען באף דף עדיין (Milestone 2).

---

## 4. מסד הנתונים

### 4.1 `sql/schema.sql`
שלוש טבלאות בדיוק לפי ARCHITECTURE.md סעיף 2, כולל:
- `events`: `source` check (`homie`, `google`), `status` check (`pending`, `approved`, `dismissed`), default `approved`, `google_event_id` unique, `assigned_member_ids jsonb not null default '[]'`.
- `tasks`: `status` check (`todo`, `done`), `recurrence_type` check (`none`, `daily`, `weekly`), `source` check (`manual`, `ai`), `proposal_status` check (`none`, `proposed`, `approved`, `rejected`).
- `shopping_items`: `quantity integer not null default 1 check (quantity >= 1)`.
- אינדקסים: `events(date)`, `tasks(date)`.
- בלי Trigger ובלי מפתחות זרים.
- `alter table … enable row level security` לשלושתן, כבר בקובץ הזה, כדי שלא יהיה רגע שבו טבלה פתוחה.
- **הרשאות הטבלה ל-`anon` ו-`authenticated` נשארות כברירת המחדל של Supabase.** כך משתמש אנונימי מקבל 0 שורות בלי שגיאה (RLS מסנן), ולא "permission denied". אם בבדיקה מתקבלת שגיאת הרשאה, מוסיפים `grant` מפורש.

### 4.2 `sql/policies.sql`
- לכל טבלה ארבע Policies נפרדות (`select`, `insert`, `update`, `delete`), כולן `to authenticated`, עם התנאי `auth.uid() in ('<uuid יואב>', '<uuid דנה>')`.
  - `insert`: `with check (…)`. `update`: `using (…)` וגם `with check (…)`.
  - `delete` ב-`events`: התנאי וגם `source = 'homie'`.
- אין שום Policy ל-`anon`.
- בראש הקובץ `drop policy if exists …`, כדי שאפשר יהיה להריץ אותו שוב בבטחה.

### 4.3 `sql/seed.sql`
- **החלטה:** התאריכים יחסיים להיום בשעון ישראל: `(now() at time zone 'Asia/Jerusalem')::date + n`. כך בבנייה של Milestone 3 הלוח של "היום" יהיה מלא בכל יום שבו בודקים, ולא רק בתאריך שבו נכתב הקובץ. מתועד כ-ADR-2.
- בראש הקובץ `delete from` שלוש הטבלאות, כדי שהרצה חוזרת לא תכפיל שורות. (מוחק רק נתוני דמה; אין נתונים אמיתיים.)
- **`events` (6 שורות):** היום: "פגישת הורים" (homie, 18:00–19:00, דנה ויואב), "אימון כדורגל" (google, approved, 16:30–18:00, איתי, עם `google_event_id`); מחר: "חוג ציור" (homie, נועה); היום, יום שלם: "יום הולדת לסבתא" (homie, `start_time` null, כולם); בעוד יומיים: אירוע google `pending` אחד ואירוע google `dismissed` אחד (לבדיקות של Milestones 3 ו-6: הם לא אמורים להופיע בלוח).
- **`tasks` (7 שורות):** היום: "להסיע את נועה לבית הספר" (07:30, יואב), "שיעורי בית בחשבון" (17:00, איתי), "לקנות מתנה לסבתא" (בלי שעה, דנה, `done`), "להשקות את העציצים" (בלי שעה, נועה ואיתי); מחר: משימה אחת; הצעת AI אחת `proposed` ("להכין בגדי ספורט ובקבוק מים", `source = ai`, `notes = 'הצעה לאירוע: אימון כדורגל'`), והצעה אחת `rejected` (לא אמורה להופיע).
- **`shopping_items` (6 שורות):** חלב (2), לחם (1), ביצים (12), עגבניות (6), שמן זית (1, `purchased = true`), אורז (1).
- כל השמות מומצאים. אין מידע אמיתי על אנשים או קטינים (F40).

---

## 5. בדיקות (Claude מריץ בבנייה)
הרצה: `python3 -m http.server 8000` משורש הפרויקט, ובדיקה בדפדפן המובנה ב-`http://localhost:8000`. בסיום הבדיקות השרת נסגר.

| תנאי ב-Definition of Done | איך בודקים |
|---|---|
| האתר רץ מקומית ואפשר לעבור בין הדפים | פותחים את ארבעת הדפים, לוחצים על כל קישור, ובודקים שאין שגיאות ב-Console. ברוחב 375 ובמחשב |
| קריאה בלי התחברות מחזירה 0 שורות ובלי שגיאה | ב-Console של הדפדפן: `const { db } = await import('./js/supabase.js'); await db.from('tasks').select('*')` — וכך לשלוש הטבלאות. מצופה: `data: []`, `error: null` |
| ההרשמה כבויה | ב-Console: `await db.auth.signUp({ email: 'test@example.com', password: 'Test-12345' })` — מצופה שגיאה (Signups not allowed) |
| ה-Policies מתירות רק את שני ה-uuid | קריאת `sql/policies.sql`: כל Policy כוללת את רשימת שני המזהים, ואין `using (true)` ואין Policy ל-anon. בנוסף, בדשבורד (Authentication ← Policies) רואים את אותן Policies |
| שלוש טבלאות בלבד, 5 שורות לפחות בכל אחת | ב-SQL Editor: שאילתה שמונה טבלאות ב-schema `public` ושורות בכל טבלה (אתן לך אותה מוכנה להדבקה) |
| המפתח הציבורי הוא המפתח היחיד בקוד | חיפוש בריפו אחרי `service_role`, `sb_secret`, `AIza` ו-JWT עם `"role":"service_role"`. מצופה: אין תוצאות מלבד המפתח הציבורי ב-`js/config.js` |

**תנאים כלליים (MILESTONES.md):** RTL, Assistant, צבעי tokens, תוויות (אין שדות עדיין), Focus נראה בניווט מקלדת, ואין רכיב של Milestone מאוחר יותר.

**הערה על בדיקת הכניסה עם משתמש מחובר:** שאילתה כהורה מחובר (שמחזירה את נתוני הדמה) היא חלק מ-Milestone 2, כי היא דורשת את טופס הכניסה. ב-Milestone 1 די לוודא בדשבורד שהנתונים קיימים ושה-Policies נכונות.

---

## 6. עדכוני מסמכים בסיום הבנייה
- `CLAUDE.md`, "פקודות הרצה": **הרצה (dev):** `python3 -m http.server 8000` ואז `http://localhost:8000/login.html`. **בדיקות (test):** אין.
- `ARCHITECTURE.md`:
  - **ADR-2:** תאריכי נתוני הדמה יחסיים להיום (סעיף 4.3 למעלה).
  - **ADR-3:** ניווט זמני ב-`js/skeleton-nav.js` עד Milestone 2 (סעיף 3.2 למעלה).
- `MILESTONES.md`: 🟡 ליד הכותרת של Milestone 1.
- אין commit ואין push. GitHub Pages מופעל בשלב הדחיפה, בהדרכה שלי.

---

## 7. סדר הבנייה
1. (אתה) צעדים 1–4 בסעיף 2, ושליחת הפרטים.
2. דפי HTML, `styles.css`, `skeleton-nav.js`, `config.js`, `supabase.js`.
3. `members.json` ושלושת קובצי ה-SQL, עם ה-UUID האמיתיים.
4. (אתה) הרצת שלושת קובצי ה-SQL בעורך של Supabase.
5. בדיקות לפי סעיף 5, ותיקון מה שנכשל.
6. עדכון מסמכים לפי סעיף 6, וסגירת השרת המקומי.
