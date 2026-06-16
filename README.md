# 🩸 BloodMatch — Emergency Blood Donation Matching System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14.x-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas_%2F_Memory-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Auth-JWT-FF6B6B?style=for-the-badge" alt="JWT Auth" />
  <img src="https://img.shields.io/badge/Track-Health_Logistics-red?style=for-the-badge" alt="Hackathon Track" />
</div>

<br />

<p align="center">
  <strong>Save Lives. Donate Blood.</strong> <br />
  Connecting blood donors with patients in urgent emergencies — fast, accurate, and free forever. <br />
  <em>Built for the CODECRAFT Hackathon (Health Logistics / Emergency Matching Track)</em>
</p>

---

## 📖 Executive Summary
In critical medical emergencies, finding exactly the right blood type within minutes can mean the difference between life and death. Traditional blood request workflows rely on chaotic WhatsApp groups, fragmented Facebook posts, or manual hospital call trees.

**BloodMatch** solves this logistics bottleneck by providing a highly structured, role-aware web application powered by an automated medical compatibility matching engine. It instantly bridges the gap between hospital recipients in need and nearby active, compatible blood donors.

---

## ✨ Key Features

### 🤝 1. Dual Role-Aware Ecosystem
- **Donors**: Manage their active availability in real time via a smart toggle. View nearby urgent emergency requests prioritized by critical medical needs. Track their donation history with the **Last Donation Date** feature.
- **Recipients / Hospital Staff**: Post urgent blood requirements in seconds and launch instant compatibility queries across local cities.

### 🤖 2. BloodBot: Intelligent AI Assistant
Integrated with **Google Gemini AI**, our custom chatbot doesn't just answer compatibility questions — it has functional access to the platform. It can search for donors, draft blood requests, and help donors toggle their status through natural language conversation.

### 🧪 3. Medical Compatibility Matching Engine
Built-in medical transfusion matching rules. The system doesn't just match exact blood types; it evaluates universal donor and recipient relationships (e.g., `O-` donors match with everyone; `A+` patients receive from `O-`, `O+`, `A-`, and `A+`).

### ⚡ 4. Sandbox-Ready Autonomous Execution
To ensure zero friction during hackathon evaluations and showcase previews, the backend dynamically checks for external `MONGODB_URI` environment variables. If none are provided (or if running in a sandboxed preview), it automatically routes all Mongoose models to an ultra-fast, completely faithful **In-Memory JS Database** pre-seeded with realistic sample donors and emergency requests.

### 🎨 5. Polished, Accessible Design System
- Built strictly on **Vanilla Tailwind CSS v3** and custom React components (No bulky UI component libraries).
- Employs strict color tokens (`red-600` brand primaries, `yellow-100` urgency badges, `green-500` status switches).
- Fully accessible with `<label>` bindings, custom focus rings, `aria-label` loaders, and `role="status"` notifications.
- **Optimized Performance**: All assets utilize **Next.js `<Image />`** for automatic optimization, resulting in superior LCP and reduced bandwidth.

---

## 🏗️ System Architecture & Workflow

```mermaid
graph TD
    A[Patient / Hospital Staff] -->|1. Posts Urgent Request| B(Next.js 14 API /api/requests)
    B -->|2. Validates Units & Urgency| C{MongoDB Atlas / Memory DB}
    C -->|3. Alerts Local Feeds| D[Open Blood Requests Feed]
    
    E[Blood Donor] -->|Toggles Availability Switch| F(Next.js 14 API /api/donors/availability)
    F --> C
    
    A -->|4. Searches Matches| G(Next.js 14 API /api/match)
    G -->|5. Executes Compatibility Engine| C
    C -->|6. Returns Active Compatible Donors| H[Verified Donor Contact Hub]
    H -->|Direct Phone Click| E
```

---

## 📂 Repository Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout with responsive Navbar & Footer
│   ├── page.tsx                  # High-impact Landing Page
│   ├── register/                 # Account registration wizard (Donor / Recipient)
│   ├── login/                    # Auth gateway with 1-Click Demo Accounts
│   ├── dashboard/                # Protected workspace (Guarded by client session guard)
│   │   ├── page.tsx              # Role-aware home (Donors view requests, Recipients view CTA)
│   │   ├── match/                # Smart donor search & compatibility filtering
│   │   ├── my-requests/          # Recipient's posted emergency list and status tracker
│   │   └── request/new/          # Urgent blood request creation suite
│   └── api/                      # Next.js 14 Serverless API Routes
│       ├── auth/                 # register/, login/, and change-password/ endpoints
│       ├── donors/               # GET donors list + PATCH availability/ status
│       ├── requests/             # GET requests feed + POST create request + PATCH [id]/cancel
│       ├── chat/                 # AI assistant and session history endpoints
│       ├── user/                 # profile/ (PATCH/DELETE) endpoint
│       └── match/                # Core compatibility matching endpoint
├── components/                   # Vanilla Reusable UI Components
│   ├── Navbar.tsx, Footer.tsx, AiChatBot.tsx
│   ├── BloodTypeBadge.tsx, UrgencyBadge.tsx
│   ├── DonorCard.tsx, RequestCard.tsx
│   ├── MatchSearchForm.tsx
│   └── LoadingSpinner.tsx, EmptyState.tsx
├── lib/                          # Application Logic & Drivers
│   ├── api.ts                    # Pre-configured Axios JWT interceptor instance
│   ├── auth.ts                   # Client-side localStorage auth session management
│   ├── compatibility.ts          # Medical blood transfusion compatibility mapping
│   ├── constants.ts              # Global arrays: BLOOD_TYPES, CITIES, URGENCY_LEVELS
│   ├── db/                       # Mongoose connection manager + Autonomous JS Memory Store
│   ├── middleware/               # Auth verification and Rate Limiter logic
│   └── models/                   # Mongoose schemas (User, BloodRequest, ChatHistory, etc.)
└── types/                        # Shared TypeScript interfaces (User, Donor, Request)
```

---

## 🚀 Getting Started & Testing Guide

### Running Locally
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/bloodmatch.git
   cd bloodmatch
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup** (Optional):
   The application runs flawlessly out of the box using its autonomous in-memory store. If you wish to connect a real MongoDB cluster, create an `.env.local` file:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bloodmatch
   JWT_SECRET=your_super_secret_jwt_key_32_characters
   ```
4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 🔑 Instant 1-Click Test Accounts
When evaluating the application at `/login`, you do not need to create new accounts. Click the quick-test buttons in the demo banner to instantly load verified accounts:

| Role | Name | Email | Password | Status |
|---|---|---|---|---|
| **Donor** | Aun Abbas | `aun@example.com` | `secret123` | `B+` (Active) |
| **Recipient** | Dr. Salman | `recipient@example.com` | `secret123` | `A+` (Aga Khan Hosp) |

---

## 🌐 API Reference Standard

All backend endpoints are securely protected, validate JSON inputs strictly before touching the database, and return standardized HTTP status codes.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new User account and password hash (`bcrypt`). |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns a 7-day signed `JWT`. |
| `PATCH`| `/api/auth/change-password` | Auth User | Securely updates the authenticated user's password. |
| `GET` | `/api/donors` | Public | Returns active donors, filtered by optional city or blood compatibility. |
| `PATCH` | `/api/donors/availability`| Donor Only | Toggles the authenticated donor's `isAvailable` active status. |
| `GET` | `/api/requests` | Public | Lists urgent open blood requests sorted by urgency and date. |
| `POST` | `/api/requests` | Auth User | Creates a new emergency blood request (`Normal`, `Urgent`, `Critical`). |
| `PATCH` | `/api/requests/[id]/cancel` | Owner Only | Cancels an open blood request owned by the authenticated user. |
| `PATCH`| `/api/user/profile` | Auth User | Updates user details (name, phone, city, last donation date). |
| `DELETE`| `/api/user/profile` | Auth User | Permanently deletes the authenticated user's account. |
| `GET` | `/api/match` | Public | Core endpoint: matches recipient blood types to compatible donors. |
| `POST` | `/api/chat` | Public+Auth | Interact with BloodBot (Gemini AI) with optional history saving. |

---

## 🏆 What Makes BloodMatch a Winner

1. **AI-Driven Intelligence**: Features **BloodBot**, a Gemini AI assistant that performs functional actions (like searching and drafting) to save time in high-stress emergencies.
2. **Medical Accuracy**: Transfusion logic is grounded in true hematological rules rather than basic database text matching.
3. **Optimized for Life**: High-performance execution using **Next.js 14 Image Optimization** and serverless architecture for sub-second triaging.
4. **Comprehensive Hub**: Includes advanced features like donation tracking, security management, and role-aware dashboards that go beyond a basic prototype.
5. **Resilient Hackathon Demo**: Equipped with advanced memory mocks and instant sample seeding so judges never experience an empty dashboard or broken database link.

<br />

<p align="center">
  Created with ❤️ for the <strong>CODECRAFT Hackathon</strong>. Every second counts in an emergency.
</p>
