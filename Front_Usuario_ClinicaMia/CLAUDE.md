# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Front Usuario - ClinicaMia** - Patient-facing medical appointment and services website built with Next.js 14.

## Project Overview

This is the frontend user application for ClinicaMia, a medical clinic management system. It provides a public-facing website where patients can:
- Browse departments and medical services
- View doctor profiles and specialties
- Book medical appointments
- Access blog posts and health information
- Contact the clinic

This is a **template-based implementation** using the ProHealth medical template, being customized for ClinicaMia's specific needs.

## ClinicaMia Brand & Strategic Differentiators

**Location**: Ibagué, Tolima, Colombia

**Brand Colors**:
- Primary: Dark Blue `#144F79`
- Secondary: Mint Green `#53B896`

**Contact Information**:
- Phone: 324 333 8555
- Email: info@clinicamiacolombia.com
- Address: Cra. 5 #28-85, Ibagué, Tolima

### Core Specializations & Content Priorities

**1. Enfermedades Metabólicas (Metabolic Diseases)**
- Primary focus area for specialized content
- All metabolic disease content must be validated by an endocrinologist
- Highlight expertise in hormone-related conditions
- Position as thought leaders in metabolic health

**2. Tiroides y Metabolismo (Thyroid & Metabolism)**
- **Key positioning**: National leaders in thyroid cancer management
- Emphasize experience and expertise in thyroid conditions
- Create dedicated content showcasing thyroid care capabilities
- Position ClinicaMia as the reference center for thyroid diseases

**3. Cirugía Plástica (Plastic Surgery)**
- Increase visibility in service portfolio
- Dedicated section for plastic and reconstructive surgery
- Showcase certified plastic surgeons and advanced techniques

### Required Content & Features

**Rutas de Atención (Care Pathways)**
- Implement care pathways according to **Resolución 3280** (Colombian healthcare regulation)
- Display clear patient journey flows
- Comply with Colombian healthcare standards

**Menú Médico-Científico (Medical-Scientific Menu)**
- Create dedicated section for medical and scientific content
- Target audience: Both patients and healthcare professionals
- Include research, publications, clinical protocols

**Tour Virtual (Virtual Tour)**
- Feature as highlighted news/announcement
- Virtual walkthrough of facilities including:
  - Operating rooms (quirófanos)
  - Patient rooms and facilities
  - Medical staff introductions
- Use as competitive differentiator against other clinics

**Hospitalización - Salas VIP (Hospitalization - VIP Rooms)**
- Showcase hospitalization facilities
- Highlight VIP areas once construction is completed
- Premium patient experience messaging

**Clínica Verde (Green Clinic)**
- Environmental commitment and sustainability messaging
- Showcase solar panels and sustainable infrastructure
- Position as eco-friendly healthcare facility
- "Green Clinic" brand attribute

**Farmacia (Pharmacy)**
- Expand online product catalog
- Display prices in Colombian Pesos (COP)
- E-commerce integration for pharmacy products
- Online ordering and delivery options

### Content Guidelines

- **Language**: All content in Spanish (target: Colombian market)
- **Local context**: Reference Ibagué and Tolima region
- **Medical validation**: Endocrinologist review required for metabolic/hormonal content
- **Regulatory compliance**: Follow Resolución 3280 and Colombian healthcare standards
- **Positioning**: Position as regional leader and national reference in thyroid care

## Tech Stack

- **Next.js** 14.0.4 (App Router)
- **React** 18
- **TypeScript** 5.9.3 (with allowJs enabled for gradual migration)
- **SASS/SCSS** for styling
- **Bootstrap** 5.3.2
- **React Hook Form** 7.66.0 for form management
- **Iconify React** for icons
- **React DatePicker** for date selection
- **React Slick** for carousels

## Commands

```bash
# Development
npm run dev        # Start development server (http://localhost:3000)

# Production
npm run build      # Build production bundle
npm start          # Start production server

# Code Quality
npm run lint       # Run ESLint
```

## Project Structure

```
front-usuario-clinicamia/
├── public/
│   └── images/          # Static images organized by section
│       ├── home_1/      # Home page variant 1 images
│       ├── home_2/      # Home page variant 2 images
│       ├── about/
│       ├── departments/
│       ├── doctors/
│       ├── blog/
│       └── ...
├── src/
│   └── app/
│       ├── (defaultLayout)/    # Main public routes with Header + Footer
│       │   ├── page.jsx       # Home page (/)
│       │   ├── layout.jsx     # Layout with Header + Footer
│       │   ├── about/
│       │   ├── appointments/
│       │   ├── blog/
│       │   ├── contact/
│       │   ├── departments/
│       │   ├── doctors/
│       │   ├── gallery/
│       │   ├── pricing-plan/
│       │   └── timetable/
│       ├── home-v2/            # Alternative home page layout
│       ├── home-v3/            # Another home page variation
│       ├── home-v4/            # Fourth home page variation
│       ├── ui/                 # Reusable UI components
│       │   ├── Header/
│       │   ├── Footer/
│       │   ├── Hero/
│       │   ├── Button/
│       │   ├── Section/       # Various section components
│       │   ├── AppointmentForm/
│       │   ├── ContactForm/
│       │   ├── Team/
│       │   ├── Testimonial/
│       │   ├── Slider/
│       │   └── ...
│       ├── sass/              # SCSS styles
│       │   ├── index.scss    # Main SCSS entry
│       │   ├── _custom.scss  # Custom styles
│       │   ├── common/       # Common style utilities
│       │   ├── default/      # Base styles
│       │   └── shortcode/    # Component-specific styles
│       ├── layout.js         # Root layout (fonts, metadata)
│       └── not-found.jsx     # 404 page
└── package.json
```

## Architecture & Patterns

### Route Groups

This app uses Next.js route groups to organize layouts:
- `(defaultLayout)/` - Public pages with standard Header + Footer
- `home-v2/`, `home-v3/`, `home-v4/` - Alternative home page layouts (template variations)

### Component Structure

**UI Components** (`src/app/ui/`)
- Organized by component type (Hero, Section, Button, etc.)
- Many components have style variations (e.g., `FooterStyle2.jsx`, `FooterStyle3.jsx`)
- Components are client-side by default unless specifically marked with `'use client'`

**Section Components** (`src/app/ui/Section/`)
Highly reusable section components:
- `AboutSection/`
- `AppointmentSection/`
- `BlogSection/` (with style variations)
- `DepartmentSection/` (with 6 style variations)
- `FeaturesSection/`
- `TestimonialSection/`
- `WorkingProcess/`
- `BannerSection/`
- `BrandsSection/`
- `FaqSection/`

### Data Pattern

Components receive data as props from page files. Data is typically defined inline in page components as arrays of objects:

```jsx
// Example from page.jsx
const departmentData = [
  {
    title: 'Emergency Department',
    iconUrl: '/images/home_1/department_icon_1.svg',
    href: '/departments/department-details'
  },
  // ...
];

// Passed to section
<DepartmentSection
  sectionTitle="Departments"
  bgUrl="/images/home_1/department_bg.svg"
  data={departmentData}
/>
```

### Styling Approach

- **SCSS modules** in `src/app/sass/`
- **Bootstrap 5.3.2** for grid and utilities
- **Custom SCSS** in `_custom.scss`
- Component-specific styles in `sass/shortcode/`
- Global styles imported in root `layout.js` via `import './sass/index.scss'`

### Client vs Server Components

- Most UI components use `'use client'` directive due to interactivity (forms, sliders, modals)
- Page components in routes are also typically client components
- Layouts can be server components if they don't need interactivity

## Path Aliases

```javascript
"@/*" → "src/*"
```

Example: `import Hero from '@/app/ui/Hero'`

## TypeScript Configuration

The project has TypeScript support with gradual migration enabled:
- TypeScript files (`.ts`, `.tsx`) are fully supported
- JavaScript files (`.jsx`, `.js`) are allowed via `allowJs: true`
- Strict mode is disabled to ease migration (`strict: false`)
- Use path aliases `@/*` in both TypeScript and JavaScript files

When adding new components, prefer TypeScript (`.tsx`) for better type safety.

## Key Features & Implementation

### Appointment Booking

**Main Component**: `src/app/ui/AppointmentForm/index.jsx`

The appointment form is a **multi-step form** (4 steps) built with React Hook Form:

**Step 1 - Personal Info** (`components/Step1PersonalInfo.jsx`):
- Name, Email, Phone
- Document Type and Document Number

**Step 2 - Medical Selection** (`components/Step2MedicalSelection.jsx`):
- **Cascading selection flow**: Department → Specialty → Doctor
- Mock data currently used (to be replaced with API calls)
- Shows doctor availability and ratings

**Step 3 - Date & Time** (`components/Step3DateTime.jsx`):
- Date picker for appointment date
- Time slot selection based on doctor availability

**Step 4 - Confirmation** (`components/Step4Confirmation.jsx`):
- Review all form data
- Payment method selection
- Terms and privacy acceptance

**Form Features**:
- **Auto-save**: Form data auto-saves to localStorage as draft (24-hour expiration)
- **Validation**: Step-by-step validation with React Hook Form
- **Accessibility**: ARIA labels, screen reader announcements, keyboard navigation
- **State management**: Uses `watch()`, `setValue()`, and `trigger()` from React Hook Form

**Page**: `src/app/(defaultLayout)/appointments/page.jsx`

### Multiple Home Page Variations

The template includes 4 different home page layouts:
1. `(defaultLayout)/page.jsx` - Main home (Home V1)
2. `home-v2/page.jsx` - Alternative layout with different sections
3. `home-v3/page.jsx` - Another variation
4. `home-v4/page.jsx` - Fourth variation

Each has its own layout and section composition.

### Responsive Spacing

Uses a custom `Section` component for consistent spacing:

```jsx
<Section
  topMd={185}      // Top margin on medium screens
  topLg={140}      // Top margin on large screens
  topXl={100}      // Top margin on XL screens
  bottomMd={200}   // Bottom margin on medium screens
  bottomLg={150}   // Bottom margin on large screens
  bottomXl={110}   // Bottom margin on XL screens
>
  {/* Section content */}
</Section>
```

### Icons

Uses **Iconify React** for icons:

```jsx
import { Icon } from '@iconify/react';
<Icon icon="fa6-solid:calendar-days" />
```

## Planned Features

The following features are planned for implementation:

**Current Implementation Priorities**:
1. ✅ Department → Specialty → Doctor selection flow (multi-step form completed)
2. ✅ Doctor availability calendar (basic implementation done)
3. Payment integration (3rd step in booking)
4. Confirmation emails to doctor and patient
5. Authentication flow
6. User dashboard for scheduled appointments
7. Subscription flow

**Strategic Features** (from ClinicaMia requirements):
1. **Care Pathways (Rutas de Atención)** - Resolución 3280 compliant patient journey flows
2. **Medical-Scientific Section** - Content hub for patients and healthcare professionals
3. **Virtual Tour** - Interactive facility walkthrough (operating rooms, VIP areas, staff)
4. **VIP Hospitalization Showcase** - Premium patient room galleries and features
5. **Green Clinic Section** - Sustainability showcase (solar panels, eco-infrastructure)
6. **Pharmacy E-commerce** - Online catalog with COP pricing, ordering, and delivery
7. **Thyroid Center Content** - Dedicated section positioning as national reference
8. **Metabolic Diseases Hub** - Endocrinologist-validated educational content

## Integration with Backend

This frontend is part of the **ClinicaMia** project and will integrate with:
- **Backend**: `Backend_Hono_Clinica/` (Hono.js API with PostgreSQL)
- **Admin Dashboard**: `Front_Clinica_Mia/apps/isomorphic/` (Next.js 15 admin panel)

When implementing backend integration:
- Backend API runs on `http://localhost:3000` (may need to adjust ports)
- Use the API endpoints from backend for departments, doctors, appointments, etc.
- Follow the adapter pattern from the admin dashboard for API data transformation

## Customization Notes

This is based on the **ProHealth medical template**. When customizing:

1. **Branding**: Update logos in `public/images/` and `layout.js` metadata
2. **Content**: Replace placeholder data arrays in page components
3. **Styles**: Modify `src/app/sass/_custom.scss` for custom styling
4. **Images**: Replace images in `public/images/` directories
5. **Routes**: Add new pages following the `(defaultLayout)/` structure

## Development Guidelines

1. **Images**: Store in `public/images/` organized by section/page
2. **Components**: Add reusable components to `src/app/ui/`
3. **Pages**: Create new pages in `(defaultLayout)/` to get Header + Footer automatically
4. **Styling**: Use SCSS modules in `sass/` directory, avoid inline styles
5. **Icons**: Use Iconify React instead of icon fonts for better performance
6. **Data**: Define data arrays in page components, pass as props to section components

## Common Tasks

### Adding a New Page

```bash
# Create page directory
mkdir -p src/app/\(defaultLayout\)/new-page

# Create page component
# File: src/app/(defaultLayout)/new-page/page.jsx
```

```jsx
export default function NewPage() {
  return (
    <>
      {/* Page content with sections */}
    </>
  );
}
```

The page will automatically include Header and Footer from `(defaultLayout)/layout.jsx`.

### Adding a New Section Component

```bash
# Create component directory
mkdir -p src/app/ui/NewSection

# Create component file
# File: src/app/ui/NewSection/index.jsx
```

Follow existing section patterns - accept props for title, data, images, etc.

### Modifying Styles

Global/common styles:
- Edit `src/app/sass/_custom.scss`
- Or add to `src/app/sass/common/`

Component-specific styles:
- Add to `src/app/sass/shortcode/`
- Import in `src/app/sass/index.scss`

## Environment & Configuration

No environment variables are currently configured. When adding backend integration, you'll need:

```env
# Future environment variables
NEXT_PUBLIC_API_URL=http://localhost:3000
# Add other env vars as needed
```

## Form Development Pattern

When working with forms in this project:

1. **Use React Hook Form** for all form management (already installed)
2. **Multi-step forms** should follow the AppointmentForm pattern:
   - Main form component handles state and navigation
   - Separate components for each step
   - Validation per step with `trigger()` before advancing
   - Use `watch()` for dependent fields
3. **Validation**: Define validation rules in `register()` options
4. **Auto-save**: Consider localStorage for long forms (see AppointmentForm)
5. **Accessibility**: Include ARIA labels, error messages with icons, keyboard navigation

Example:
```jsx
const { register, handleSubmit, formState: { errors }, trigger } = useForm();

<input
  {...register('email', {
    required: 'Email es requerido',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Email inválido'
    }
  })}
/>
{errors.email && <span>{errors.email.message}</span>}
```

## Known Issues & Considerations

1. **Template Cleanup**: Many template variations exist (home-v2, v3, v4) - decide which to keep for ClinicaMia branding
2. **Mock Data**: Step 2 of appointment form uses mock data for departments/specialties/doctors - replace with real ClinicaMia API data
3. **Backend Integration**: Appointment form submission is simulated - needs real API endpoint with email notifications
4. **Content Translation**: Ongoing Spanish translation and ClinicaMia branding (home page in progress)
5. **Medical Content Validation**: All metabolic disease and hormone-related content requires endocrinologist approval before publishing
6. **Regulatory Compliance**: Care pathways must comply with Resolución 3280 Colombian healthcare standards
7. **Port Conflicts**: Both frontend and backend default to port 3000 - adjust one when running both
8. **TypeScript Migration**: Gradual migration in progress - new files should use TypeScript
9. **VIP Areas**: Content for VIP hospitalization areas pending construction completion
