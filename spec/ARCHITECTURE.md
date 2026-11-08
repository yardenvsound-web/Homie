# ארכיטקטורה – Home-me V1

מקורות: PRD.md, tech-stack.md, course-stack.md, product-10-definitions.md.
מספרי הפיצ'רים (F01–F41) הם המספרים מ-MVP.md.
הגדרות "MVP" ו-"Should" לפי MVP.md: כל Must הוא ב-MVP. פיצ'ר Should או Could שלא ב-MVP מסומן "אחרי MVP", והארכיטקטורה מכינה לו מקום בלי לבנות אותו.

**סתירות:** לא מצאתי סתירה בין ה-PRD, עשרת ההיבטים ו-tech-stack.md. החלטות שקיבלתי בהיעדר מידע מסומנות "החלטה".

---

## 1. מבנה המערכת

### תרשים

```
┌──────────────────────── דפדפן (GitHub Pages) ────────────────────────┐
│  צד לקוח: HTML + CSS + JS (ES modules), supabase-js מ-CDN            │
│  לוגיקה בדפדפן: חזרתיות, חפיפות, בדיקות קלט, זרימות אישור             │
│  מפתח ציבורי של Supabase בלבד                                         │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTPS + Session של הורה (RLS)
                ▼
┌────────────────────────── Supabase ──────────────────────────────────┐
│  Postgres: events, tasks, shopping_items        Auth: שני הורים       │
└───────────────▲──────────────────────────────────────────────────────┘
                │ מפתח סודי של Supabase (Credentials ב-n8n בלבד)
┌───────────────┴────────────── n8n Cloud ─────────────────────────────┐
│  אוטומציות: Google Calendar → Pending, הצעת AI, מיילים                │
│  קוראות ל: Google Calendar, Gemini, Gmail                             │
└──────────────────────────────────────────────────────────────────────┘

אחרי MVP בלבד (F37):  דפדפן ──► api/suggest.js (Vercel) ──► Gemini
```

### שלוש שכבות

| שכבה | מה יש בה | איפה |
|---|---|---|
| צד לקוח | חמישה דפי HTML (כניסה, לוח היום, קניות, Pending, יומן שבועי), CSS אחד, מודולי JS, `members.json` | GitHub Pages |
| לוגיקה | (א) JS בדפדפן: חזרתיות, חפיפות, בדיקות קלט, זרימות אישור ודחייה. (ב) Workflows ב-n8n: קליטת Google, קריאה למודל, מיילים. (ג) אחרי MVP: פונקציה אחת ב-`api/` | דפדפן, n8n, Vercel |
| נתונים | שלוש טבלאות ב-Postgres, Supabase Auth | Supabase |

### עקרונות
- אין שרת משלנו. הדפדפן מדבר עם Supabase ישירות, והגנת המידע בהרשאות הטבלה (RLS).
- אין Real-Time ואין Polling. נתונים נטענים בעת כניסה לדף ובלחיצה על רענון.
- חישוב, סינון והשוואת תאריכים נעשים בקוד. המודל רק מנסח הצעה.
- דפדפן לעולם לא קורא ל-Google, ל-Gemini או ל-Gmail.

---

## 2. מבנה הנתונים

כל התאריכים והשעות הם שעון ישראל (`Asia/Jerusalem`). **החלטה:** `date` ו-`time` נשמרים ללא אזור זמן, כי יש בית אחד באזור זמן אחד. רק `reminder_at` ו-`created_at`/`updated_at` הם `timestamptz`.

### טבלה: `events`
| שדה | סוג | הערות |
|---|---|---|
| id | uuid, PK, default `gen_random_uuid()` | |
| title | text, not null | |
| date | date, not null | |
| start_time | time, null | null = אירוע יום שלם |
| end_time | time, null | |
| source | text, not null | `home_me` או `google` |
| status | text, not null, default `approved` | `pending`, `approved` או `dismissed`. אירוע פנימי נוצר `approved`. אירוע Google נוצר `pending`. `dismissed` = הורה התעלם (F43). השורה נשארת בטבלה כדי ש-W1 לא יקלוט אותה שוב |
| assigned_member_ids | jsonb, not null, default `[]` | מערך של מזהי בני בית מ-members.json |
| google_event_id | text, null, **unique** | מניעת כפילות. null באירוע פנימי (Postgres מתיר כמה null) |
| updated_from_google | boolean, not null, default false | נכתב רק אחרי MVP (F32) |
| notes | text, null | |
| created_at | timestamptz, default `now()` | |
| updated_at | timestamptz, default `now()` | |

### טבלה: `tasks`
| שדה | סוג | הערות |
|---|---|---|
| id | uuid, PK, default `gen_random_uuid()` | |
| title | text, not null | |
| date | date, not null | |
| time | time, null | null = משימה ללא שעה |
| status | text, not null, default `todo` | `todo` או `done`. **החלטה:** קוד באנגלית במסד, ותווית בעברית בממשק: `todo` = "לביצוע", `done` = "הושלמה". המיפוי מרוכז ב-`js/ui.js`. כך אין עברית בתנאי `check` ובשאילתות |
| assigned_member_ids | jsonb, not null, default `[]` | |
| notes | text, null | |
| reminder_at | timestamptz, null | **החלטה:** שדה אחד במקום `reminder_at` ו-`reminder_offset`. הממשק מחשב את הזמן המוחלט |
| reminder_sent | boolean, not null, default false | נדרש רק אם F34 ייכנס (הנחה 6 ב-PRD) |
| recurrence_type | text, not null, default `none` | `none`, `daily`, `weekly` |
| source | text, not null, default `manual` | `manual` או `ai` |
| proposal_status | text, not null, default `none` | `none`, `proposed`, `approved`, `rejected` |
| created_at, updated_at | timestamptz, default `now()` | |

### טבלה: `shopping_items`
| שדה | סוג | הערות |
|---|---|---|
| id | uuid, PK, default `gen_random_uuid()` | |
| name | text, not null | |
| quantity | integer, not null, default 1, check `quantity >= 1` | **החלטה:** מספר שלם, כי הממשק הוא Quick Add עם כמות ללא יחידה |
| purchased | boolean, not null, default false | פריט שנקנה נשאר בטבלה ונעלם מהרשימה הפעילה |
| created_at, updated_at | timestamptz, default `now()` | |

### קשרים
- אין מפתחות זרים בין הטבלאות, כי אין קשר ישיר ביניהן.
- `assigned_member_ids` מצביע על `id` ב-`data/members.json`. אין טבלת members.
- חזרתיות: מופעים הם שורות עצמאיות ב-`tasks` עם אותו `recurrence_type`. אין טבלת Series.
- **החלטה:** הצעת AI לא מקושרת לאירוע במפתח זר. היא שורה ב-`tasks` עם `date` זהה לאירוע ו-`notes` בנוסח `הצעה לאירוע: {title}`. כך נשארות שלוש טבלאות ואין עמודה נוספת.

### `data/members.json`
**המשפחה המומצאת** (לפי mockups.png ו-DESIGN.md). הסדר בקובץ הוא סדר התצוגה בבוחר המשויכים ובמקרא, וקובע את הצבע כשיש כמה משויכים (DESIGN.md):

| id | name | תפקיד | tint (רקע) | color (פס) | avatar |
|---|---|---|---|---|---|
| m1 | יואב | הורה | `#E3EADC` | `#6F9170` | `assets/avatars/m1.png` |
| m2 | דנה | הורה | `#F4DFD5` | `#CB7A56` | `assets/avatars/m2.png` |
| m3 | נועה | ילדה | `#F7EACB` | `#D6A23E` | `assets/avatars/m3.png` |
| m4 | איתי | ילד | `#E9DFCE` | `#6C93A6` | `assets/avatars/m4.png` |

**החלטה:** יואב ודנה הם ההורים, נועה ואיתי הילדים. הבסיס ב-mockups.png: כניסה עם `dana@example.com`, "פגישת הורים" משויכת לדנה וליואב, "להסיע את נועה לבית הספר" משויכת ליואב, ואימון הכדורגל ושיעורי הבית לאיתי. בני הבית "אמא / אבא / ילד 1 / ילד 2" ב-wireframes.png הם placeholder בלבד.

```json
[
  { "id": "m1", "name": "יואב", "tint": "#E3EADC", "color": "#6F9170", "avatar": "assets/avatars/m1.png", "is_parent": true,  "supabase_user_id": "<uuid של יואב>" },
  { "id": "m2", "name": "דנה",  "tint": "#F4DFD5", "color": "#CB7A56", "avatar": "assets/avatars/m2.png", "is_parent": true,  "supabase_user_id": "<uuid של דנה>" },
  { "id": "m3", "name": "נועה", "tint": "#F7EACB", "color": "#D6A23E", "avatar": "assets/avatars/m3.png", "is_parent": false },
  { "id": "m4", "name": "איתי", "tint": "#E9DFCE", "color": "#6C93A6", "avatar": "assets/avatars/m4.png", "is_parent": false }
]
```
- נתוני דמה בלבד. `supabase_user_id` רק להורים. מזהה משתמש הוא לא סוד. את שני חשבונות ההורים יוצר המשתמש ב-Milestone 1, ואז המזהים נכתבים כאן וב-`sql/policies.sql`.
- **החלטה:** נוסף שדה `tint` (גוון הרקע) לצד `color` (הפס), כי לכל בן בית יש שני צבעים ב-DESIGN.md.
- **אווטארים:** קובצי תמונה ב-`assets/avatars/`, אחד לכל בן בית. את האיורים מספק המשתמש (Claude לא יוצר אותם). עד שהם קיימים, האווטאר מוצג כעיגול בגוון בן הבית עם האות הראשונה של שמו.
- אימיילי ההורים לא נשמרים בריפו. הם קיימים רק ב-Supabase Auth.

### אינדקסים וחוקי שלמות
- אינדקס על `events(date)` ועל `tasks(date)`.
- `check` על כל שדה ערכים: `source`, `status`, `recurrence_type`, `proposal_status`.
- `updated_at` נקבע על ידי הלקוח בכל עדכון (`new Date().toISOString()`). **החלטה:** בלי Trigger, כדי לא להוסיף רכיב.

### שאילתות מרכזיות
| מסך | שאילתה |
|---|---|
| לוח היום | `tasks`: `date = היום הנבחר` ו-`proposal_status in ('none','approved')`. `events`: `date = היום הנבחר` ו-`status = 'approved'`. היום הנבחר מתחיל בהיום (שעון ישראל) ומשתנה בחצים (F42) |
| יומן שבועי | אותן שאילתות לטווח של 7 ימים |
| Pending | `events`: `status = 'pending'`. `tasks`: `proposal_status = 'proposed'`. המונה הוא סכום שני הצדדים |
| קניות | `shopping_items`: `purchased = false`, ממוין לפי `created_at` |

### אירועי Google – ייצוג
- **החלטה:** אירוע Google ביום שלם נשמר עם `start_time = null` ומוצג באזור "ללא שעה" בלוח.
- **החלטה:** אירוע Google שנמשך כמה ימים נשמר ביום ההתחלה בלבד. זו מגבלה ידועה.
- אירוע שנמחק ב-Google נשאר בלוח (מגבלה ידועה, לפי ה-PRD).

---

## 3. התחברות והרשאות

### התחברות
- Supabase Auth, אימייל וסיסמה (`signInWithPassword`). שני חשבונות הורים נוצרים ידנית בדשבורד. אין הרשמה, שחזור סיסמה או כניסה עם Google.
- **הרשמה כבויה ב-Supabase (חובה).** ב-Authentication ← Sign In / Providers מכבים את "Allow new users to sign up". בלי זה, כל אדם יכול להירשם עם המפתח הציבורי שבדפדפן, להפוך ל-`authenticated` ולקרוא את כל הנתונים. היעדר מסך הרשמה באתר לא מספיק, כי אפשר לקרוא ל-`signUp` ישירות. את ההגדרה מבצע המשתמש בדשבורד.
- `supabase-js` שומר את ה-Session ואת רענון ה-Token אוטומטית, כך שהטאבלט נשאר מחובר (F02). הוא שומר אותו ב-localStorage כברירת מחדל. זה Token התחברות, לא נתוני המערכת.
- כל דף חוץ מ-`login.html` בודק Session בטעינה. אם אין, מפנה ל-`login.html`. זו נוחות בלבד. ההגנה האמיתית היא RLS.
- אחרי כניסה, `members.json` מזהה את ההורה לפי `supabase_user_id`, ורק כדי להציג את שמו.

### תפקידים
| תפקיד | חשבון | הרשאות |
|---|---|---|
| Parent / Admin (שניים) | יש, ב-Supabase Auth | כל מה שב-PRD. שני ההורים זהים. מזוהים ב-RLS לפי ה-uuid שלהם |
| פרופיל ילד | אין | נתון ב-`members.json` בלבד. הילד רואה את המערכת דרך Session של הורה |
| n8n | מפתח סודי של Supabase | כתיבה לטבלאות בעוקף RLS. נשמר רק ב-n8n |

### RLS
RLS מופעל על שלוש הטבלאות. אין Policy למשתמש אנונימי, כלומר חסימה מלאה.

**הגנה כפולה:** כל Policy מתירה גישה רק לשני ההורים, ולא לכל משתמש מחובר: התנאי הוא `auth.uid() in ('<uuid הורה 1>', '<uuid הורה 2>')`, עם אותם מזהים שב-`supabase_user_id` ב-`members.json`. כך, גם אם ההרשמה תיפתח בטעות, משתמש חדש לא יראה דבר. המזהים אינם סוד. **החלטה:** המזהים כתובים ישירות ב-`sql/policies.sql`, בלי טבלה נוספת.

| טבלה | שני ההורים (`auth.uid()` ברשימה) | כל משתמש אחר / anon |
|---|---|---|
| events | select, insert, update, delete (רק כש-`source = 'home_me'`) | אין |
| tasks | select, insert, update, delete | אין |
| shopping_items | select, insert, update, delete | אין |

מחיקת משימה (F44) ומחיקת אירוע פנימי (F45) הן `delete` רגיל לפי `id`. ה-Policy של `delete` ב-`events` כוללת גם את התנאי `source = 'home_me'`, כדי שאירוע Google לא יימחק (מחיקה שלו הייתה גורמת ל-W1 לקלוט אותו שוב). מחיקה מקבילה של אותו פריט על ידי שני ההורים לא דורשת עדכון מותנה: השנייה פשוט לא מוחקת דבר.

### עדכון מותנה
course-stack.md דורש עדכון מותנה כשפעולה יכולה להתבצע על ידי שני משתמשים בו-זמנית. לכן בפעולות אישור ודחייה:
- אישור אירוע Google: `update … where id = ? and status = 'pending'`.
- התעלמות מאירוע Google (F43): `update … set status = 'dismissed' where id = ? and status = 'pending'`.
- אישור או דחיית הצעת AI: `update … where id = ? and proposal_status = 'proposed'`.
- אם לא עודכנה אף שורה, הלקוח מציג "הפריט כבר טופל", ומרענן. עריכה רגילה של משימה או אירוע היא Last Write Wins ללא תנאי.

---

## 4. שכבת ה-AI

### עיקרון
המודל מציע בלבד. שום שינוי לא קורה בלי אישור הורה. הקריאה למודל לעולם לא יוצאת מהדפדפן.

### מודל וממשק
- מודל: `gemini-3.8-flash`, כפי שאושר ב-tech-stack.md (14.10.2026). שם המודל מוגדר פעם אחת בהגדרות ה-Workflow (ואחרי MVP גם בפונקציה), כך שהחלפה היא שינוי במקום אחד.
- המכסה החינמית של המודל לא אומתה. בודקים אותה ב-AI Studio לפני ההרצה של `ai-tests.md`. אם היא נמוכה מדי, החלופה היא `gemini-3.5-flash-lite` (דורשת אישור).
- קריאה בנתיב ה-Interactions API: `POST https://generativelanguage.googleapis.com/v1beta/interactions`, המפתח בכותרת `x-goog-api-key`.
- פלט במבנה קבוע: `response_format` עם `type: text`, `mime_type: application/json` ו-`schema`.
- **החלטה:** לא ידוע לי שדה נפרד להוראות מערכת בממשק הזה, ולכן ההוראות והאירוע נשלחים יחד בשדה `input`.
- אם צומת Google Gemini ב-n8n לא תומך בפלט JSON קבוע, משתמשים בצומת HTTP Request עם אותו גוף.

### נתיב א' – אירוע Google (ב-MVP, F36 ו-F38)
**מי קורא:** n8n, ישירות. מפתח Gemini ב-Credentials של n8n.

**הפרומפט המרכזי** (מועתק מילה במילה מסעיף 10 ב-product-10-definitions.md; זה הנוסח הקובע, ואין לשנות אותו בלי אישור):

```
You are the AI suggestion layer of Home-me, a family responsibility management system. You receive an approved or newly imported family event. Suggest one short, practical preparation task that could help the family get ready for the event. The suggestion must be directly related to the event context and should add useful information that is not already written in the event. Do not create, edit, assign or complete anything automatically. Return only a proposed task for parent approval. Do not invent personal facts about the family beyond the provided event data.
```

**מה נשלח למודל** (שדה `input`):
1. הפרומפט המרכזי שלמעלה, בלי שינוי.
2. פרטי האירוע בלבד כ-JSON: `title`, `date`, `start_time`, `end_time`, `notes`.
3. `notes` נחתך ל-500 תווים (course-stack.md: הגבלת אורך קלט).
4. לא נשלחים שמות בני בית, מזהים או כתובות מייל.

**סכמת הפלט:**
```json
{ "type": "object",
  "properties": { "title": { "type": "string" } },
  "required": ["title"] }
```

**בדיקה בקוד** (צומת Code ב-n8n, לפני שמירה): `title` הוא מחרוזת לא ריקה אחרי `trim`, באורך עד 100 תווים. אם הבדיקה נכשלת, או שהקריאה נכשלת, לא נשמרת הצעה, והאירוע נשמר כרגיל.

**מה נשמר** (שורה חדשה ב-`tasks`):

| שדה | ערך |
|---|---|
| title | `title` מהמודל |
| date | `date` של האירוע |
| time | null |
| status | `todo` |
| assigned_member_ids | `[]` |
| notes | `הצעה לאירוע: {כותרת האירוע}` |
| source | `ai` |
| proposal_status | `proposed` |

**זרימה אחרי הצעה:** ההצעה מופיעה ב-Pending. אישור מעדכן ל-`approved` והיא נעשית משימה רגילה שאפשר לערוך ולשייך (נשארת בלי שיוך עד שהורה משייך). דחייה מעדכנת ל-`rejected`.

### נתיב ב' – אירוע פנימי (אחרי MVP, F37)
**מי קורא:** פונקציה אחת, `api/suggest.js` ב-Vercel.

- הדפדפן שולח `POST /api/suggest` עם `Authorization: Bearer {access_token של ההורה}` וגוף עם פרטי האירוע (אותם שדות כמו בנתיב א').
- הפונקציה מאמתת את ה-Token מול Supabase Auth (`GET {SUPABASE_URL}/auth/v1/user` עם המפתח הציבורי). בלי Token תקין: `401`. **החלטה:** כך נקודת הקצה לא מאפשרת לכל אדם להשתמש במכסת המודל.
- היא מאשרת בקשות (CORS) רק מכתובת האתר ב-GitHub Pages, ועונה גם לבקשת OPTIONS.
- היא מגבילה את גוף הבקשה, קוראת למודל בנתיב ובסכמה זהים, ובודקת את הפלט.
- היא מחזירה תמיד JSON: `{ "ok": true, "title": "…" }` או `{ "ok": false, "error": "…" }`. בלי מפתח ובלי שגיאה גולמית של הספק.
- ה-JS בדפדפן שומר את ההצעה ב-`tasks` בשם המשתמש (RLS מתיר). **החלטה:** הפונקציה לא כותבת למסד, ולכן לא צריכה מפתח סודי של Supabase.
- משתני סביבה: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. אחרי שינוי משתנה – Redeploy.

### בדיקות
`ai-tests.md` בשורש הריפו: לפחות 10 קלטי דמה, התוצאה הצפויה לכל אחד ואחוז ההצלחה.

---

## 5. אינטגרציות, APIs ואוטומציות

### מפת אינטגרציות
| מה | מי קורא | איך | הרשאה |
|---|---|---|---|
| Supabase (טבלאות, Auth) | דפדפן | `supabase-js` | מפתח ציבורי + Session + RLS |
| Supabase (כתיבה) | n8n | צומת Supabase או HTTP Request ל-REST | מפתח סודי ב-Credentials של n8n |
| Google Calendar | n8n | צומת Google Calendar, Managed OAuth2, קריאה בלבד | חשבון Google אחד של יומן בדיקה |
| Gemini | n8n (MVP) / `api/suggest.js` (אחרי MVP) | REST | מפתח Gemini אצל הקורא |
| Gmail | n8n | צומת Gmail | חשבון Gmail של הסטודנט, כתובות בדיקה |

### Workflows ב-n8n

**W1 – Google → Pending ו-AI (ב-MVP: F31, F33, F36, F38)**
1. טריגרים: Schedule כל 4 שעות, ו-Manual Trigger להרצה לפני הדמו.
2. Google Calendar, Get Many events מהיומן, מהיום ועד 30 יום קדימה. **החלטה:** חלון של 30 יום, כדי להגביל את כמות האירועים.
3. לכל אירוע: חיפוש ב-`events` לפי `google_event_id`.
4. אם קיים, בכל סטטוס (כולל `dismissed`): דלג (עדכון הוא F32, אחרי MVP).
5. אם חדש: המרה ל-`date`, `start_time`, `end_time` בשעון ישראל, והכנסה ל-`events` עם `source = google`, `status = pending`, `assigned_member_ids = []`.
6. קריאה למודל לפי סעיף 4 נתיב א', בדיקה, והכנסת ההצעה ל-`tasks`.
7. אילוץ ה-unique על `google_event_id` הוא רשת ביטחון נגד כפילות.

**W2 – עדכון אירוע מ-Google (אחרי MVP, F32):** כמו W1, אבל לאירוע קיים: עדכון `title`, `date`, `start_time`, `end_time`, `notes` ו-`updated_from_google = true`. הסטטוס לא משתנה. הממשק מציג "עודכן ב-Google".

**W3 – מייל תזכורת למשימה (אחרי MVP, F34):** Schedule כל שעה. **החלטה:** שעה ולא 5 דקות, כדי להישאר במכסת ההרצות החודשית (tech-stack.md). שליפת משימות עם `reminder_at` שעבר, `reminder_sent = false` ו-`status = 'todo'`, שליחת מייל בצומת Gmail, ועדכון `reminder_sent = true`. הדיוק הוא שעה.

**W4 – מייל על אירוע Google חדש (אחרי MVP, Could, F35):** נקרא בסוף W1 אחרי הכנסה של אירוע חדש. שולח מייל לשני ההורים. כתובות המייל נשמרות בהגדרות ה-Workflow ב-n8n, לא בריפו.

### חזרתיות (F16, אחרי MVP) – בדפדפן
- בשמירת משימה עם `daily` או `weekly`, `js/recurrence.js` מחשב את המופעים: 28 שורות ליומית, 4 לשבועית (4 שבועות מיום התחלת המשימה). **החלטה:** שבועית חוזרת באותו יום בשבוע.
- הכנסה אחת (`insert` של מערך שורות). כל מופע שורה עצמאית.
- אין מחיקה או חידוש אוטומטי של מופעים. מחיקה ידנית (F44) מוחקת מופע אחד בלבד.

### חפיפות (F10, אחרי MVP) – בדפדפן
- `js/overlap.js` רץ על פריטי היום אחרי הטעינה, לכל בן בית בנפרד (לפי `assigned_member_ids`).
- **החלטה:** למשימה אין שעת סיום, ולכן משימה היא נקודת זמן. חפיפה היא: שני אירועים עם טווחים חופפים, או משימה/אירוע שמתחילים בדיוק באותה שעה, או משימה שנופלת בתוך טווח של אירוע.
- הסימון הוא אייקון ומילה "חפיפה", לא צבע בלבד.

### "עודכן לאחרונה"
`js/ui.js` שומר את שעת הטעינה האחרונה המוצלחת מ-Supabase ומציג אותה ליד כפתור הרענון.

---

## 6. מפתחות API – מה יושב איפה

| מפתח | איפה נשמר | בדפדפן? |
|---|---|---|
| Supabase URL + מפתח ציבורי (anon / publishable) | `js/config.js` בריפו | **כן** (מותר: מוגן ב-RLS) |
| Supabase מפתח סודי (service_role / secret) | Credentials ב-n8n | **אסור** |
| Gemini API key | Credentials ב-n8n; אחרי MVP גם משתנה סביבה `GEMINI_API_KEY` ב-Vercel | **אסור** |
| חיבור Google Calendar | Credentials ב-n8n (Managed OAuth2) | **אסור** |
| חיבור Gmail | Credentials ב-n8n | **אסור** |
| סיסמאות ההורים | Supabase Auth בלבד | הקלדה בטופס כניסה בלבד |
| כתובות מייל לבדיקה | הגדרות ה-Workflow ב-n8n | **אסור** בריפו |

כללים:
- הריפו ציבורי. אין בו מפתח סודי, לא בקוד, לא ב-HTML ולא בקבצי הגדרות, וגם לא ב-`n8n/*.json` (ייצוא Workflows ללא Credentials וללא כתובות מייל).
- מפתח סודי חי בשני מקומות בלבד: n8n, ומשתני הסביבה של הפונקציה.
- הדפדפן פונה רק ל-Supabase (ולפונקציה אחרי MVP). אף פעם לא ל-Gemini, ל-Google Calendar או ל-Gmail.
- **תוכן שמגיע מבחוץ הוא לא אמין.** כותרות אירועי Google והצעות AI מוצגות תמיד עם `textContent`, לא עם `innerHTML`.

---

## 7. מבנה התיקיות

```
/                          ← שורש הריפו = שורש GitHub Pages (ענף main)
├── index.html             ← לוח היום (Home)
├── login.html             ← כניסה
├── shopping.html          ← רשימת קניות
├── pending.html           ← ממתין לאישור
├── calendar.html          ← יומן שבועי (F21, אחרי MVP)
├── css/
│   └── styles.css         ← משתני צבע, RTL, מובייל קודם (375px), רכיבים
├── js/
│   ├── config.js          ← SUPABASE_URL, SUPABASE_ANON_KEY, TIMEZONE, שעות ה-Timeline (ברירת מחדל 07–22, PRD 4.13), מספר השבועות של חזרתיות (4)
│   ├── supabase.js        ← יצירת client (ה-global `supabase` מה-CDN)
│   ├── auth.js            ← בדיקת Session, כניסה, יציאה, ההורה הנוכחי
│   ├── members.js         ← טעינת data/members.json ועזרים (שם, צבע, Avatar)
│   ├── nav.js             ← סרגל ניווט משותף + מונה Pending
│   ├── ui.js              ← Modal, הודעות ריק/טעינה/שגיאה, "עודכן לאחרונה"
│   ├── time.js            ← תאריכים ושעות בשעון ישראל
│   ├── data/
│   │   ├── tasks.js       ← שאילתות ועדכונים של tasks
│   │   ├── events.js      ← שאילתות ועדכונים של events
│   │   └── shopping.js    ← שאילתות ועדכונים של shopping_items
│   ├── board.js           ← דף Home: אזור "ללא שעה" + Timeline
│   ├── task-modal.js      ← Modal יצירה ועריכה של משימה
│   ├── event-modal.js     ← Modal אירוע פנימי + Modal אישור ושיוך אירוע Google
│   ├── pending.js         ← דף Pending
│   ├── shopping-page.js   ← דף הקניות
│   ├── recurrence.js      ← חישוב מופעים חוזרים (F16, אחרי MVP)
│   ├── overlap.js         ← חפיפות (F10, אחרי MVP)
│   └── calendar.js        ← יומן שבועי (F21, אחרי MVP)
├── data/
│   └── members.json       ← בני הבית (נתוני דמה)
├── assets/
│   └── avatars/           ← m1.png … m4.png (איורים שהמשתמש מספק)
├── sql/
│   ├── schema.sql         ← יצירת שלוש הטבלאות, אילוצים ואינדקסים
│   ├── policies.sql       ← RLS
│   └── seed.sql           ← נתוני דמה (לפחות 5 שורות בכל טבלה)
├── n8n/                   ← ייצוא Workflows (ללא Credentials וללא כתובות מייל)
│   ├── w1-google-to-pending.json
│   └── …                  ← W2–W4 אחרי MVP
├── api/
│   └── suggest.js         ← נתיב ב' של ה-AI (F37, אחרי MVP בלבד)
├── package.json           ← רק כש-`api/` נוסף: `{ "type": "module" }`
└── ai-tests.md            ← בדיקות ה-AI (דרישת הקורס)
```

### מוסכמות קוד
- כל דף HTML: `<html lang="he" dir="rtl">`, גופן Assistant מ-Google Fonts (משקלים 400, 600, 700, לפי DESIGN.md), `meta viewport`.
- `supabase-js` גרסה 2 נטען בתג `<script>` רגיל מ-jsDelivr, **בגרסה מדויקת נעולה**, לפני מודולי האפליקציה. מודולי האפליקציה נטענים עם `<script type="module">`.
- כל גישה לטבלה עוברת דרך `js/data/*.js`. דפים ו-Modals לא פונים ל-`supabase` ישירות.
- שמות טבלאות, שדות וקבצים באנגלית. תוכן ממשק בעברית.
- נגישות לפי course-stack.md: תווית לכל שדה, ניווט מקלדת, מצב לא מועבר בצבע בלבד.
- localStorage: רק Token של `supabase-js`. אין שימוש אחר.

### מצבי ממשק
לכל רשימה ולכל טעינה: מצב טעינה (טקסט "טוען…"), מצב ריק (הודעה קצרה בעברית) ומצב שגיאה (הודעה בעברית וכפתור "נסה שוב"). הניסוח מרוכז ב-`js/ui.js`.

---

## 8. זרימות עיקריות – מהלך הנתונים

**טעינת לוח היום:** `auth.js` בודק Session ← `board.js` שולף tasks ו-events של היום הנבחר ← `members.js` מצמיד שם, צבע ו-Avatar ← רינדור ← `ui.js` מעדכן "עודכן לאחרונה".

**מעבר בין ימים (F42):** `board.js` מחזיק את היום הנבחר במשתנה בזיכרון בלבד (לא ב-localStorage ולא בכתובת), ומתחיל אותו בהיום לפי `time.js`. חץ מזיז אותו ביום אחד ושולף מחדש. "היום" מחזיר אותו להיום. רענון הדף חוזר להיום. **החלטה:** בלי פרמטר בכתובת, כדי להישאר פשוט.

**יצירת משימה:** כפתור + פותח `task-modal.js` ← בדיקת קלט (כותרת חובה, תאריך חובה) ← `tasks.insert` ← רענון הלוח. משימה חדשה: `status = todo`, `proposal_status = none`, `source = manual`.

**מחיקת משימה או אירוע פנימי:** "מחיקה" בחלון העריכה ← אישור קצר ← `tasks.delete` או `events.delete` לפי `id` ← סגירת החלון ורענון הלוח.

**שינוי סטטוס מכרטיס:** `tasks.update({status, updated_at}).eq('id', …)` ← רענון הכרטיס. עריכה מקבילה: Last Write Wins.

**אירוע Google, מקליטה ללוח:** W1 מכניס `pending` ← הורה נכנס ל-Pending (המונה מראה את הפריט) ← Modal אישור ושיוך ← עדכון מותנה (`status = pending`) ל-`approved` עם `assigned_member_ids` ← האירוע מופיע בלוח. או: "התעלם" בכרטיס ← עדכון מותנה ל-`dismissed` ← האירוע יוצא מהתיבה והמונה יורד.

**הצעת AI:** W1 שומר `proposed` ← הורה ב-Pending ← אישור (עדכון מותנה ל-`approved`) או דחייה (`rejected`) ← משימה מאושרת מופיעה בלוח.

**קניות:** Quick Add בודק (בלי רגישות לאותיות) אם קיים פריט פעיל באותו שם. אם כן, מתריע ומציע לעדכן כמות. אחרת `insert`. סימון "נקנה" מעדכן `purchased = true` והפריט נעלם. "בטל" בהודעה (F46, 5 שניות) מעדכן חזרה `purchased = false` ומרענן את הרשימה. מחיקה היא `delete` מיידי.

---

## החלטות מרכזיות (ADRs)

### ADR-1: הרצה מקומית בשרת סטטי של Python
**הקשר:** האתר בנוי ממודולי JS (`<script type="module">`) וטוען את `data/members.json` עם `fetch`. דפדפן חוסם את שניהם כשפותחים קובץ HTML ישירות מהמחשב (`file://`), ולכן צריך שרת מקומי כדי לבדוק את האתר לפני push. הסטאק אוסר כלי בנייה, ו-CLAUDE.md אוסר Docker.
**החלטה:** מריצים משורש הפרויקט את `python3 -m http.server 8000`, ופותחים `http://localhost:8000`. Python 3 כבר מותקן ב-Mac (נבדק: 3.9.6), ולכן אין צורך להתקין דבר. אם פורט 8000 תפוס, משתמשים בפורט אחר ומעדכנים את פקודת ההרצה ב-CLAUDE.md.
**השלכות:**
- אין קבצי הגדרה או תלויות חדשות בריפו. מה שרץ מקומית הוא בדיוק מה ש-GitHub Pages מגיש.
- כל הנתיבים בקוד יחסיים (`js/…`, `data/members.json`), כדי שיעבדו גם מקומית (`/`) וגם ב-GitHub Pages (`/Homie/`).
- הכניסה היא אימייל וסיסמה בלבד, ולכן Supabase לא צריך כתובת הפניה (Redirect URL) ל-localhost.
- האתר המקומי מתחבר לאותו פרויקט Supabase של האתר החי (אין הפרדה בין Development ל-Production ב-V1). נתוני הדמה משותפים לשניהם.
