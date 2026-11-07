# Home-me Design System · v1

Sources: [DESIGN.md](DESIGN.md), the style guide and the mockups.
Canvas: https://claude.ai/artifact/HBX52DUk5Tg6zkCG1dMUy9
Code tokens: [tokens/tokens.css](tokens/tokens.css) · [tokens/tokens.json](tokens/tokens.json)

Anything marked **(proposed)** is not in the mockups yet and still needs your approval.

---

## 1. Principles
- **Warm Scandinavian:** quiet, natural, family-friendly. Paper background, soft earth tones and one fir-green accent.
- **Depth from tone and thin lines,** not heavy shadows. Layers: paper (bg) → warm white (card) → oat (area inside a card).
- **Color is never the only signal.** Every status chip has an icon and a word, and every member color appears with an avatar or a name.
- **RTL first.** Times, dates and numbers are shown LTR inside the line (`16:00–17:00`, `12.10`).

---

## 2. Color (60-30-10)

### 60% · Neutrals and text
| Name | Token | Hex | Use |
|---|---|---|---|
| נייר חם | `--color-bg` | `#F2EBE0` | Screen background |
| לבן חם | `--color-surface` | `#FFFEFC` | Cards, modals, fields, bars |
| חול | `--color-border` | `#E6DFD3` | Lines, dividers, progress track |
| פחם | `--color-text` | `#2B2724` | Headings and primary text |
| אפר | `--color-text-secondary` | `#5A534B` | Secondary text and icons |
| אבן | `--color-text-muted` | `#6B6258` | Placeholder and notes |
| רקע מוחלש | `--color-bg-done` | `#F7F3EC` | Completed task (added, not in the style guide) |
| קו מקווקו | `--color-line-dashed` | `#D8CFC0` | Hour lines, device frame (added) |
| מסגרת שדה | `--color-border-field` | `#8A7F72` | Field and empty-checkbox border (added) |

### 30% · Earth tones
| Name | Token | Hex | Use |
|---|---|---|---|
| שיבולת | `--color-oat` | `#E9DFCE` | Secondary button, todo chip, locked field |
| מרווה בהירה | `--color-sage-light` | `#E3EADC` | Done, active tab, member tint |
| חרס בהיר | `--color-clay-light` | `#F4DFD5` | Overlap and alerts, member tint |
| שמיים אבקתיים | `--color-sky-light` | `#DEE8EC` | AI suggestion, member tint |
| חמאה | `--color-butter` | `#F7EACB` | Pending, member tint |

### 10% · Accent and state
| Name | Token | Hex | Use |
|---|---|---|---|
| ירוק אשוח | `--color-primary` | `#2F5A4A` | Primary button, +, logo, active link |
| Pressed | `--color-primary-pressed` | `#24473A` | Pressed primary **(proposed)** |
| מרווה | `--color-sage` | `#6F9170` | Checked checkbox, progress |
| הצלחה – טקסט | `--color-success-text` | `#38663F` | Text on sage-light |
| אדום לבנים | `--color-danger` | `#A33B2B` | Alert icon, counter badge |
| שגיאה – טקסט | `--color-danger-text` | `#9A3B28` | Text on clay-light |
| טרקוטה | `--color-terracotta` | `#CB7A56` | Member stripe |
| חרדל | `--color-mustard` | `#D6A23E` | Member stripe |
| כחול אבקתי | `--color-powder-blue` | `#6C93A6` | Member stripe |

**Modal scrim:** `--color-scrim` = `#2B2724` at 38%.

### Household members
Each member gets a **tint** (card and block background) and a **stripe** (4px edge on the inline-start side, checkbox fill).

| Member | Tint | Stripe |
|---|---|---|
| יואב | sage-light `#E3EADC` | sage `#6F9170` |
| דנה | clay-light `#F4DFD5` | terracotta `#CB7A56` |
| נועה | butter `#F7EACB` | mustard `#D6A23E` |
| איתי | oat `#E9DFCE` | powder-blue `#6C93A6` |

### Contrast (minimum 4.5:1)
| Pair | Ratio |
|---|---|
| Charcoal on warm white | 14.7:1 |
| Warm white on fir green | 7.8:1 |
| Fir green on sage-light | 6.4:1 |
| Success text on sage-light | 5.4:1 |
| Error text on clay-light | 5.4:1 |
| Ash on paper | 5.0:1 |

---

## 3. Typography
One font, **Assistant** (Hebrew + Latin): Regular 400, SemiBold 600, Bold 700.

| Role | Token | Size / line height | Weight |
|---|---|---|---|
| Product name | `--font-display` | 32 / 40 | 700 |
| Screen title | `--font-title-l` | 24 / 32 | 700 |
| Section title | `--font-title-m` | 20 / 28 | 700 |
| Card title | `--font-title-s` | 17 / 24 | 600 |
| Body | `--font-body` | 17 / 26 | 400 |
| Meta and caption | `--font-caption` | 14 / 20 | 400 |
| Button | `--font-label` | 17 / 24 | 600 |
| Tags and badges | `--font-caption-xs` | 12 / 16 | 600 **(proposed)** |

> **Open issue:** the mockups use tag text smaller than the 14px minimum. Either approve `caption-xs` for tags and badges only, or raise tags to 14.

---

## 4. Space, shape, elevation

**Spacing (8pt grid):** `--space-1…6` = 4, 8, 16, 24, 32, 48.
Card padding 16 · gap between cards 16 · gap between sections 32–48 · screen margin 20.

**Radii**
| Token | Value | Use |
|---|---|---|
| `--radius-s` | 6 | Chips and blocks |
| `--radius-check` | 5 | Checkbox |
| `--radius-m` | 10 | Buttons and fields |
| `--radius-l` | 12 | Cards, modals, containers |
| `--radius-device` | 30 | Phone frame in mockups |
| `--radius-full` | 999 | Avatars and + button |

**Shadows**
| Token | Value | Use |
|---|---|---|
| `--shadow-none` | none | Sand border only |
| `--shadow-xs` | `0 1px 2px` @ 6% | Cards |
| `--shadow-soft` | `0 4px 14px` @ 8% | Floating panels, + button |

---

## 5. Icons and avatars
- **Icons:** outline, 24px, 1.5 stroke, ash `#5A534B`. Set: home, calendar, task, cart, bell, people, AI sparkle, settings, plus, clock, overlap (triangle), lock, refresh, close.
- **Avatars:** flat, friendly illustrations in a circle on a warm tint with a thin ring in the member's stripe color. Sizes: 24 (tags, blocks), 32 (cards), 48 (pickers, profile), 72 (settings). *The canvas uses initials as placeholders until the illustrations are uploaded.*

---

## 6. Components

### Buttons
| Variant | Style |
|---|---|
| Primary | Fir-green bg, warm-white text, height 48, radius 10 |
| Secondary | Oat bg, fir-green text, 1px sand border |
| Disabled | Sand bg, stone text |
| Pressed | `#24473A` **(proposed)** |
| Focus | `--focus-ring`: 2px ring with a 2px offset **(proposed)** |
| + (FAB) | 56px fir-green circle, white +, soft shadow. Opens a menu: "משימה חדשה" / "אירוע חדש" |
| Icon | 44×44 target, ash icon, `aria-label` required |

### Fields
- Warm-white bg, 1px field border, radius 10, label above (14 SemiBold).
- **Focus:** 2px fir-green border plus a 4px sage-light halo.
- **Locked (Google):** oat bg, sand border, lock icon.
- **Dropdown:** like a field, with a leading icon and a chevron.
- **Error (proposed):** 2px brick border, error text below with a triangle icon.
- **Radio (repeat):** 20px circle, fir-green when selected.

### Checkbox and member picker
- 24px square, radius 5. Empty: field border. Checked: sage, or the member's stripe color on that member's card. White check.
- **Multi-select member chip:** checkbox, avatar and name, 44px tall. When selected: member tint, 1.5px fir-green border, SemiBold.

### Chips and tags
| Chip | Bg | Text | Icon |
|---|---|---|---|
| לביצוע ▾ | oat | charcoal | clock |
| הושלמה | sage-light | success-text | check |
| ממתין לאישור | butter | charcoal | clock |
| חפיפה | clay-light | danger-text | triangle |
| הצעת AI | sky-light | charcoal | sparkle |

- A tappable status chip shows a ▾ and toggles todo ⇄ done.
- **Source tags** "Home-me" / "Google" / "Google · קריאה בלבד": warm-white bg, sand border, small icon.
- **Counter badge:** brick circle, white bold number.

### Cards
- **Task card:** warm white, sand border, radius 12, xs shadow. Checkbox, title, avatar + name, time, status chip.
- **Completed task:** `bg-done` background, strikethrough title in stone, "הושלמה" chip.
- **Event card:** member tint plus a 4px stripe, title, time range, avatar(s), source tag.
- **Overlap:** a "חפיפה" chip on both overlapping items of the same member.
- **Alert card:** clay-light container, red title with a circled icon, white cards inside.

---

## 7. Patterns

### Navigation
- **Desktop/tablet top bar:** logo, 4 links (active = fir green, SemiBold, 2px underline), counter on "ממתין לאישור", "עודכן לאחרונה" and a refresh button.
- **Phone bottom bar:** 4 tabs. The active tab is fir green with a sage-light pill around the icon. Counter on the pending tab.
- The 4 core screens are always reachable.

### Timeline (Today board)
- Rows per hour with dashed `#D8CFC0` lines, times on the inline-start side.
- Overlapping items sit side by side on desktop and stack on phone.

### Weekly calendar block (accessibility fix)
- The mockup identifies the owner by color alone. **Fix:** add a 16px avatar and the name inside the block.

### Pending items
- **Google event card:** title, day/date/time, Google tag, "בדוק ואשר" (primary).
- **AI suggestion card:** sky-light icon tile, title, "הצעה לאירוע: …", "אשר" (primary) and "דחה" (secondary).

### Modal
- Radius 12, soft shadow, scrim behind it. Header with title + ✕, labelled fields, primary before secondary.
- On phone: a full-width bottom sheet.

---

## 8. Missing states (proposed)
States described in the PRD with no design in the mockups. Each one uses only existing tokens.

| State | Proposal |
|---|---|
| Empty · Today board | Dashed card, sage icon circle, "אין משימות להיום", primary "הוספת משימה" |
| Empty · Pending / Shopping | Compact dashed card with an icon and one line of help text |
| Loading | Sand skeleton rows, no spinner; "עודכן לאחרונה" becomes "מעדכן…" |
| Error · refresh failed | Clay-light banner, "לא הצלחנו לעדכן", the last update time, "נסו שוב" |
| Updated in Google | Butter chip with a refresh icon; the old time shown struck through until dismissed |
| Duplicate shopping item | Mustard field border, butter notice: "עדכון כמות" / "הוספה בכל זאת" |
| Create by clicking an hour | Dashed sage-light slot "הוספה ב-14:00" that opens a new task with the time filled in |
| Edit mode | Same modal, title "עריכת משימה", fields filled in, "שמירת שינויים" |
| Keyboard focus | `--focus-ring` on every clickable element |

---

## 9. Open questions
1. Approve `caption-xs` (12px) for tags, or raise tags to 14?
2. Approve the proposed pressed, focus and error styles?
3. Is "נוצר ע״י" (created by) needed in edit mode? It isn't in the PRD.
4. Upload the avatar illustrations to replace the initials.
