# 🎨 WasteWise - Visual Design Guide

## Screen Flow Diagram

```
┌─────────────┐
│   SPLASH    │ (1.5s animation)
│  ♻️ Logo    │
│ WasteWise   │
└──────┬──────┘
       │
       ├─── First Time? ──────────┐
       │                          ▼
       │                  ┌───────────────┐
       │                  │  ONBOARDING   │
       │                  │   Page 1/3    │
       │                  │   📅 Track    │
       │                  ├───────────────┤
       │                  │   Page 2/3    │
       │                  │   🚛 Routes   │
       │                  ├───────────────┤
       │                  │   Page 3/3    │
       │                  │   💰 Rewards  │
       │                  └───────┬───────┘
       │                          │
       ├─── Seen Onboarding? ────┤
       │                          ▼
       │                  ┌───────────────┐
       │                  │     LOGIN     │
       │                  │  Phone/Email  │
       │                  │  [ ] Phone    │
       │                  │  [✓] Email    │
       │                  └───────┬───────┘
       │                          │
       └─── Logged In? ───────────┤
                                  ▼
                          ┌───────────────┐
                          │   MAIN APP    │
                          │  (tabs)/      │
                          │  Home/Explore │
                          └───────────────┘
```

## Color Palette

```
Primary Colors:
┌────────────┬────────────┬────────────┐
│  #16A34A   │  #0F766E   │  #22C55E   │
│ Eco Green  │ Deep Teal  │ Lime Green │
│  Primary   │   Accent   │  Success   │
└────────────┴────────────┴────────────┘

Neutrals:
┌────────────┬────────────┬────────────┐
│  #0B1220   │  #64748B   │  #F8FAFC   │
│    Ink     │    Gray    │  Off-White │
│   Text     │  Subtitle  │ Background │
└────────────┴────────────┴────────────┘

Borders & Shadows:
┌────────────┬────────────┐
│  #E2E8F0   │  #CBD5E1   │
│   Border   │  Inactive  │
└────────────┴────────────┘
```

## Typography Scale

```
┌─────────────────────────────────────┐
│ H1 - Title          32px / Bold     │
│ WasteWise                           │
├─────────────────────────────────────┤
│ H2 - Subtitle       26px / Bold     │
│ Know your next pickup               │
├─────────────────────────────────────┤
│ Body - Regular      16px / Regular  │
│ Live schedules and alerts           │
├─────────────────────────────────────┤
│ Button              17px / Bold     │
│ GET STARTED                         │
├─────────────────────────────────────┤
│ Caption             14px / Regular  │
│ By continuing you agree...          │
└─────────────────────────────────────┘
```

## Component Styles

### Buttons

**Primary Button** (Green)
```
Background: #16A34A
Text: White / 17px Bold
Padding: 16px vertical
Border Radius: 16px
Shadow: 0 4px 8px rgba(22,163,74,0.3)
```

**Secondary Button** (Outlined)
```
Background: White
Text: #0F766E / 17px Bold
Border: 2px solid #D1FAE5
Border Radius: 16px
```

**Ghost Button** (Minimal)
```
Background: Transparent
Text: #64748B / 17px
Border: 2px solid #E2E8F0
Border Radius: 16px
```

### Input Fields

```
Background: White
Border: 1px solid #E2E8F0
Border Radius: 14px
Padding: 16px horizontal, 16px vertical
Font: 16px Regular
Placeholder: #94A3B8

Label:
Font: 14px Bold
Color: #334155
Margin Bottom: 8px
```

### Cards & Containers

```
Background: White
Border Radius: 20-24px
Shadow: 0 8px 16px rgba(0,0,0,0.06)
Padding: 24-32px
```

## Screen Specifications

### 1. Splash Screen
```
┌─────────────────────────────┐
│                             │
│       [Gradient BG]         │
│   #16A34A → #0F766E         │
│                             │
│         ┌─────┐             │
│         │ ♻️  │ Logo        │
│         └─────┘             │
│                             │
│       WasteWise             │
│   Smart Waste•Clean Cities  │
│                             │
└─────────────────────────────┘

Animation: Scale 0.9→1.0 + Fade (600ms)
Duration: 1.5s
```

### 2. Onboarding Pages
```
┌─────────────────────────────┐
│                             │
│        ┌─────────┐          │
│        │   📅    │ Icon     │
│        │  Circle │ 50% width│
│        └─────────┘          │
│                             │
│   Know your next pickup     │
│                             │
│   Live schedules and        │
│   alerts—no more days       │
│                             │
│       ○ ● ○  (dots)         │
│                             │
│  [Skip]      [Next]         │
│                             │
└─────────────────────────────┘

Swipeable: Horizontal FlatList
Page Indicator: 8px dots, 24px active
```

### 3. Login Screen
```
┌─────────────────────────────┐
│  Welcome back               │
│  Log in to continue         │
│                             │
│  ┌─────────┬─────────┐      │
│  │  Phone  │  Email  │ Tab  │
│  └─────────┴─────────┘      │
│                             │
│  Email                      │
│  ┌───────────────────┐      │
│  │ Enter your email  │      │
│  └───────────────────┘      │
│                             │
│  Password                   │
│  ┌───────────────────┐      │
│  │ ••••••••••••••    │      │
│  └───────────────────┘      │
│                             │
│     [Continue]              │
│                             │
│     Forgot password?        │
│                             │
│  ────────  or  ────────     │
│                             │
│  [Create New Account]       │
│                             │
│  By continuing you agree... │
│                             │
└─────────────────────────────┘
```

## Spacing System

```
Micro:    4px   - Between related items
Small:    8px   - Icon-text gaps
Medium:   16px  - Form field spacing
Large:    24px  - Section padding
XL:       32px  - Screen padding
XXL:      40px  - Major sections
```

## Border Radius Guide

```
Small:    8px   - Tags, badges
Medium:   14px  - Inputs, buttons
Large:    20px  - Cards
XL:       24px  - Hero sections
Circle:   50%   - Profile pics, icons
```

## Shadow Styles

```
Light:    0 2px 4px rgba(0,0,0,0.06)
Medium:   0 4px 8px rgba(0,0,0,0.10)
Heavy:    0 8px 16px rgba(0,0,0,0.12)
Colored:  0 4px 8px rgba(22,163,74,0.3)  (Green shadow)
```

## Icon Guidelines

- Use emojis as placeholders: ♻️ 📅 🚛 💰
- Replace with SF Symbols or custom SVGs
- Size: 64-80px for onboarding
- Size: 24-32px for UI elements
- Color: Match primary/accent colors

## Animation Timings

```
Fast:     200ms  - Hover, tap feedback
Normal:   400ms  - Sheet slides, fades
Slow:     600ms  - Page transitions
Entry:    800ms  - Splash animations
```

## Responsive Breakpoints

```
Mobile:   < 768px   (Primary target)
Tablet:   768-1024px
Desktop:  > 1024px  (Web only)
```

---

**Design Status:**
- ✅ Splash Screen - Complete
- ✅ Onboarding (3 pages) - Complete
- ✅ Login Screen - Complete
- ⏳ Sign Up Screen - TODO
- ⏳ Forgot Password - TODO
- ⏳ OTP Verification - TODO

**Next Design Tasks:**
1. Replace emoji placeholders with custom illustrations
2. Add app logo SVG
3. Create sign-up flow screens
4. Design customer home dashboard
5. Design cleaner home dashboard
