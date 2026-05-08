# Professional AI Resume Builder

A premium, interactive dark-mode resume builder featuring real-time A4 sheet pagination, section layout management, dynamic grading calculations, and Gemini AI-powered resume reviews.

---

## Getting Started

### Prerequisites

Ensure you have **Node.js** (v18.x or v20.x+) installed.

We recommend using **pnpm** as the package manager, though **npm** or **yarn** will also work.

---

## Installation & Setup

1. **Clone & Navigate** to the project directory:
   ```bash
   cd "Professional ai resume builder"
   ```

2. **Configure Environment Variables**:
   Copy the example environment file and fill in your Gemini API keys:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and set the following parameters:
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Gemini API developer key.
   - `NEXT_PUBLIC_GEMINI_MODEL`: The model to use (defaults to `gemini-1.5-flash`).

3. **Install Dependencies**:
   ```bash
   pnpm install
   # or npm install
   ```

---

## Running the Application

### Development Server
Run the local development server:
```bash
pnpm dev
# or npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build
Generate a production optimized build:
```bash
pnpm build
pnpm start
# or npm run build && npm run start
```

---

## Project Structure & Architecture

For in-depth explanations of code architecture and setup details:
- See [doc/ARCHITECTURE.md](file:///d:/proj/Professsional%20ai%20resume%20builder/doc/ARCHITECTURE.md) for data flows, schemas, and pagination logic.
- See [doc/INTERVIEW_PREP.md](file:///d:/proj/Professsional%20ai%20resume%20builder/doc/INTERVIEW_PREP.md) for design decisions and interview question guides.
