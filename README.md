# 🌾 KrishiLink — Smarter Markets, Better Returns

**Connecting farmers to better market opportunities through price intelligence and digital market linkages.**

KrishiLink is a farmer-focused market intelligence and transaction-enablement platform built for the **Smart India Hackathon (SIH)**. It aims to help farmers and Farmer Producer Organisations (FPOs) make informed selling decisions using market price information, buyer opportunities and estimated returns.

Instead of functioning as just another crop-listing marketplace, KrishiLink focuses on helping farmers understand **where to sell, when to sell, and which opportunity may offer better value.**

## 🚜 The Problem

Farmers can face challenges such as:

- Limited access to timely mandi price information.
- Difficulty comparing prices across markets.
- Limited visibility into potential buyers and market demand.
- Uncertainty when deciding where and when to sell their produce.
- Challenges tracking sales and related transactions.

## 💡 Our Solution

KrishiLink aims to bring market information and selling opportunities together in one platform, helping farmers make more informed decisions before selling their produce.

### ✨ Key Features

- **📊 Market Price Discovery** — Explore market prices and compare available selling options.
- **🌱 Farmer & Crop Management** — Organise farmer profiles and crop information.
- **🔎 Market Comparison** — Compare market opportunities to support better selling decisions.
- **🤝 Buyer & Market Linkages** — Support connections between farmers, FPOs and potential buyers.
- **💰 Sale Intent Tracking** — Lay the groundwork for tracking intended sales and transaction progress.
- **🧠 Smart Recommendations** — Develop data-driven recommendations to help identify promising market opportunities.
- **🔔 Price Alerts & Intelligence** — Support price monitoring and more informed selling decisions.

> **Project status:** Hackathon prototype in development. Features and integrations may vary in implementation and completeness.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, TypeScript, Express.js |
| Database | MySQL |
| ORM & Migrations | Prisma ORM |
| Frontend | React, TypeScript, Vite |
| Market Data | Government mandi-price data integration, with integration status subject to verification |

## 🏗️ Project Structure

```text
KrishiLink/
├── frontend/       # React + TypeScript frontend
├── prisma/         # Database schema and migrations
├── scripts/        # Project scripts
├── src/            # Backend application
├── .env.example    # Environment variable template
├── package.json    # Backend dependencies and scripts
└── tsconfig.json   # TypeScript configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- MySQL Server
- Git

### 1. Clone the repository

```bash
git clone https://github.com/supriya-p22/KrishiLink.git
cd KrishiLink
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference.

Configure your local MySQL connection and any API credentials required by the integrations you intend to use.

**Never commit your `.env` file or expose API keys.**

### 4. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

Ensure MySQL is running and the database connection is configured correctly before running migrations.

### 5. Start the backend

```bash
npm run dev
```

The backend is configured to run on port `3000` by default.

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Use the local URL printed by Vite in your terminal.

*Note: Setup commands may need adjustment if the project's scripts or configuration change.*

## 🔭 Future Scope

- Improve estimated net-realisation calculations by accounting for relevant selling and logistics costs.
- Incorporate buyer verification and demand insights.
- Refine recommendations using market trends and crop details.
- Expand logistics, storage and payment-tracking workflows.
- Strengthen testing, deployment and mobile accessibility.

## 🎯 Vision

**Better information. Smarter selling decisions. Stronger market linkages for farmers.**

KrishiLink aims to help farmers move beyond simply finding a buyer towards making informed, value-conscious selling decisions.

## 👥 Built For

Smart India Hackathon (SIH) — *Strengthening Market Linkages and Price Discovery for Farmers.*

---

*KrishiLink is a hackathon project under active development. It is not a substitute for verified market prices or professional financial advice.*
