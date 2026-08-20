# Frontend Planning Guide

**Project:** Donation Platform (School Organization)
**Framework:** Next.js 15 (App Router) + React 19 + TypeScript
**Last Updated:** August 20, 2026

---

## 1. Frontend Architecture

### 1.1 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | SSR, routing, API routes |
| UI Library | React 19 | Component-based UI |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible, customizable components |
| Forms | React Hook Form + Zod | Form validation |
| State | Zustand / React Context | Client state management |
| i18n | next-intl | Multi-language support |
| Icons | Lucide React | Icon library |
| Charts | Recharts | Dashboard analytics |
| Date | date-fns | Date formatting |
| HTTP | Fetch API | API calls |

---

## 2. Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routes
│   │   ├── (public)/             # Public pages
│   │   │   ├── page.tsx
│   │   │   ├── about/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (authenticated)/      # Protected pages
│   │   │   ├── dashboard/
│   │   │   ├── donate/
│   │   │   ├── history/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   └── admin/                # Admin pages
│   │       ├── users/
│   │       ├── reports/
│   │       └── layout.tsx
│   ├── api/                      # API routes
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── auth/                     # Auth components
│   │   ├── LoginButton.tsx
│   │   └── ProfileCompletion.tsx
│   ├── donation/                 # Donation components
│   │   ├── AmountSelector.tsx
│   │   ├── PaymentButton.tsx
│   │   └── DonationHistory.tsx
│   └── admin/                    # Admin components
│       ├── UserTable.tsx
│       └── ReportsDashboard.tsx
├── lib/
│   ├── api/                      # API client
│   │   ├── client.ts
│   │   ├── donations.ts
│   │   ├── users.ts
│   │   └── admin.ts
│   ├── auth/                     # Auth utilities
│   │   ├── next-auth.ts
│   │   └── session.ts
│   ├── utils/                    # Utility functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── hooks/                    # Custom hooks
│       ├── useAuth.ts
│       ├── useDonations.ts
│       └── useLanguage.ts
├── types/                        # TypeScript types
│   ├── user.ts
│   ├── donation.ts
│   └── api.ts
├── styles/                       # Global styles
└── middleware.ts                 # Next.js middleware
```

---

## 3. Page-by-Page Planning

### 3.1 Public Pages

#### Landing Page (`/`)
**Purpose:** Introduce organization, encourage donations

**Components:**
- Hero section with organization logo
- Mission statement (Bangla/English)
- Recent donation stats
- "Donate Now" CTA button
- Success stories/testimonials
- Footer with contact info

**Features:**
- Language toggle (top-right)
- Responsive design (mobile-first)
- Smooth animations (Framer Motion)
- SEO optimized (meta tags, Open Graph)

---

#### Login Page (`/login`)
**Purpose:** Authenticate users via Google

**Components:**
- Organization branding
- "Login with Google" button (large, prominent)
- Privacy policy link
- Terms of service link

**Flow:**
1. User clicks Google login
2. Redirect to Google OAuth
3. Google redirects back to callback
4. First-time users → Profile completion
5. Returning users → Dashboard

---

### 3.2 Authenticated Pages

#### Dashboard (`/dashboard`)
**Purpose:** User overview and quick actions

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header (Logo, Language, Profile)       │
├─────────────────────────────────────────┤
│  Welcome Banner                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Total Donated│  │ This Month   │   │
│  │   ৳5,000     │  │   ৳500       │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  Quick Actions                          │
│  [Donate Now] [View History]            │
│                                         │
│  Recent Donations (Last 5)              │
│  ┌─────────────────────────────────┐   │
│  │ Date  | Amount | Status         │   │
│  │ 8/20  | ৳500  | Success        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Components:**
- Stats cards (total donated, this month, total donations)
- Quick action buttons
- Recent donations table (last 5)
- Profile completion status (if incomplete)

---

#### Donate Page (`/donate`)
**Purpose:** Initiate donation flow

**Components:**
- Amount selector (preset: 100, 500, 1000, 5000, custom)
- Purpose selector (general fund, specific cause)
- Anonymous donation toggle
- Terms acceptance checkbox
- "Proceed to Payment" button

**Form Validation:**
- Amount: minimum 10 BDT, maximum 100,000 BDT
- Purpose: required
- Terms: must be checked

**Flow:**
1. User selects amount
2. User clicks "Proceed to Payment"
3. Frontend calls `/api/donations/create`
4. Backend returns bKash payment URL
5. Frontend redirects to bKash
6. User completes payment
7. bKash redirects back to success page

---

#### History Page (`/history`)
**Purpose:** View all past donations

**Components:**
- Filter bar (date range, status, amount)
- Donations table (paginated)
- Export to CSV button
- Search functionality

**Table Columns:**
- Date & Time
- Amount
- Transaction ID
- Payment Method
- Status (Success/Pending/Failed)
- Receipt download

---

#### Settings Page (`/settings`)
**Purpose:** Manage user profile and preferences

**Tabs:**
1. **Profile**
   - Name (read-only from Google)
   - Email (read-only from Google)
   - Phone number (required for bKash)
   - Avatar upload

2. **Preferences**
   - Language (Bangla/English)
   - Email notifications
   - Donation receipts

3. **Security**
   - Active sessions
   - Logout from all devices

---

### 3.3 Admin Pages

#### Admin Users (`/admin/users`)
**Purpose:** View and manage users

**Components:**
- User table with search and filters
- User details modal
- Ban/unban actions
- Export user list

**Table Columns:**
- Name
- Email
- Phone
- Total Donated
- Joined Date
- Status (Active/Banned)
- Actions (View, Ban)

---

#### Admin Reports (`/admin/reports`)
**Purpose:** View donation statistics

**Components:**
- Date range selector
- Key metrics:
  - Total donations
  - Total amount raised
  - Average donation
  - Top donors
- Charts:
  - Donations over time (line chart)
  - Donation amounts distribution (bar chart)
  - Payment success rate (pie chart)
- Export reports (PDF/CSV)

---

## 4. Component Design Patterns

### 4.1 Component Structure

```typescript
// Example: AmountSelector component
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AmountSelectorProps {
  onSelect: (amount: number) => void;
  presets?: number[];
}

export function AmountSelector({ 
  onSelect, 
  presets = [100, 500, 1000, 5000] 
}: AmountSelectorProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Select Amount</h3>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((amount) => (
          <Button
            key={amount}
            variant={selected === amount ? 'default' : 'outline'}
            onClick={() => {
              setSelected(amount);
              setCustom('');
              onSelect(amount);
            }}
          >
            ৳{amount}
          </Button>
        ))}
      </div>
      <input
        type="number"
        placeholder="Custom amount"
        value={custom}
        onChange={(e) => {
          setCustom(e.target.value);
          setSelected(null);
          onSelect(Number(e.target.value));
        }}
        className="mt-4 w-full"
      />
    </Card>
  );
}
```

---

### 4.2 Form Handling Pattern

```typescript
// Example: Donate form with React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const donateSchema = z.object({
  amount: z.number().min(10).max(100000),
  purpose: z.string().min(1),
  isAnonymous: z.boolean(),
  acceptTerms: z.boolean().refine(val => val === true),
});

type DonateFormData = z.infer<typeof donateSchema>;

export function DonateForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<DonateFormData>({
    resolver: zodResolver(donateSchema),
  });

  const onSubmit = async (data: DonateFormData) => {
    // Call API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 5. State Management

### 5.1 Global State (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  logout: () => set({ user: null }),
}));
```

### 5.2 Server State (TanStack Query)

```typescript
// hooks/useDonations.ts
import { useQuery } from '@tanstack/react-query';

export function useDonations() {
  return useQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const res = await fetch('/api/donations');
      return res.json();
    },
  });
}
```

---

## 6. Internationalization (i18n)

### 6.1 Language Configuration

**Supported Languages:**
- **Bangla (bn)** — Default
- **English (en)**

**URL Structure:**
- `/bn/dashboard` — Bangla
- `/en/dashboard` — English
- Default redirect to `/bn`

### 6.2 Translation Files

```
messages/
├── bn.json
└── en.json
```

**Example (bn.json):**
```json
{
  "common": {
    "welcome": "স্বাগতম",
    "login": "লগইন",
    "logout": "লগআউট",
    "dashboard": "ড্যাশবোর্ড"
  },
  "donation": {
    "selectAmount": "পরিমাণ নির্বাচন করুন",
    "proceedToPayment": "পেমেন্টে এগিয়ে যান",
    "thankYou": "ধন্যবাদ!"
  }
}
```

### 6.3 Language Switcher

```typescript
// components/LanguageSwitcher.tsx
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (locale: 'bn' | 'en') => {
    const newPath = pathname.replace(/^\/(bn|en)/, `/${locale}`);
    router.push(newPath);
  };

  return (
    <select onChange={(e) => switchLanguage(e.target.value as 'bn' | 'en')}>
      <option value="bn">বাংলা</option>
      <option value="en">English</option>
    </select>
  );
}
```

---

## 7. Responsive Design

### 7.1 Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### 7.2 Mobile-Specific Considerations

- **Touch targets:** Minimum 44x44px
- **Input types:** Use `inputmode="numeric"` for phone, `type="email"` for email
- **Bottom navigation:** For mobile dashboard
- **Swipe gestures:** For donation history
- **Optimized images:** WebP format, lazy loading

---

## 8. Performance Optimization

### 8.1 Strategies

1. **Image Optimization**
   - Next.js Image component
   - WebP format
   - Lazy loading
   - Responsive sizes

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting (automatic)

3. **Caching**
   - Static generation for public pages
   - ISR for donation history
   - Client-side caching with TanStack Query

4. **Bundle Size**
   - Tree shaking
   - Analyze with `@next/bundle-analyzer`
   - Target: <200KB initial bundle

### 8.2 Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

---

## 9. Accessibility (a11y)

### 9.1 Standards

- **WCAG 2.1 Level AA** compliance
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratio: 4.5:1 minimum

### 9.2 Implementation

- Use shadcn/ui (built-in accessibility)
- Test with screen readers (NVDA, JAWS)
- Keyboard shortcuts for power users
- Skip to main content link
- Focus indicators visible

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

```typescript
// components/__tests__/AmountSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AmountSelector } from '../AmountSelector';

describe('AmountSelector', () => {
  it('renders preset amounts', () => {
    render(<AmountSelector onSelect={() => {}} />);
    expect(screen.getByText('৳100')).toBeInTheDocument();
  });

  it('calls onSelect when amount is clicked', () => {
    const onSelect = vi.fn();
    render(<AmountSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByText('৳500'));
    expect(onSelect).toHaveBeenCalledWith(500);
  });
});
```

### 10.2 E2E Tests (Playwright)

```typescript
// e2e/donation-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete donation flow', async ({ page }) => {
  await page.goto('/login');
  await page.click('button:has-text("Login with Google")');
  // Complete OAuth flow
  await page.goto('/donate');
  await page.click('button:has-text("৳500")');
  await page.click('button:has-text("Proceed to Payment")');
  // Verify redirect to bKash
  await expect(page).toHaveURL(/bka.sh/);
});
```

---

## 11. UI/UX Design System

### 11.1 Color Palette

```css
/* Primary */
--primary: #E2136E;        /* bKash pink */
--primary-dark: #B10E58;
--primary-light: #FF4B91;

/* Secondary */
--secondary: #006A4E;      /* Bangladesh green */
--secondary-dark: #004D3A;
--secondary-light: #00876B;

/* Neutral */
--background: #FFFFFF;
--surface: #F9FAFB;
--border: #E5E7EB;
--text-primary: #111827;
--text-secondary: #6B7280;

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### 11.2 Typography

```css
/* Headings */
h1: 2.5rem (40px), font-weight: 700
h2: 2rem (32px), font-weight: 700
h3: 1.5rem (24px), font-weight: 600
h4: 1.25rem (20px), font-weight: 600

/* Body */
body: 1rem (16px), font-weight: 400
small: 0.875rem (14px), font-weight: 400

/* Font Family */
Bangla: Noto Sans Bengali, Kalpurush
English: Inter, system-ui
```

### 11.3 Spacing System

```css
/* 4px base unit */
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

---

## 12. Browser Support

- **Chrome/Edge:** Last 2 versions
- **Firefox:** Last 2 versions
- **Safari:** Last 2 versions
- **Mobile Safari:** iOS 14+
- **Chrome Android:** Last 2 versions

---

## 13. Development Tools

### 13.1 Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Error Lens
- GitLens
- Thunder Client (API testing)

### 13.2 Recommended Tools

- **Figma:** UI/UX design
- **Storybook:** Component development
- **Chromatic:** Visual regression testing
- **Lighthouse:** Performance auditing

---

**Document Owner:** Md. Rifat Hossain
**Review Cycle:** Monthly or when UI changes significantly
