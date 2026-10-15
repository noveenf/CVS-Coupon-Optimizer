# CVS Coupon Optimizer

A local-first web application that extracts promotions from screenshots of CVS weekly ads and builds a structured dataset for coupon stacking and ExtraBucks deal optimization.

> **Project status:** Screenshot ingestion and AI-assisted offer extraction are the initial MVP. Coupon verification, stacking, promotion deduplication, and multi-transaction optimization are planned features. Extracted offers should be reviewed before shopping.

## Features

- Upload multiple weekly-ad screenshots (PNG, JPEG, WebP).
- Extract advertised products, sale prices, coupons, and ExtraBucks rewards with a locally running vision model.
- Display extracted offers in the browser and export them as JSON.
- Record source image names for tracing results back to the ad.
- Keep screenshots and generated datasets local by default.

### Planned

- Review and correct extracted promotions in the UI.
- Deduplicate overlapping screenshots and group products sharing the same promotion.
- Apply CVS coupon eligibility, exclusions, limits, and spend thresholds.
- Rank deals by **cash due at checkout** and **effective cost after future ExtraBucks**.
- Optimize the order of multiple transactions to roll ExtraBucks.

## Architecture

```text
Browser (Next.js + TypeScript)
    │ POST /extract (multipart screenshots)
    ▼
FastAPI (Python)
    │
    ▼
Ollama + local vision model (Qwen2.5-VL)
    │
    ▼
Structured JSON dataset (backend/datasets/)
```

AI reads the ad; deterministic logic (planned) will calculate eligibility and deal prices. Personalized CVS coupons are not automatically available from weekly-ad screenshots.

## Prerequisites

- Node.js 20.9+ and npm
- Python 3.11+
- [Ollama](https://ollama.com/download) installed locally
- Enough RAM/disk space for a local vision model (the 7B model can be demanding)

Download the model used by `backend/extractor.py`:

```bash
ollama pull qwen2.5vl:7b
ollama list
```

> If you use a different model, change the `model=` value in `backend/extractor.py`. Ollama must be running. On macOS the Ollama app may already run a server; otherwise use `ollama serve`.

## Getting started

Run all commands from the project root unless noted.

### 1. Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install fastapi 'uvicorn[standard]' python-multipart ollama pydantic python-dotenv
python -m uvicorn main:app --reload --port 8000
```

If you prefer Conda, activate a Python 3.11 Conda environment instead of creating `.venv`.

- Health endpoint: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000. Select your weekly-ad screenshots, click **Extract Offers**, and inspect/download the resulting JSON.

### 3. Data output

Successful extraction requests create JSON files under `backend/datasets/`. These files are excluded from Git because they can contain personal or locally generated data.

## Formatting and linting

**Prettier** formats frontend TypeScript, React, JSON, CSS, and Markdown. **Ruff** formats and lints Python; Prettier itself does not support Python.

Install frontend dev dependencies:

```bash
cd frontend
npm install --save-dev prettier prettier-plugin-tailwindcss
npx prettier --write .
npx prettier --check .
```

For a convenient npm command, add these scripts to the existing `frontend/package.json` `scripts` object (don't remove existing scripts):

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

Install Ruff into the backend Python environment:

```bash
python -m pip install ruff
```

From the repository root:

```bash
ruff format backend
ruff check backend
```

Install **Prettier – Code formatter** (`esbenp.prettier-vscode`) and **Ruff** (`charliermarsh.ruff`) in VS Code. The included `.vscode/settings.json` enables format-on-save for supported frontend and Python files.

## Project structure

```text
CouponOptimizer/
├── .gitignore
├── .vscode/settings.json
├── frontend/
│   ├── .prettierrc.json
│   ├── .prettierignore
│   ├── src/app/page.tsx
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── main.py
│   ├── extractor.py
│   ├── pyproject.toml
│   └── datasets/           # Local output; gitignored
└── README.md
```

## Limitations

- A vision model can misread dense ads and fine print. Verify coupon conditions, participating items, limits, and expiration dates before relying on results.
- Similar or overlapping screenshots may yield duplicate offers until deduplication is implemented.
- A weekly ad may mention coupons you do not personally have or that require activation.
- ExtraBucks earned from a purchase are future rewards, **not** immediate checkout discounts. Taxes, reward restrictions, expiration and coupon applicability matter.
- The app does not log in to CVS or scrape CVS.com. Respect applicable terms and permissions when sourcing advertisements.

## Troubleshooting

**`npx: command not found`:** Install Node.js (which includes npm/npx); Python's `pip install npx` is unrelated.

**Python error on `float | None`:** Use Python 3.10+ (3.11 recommended).

**`Connection refused` to Ollama:** Launch the Ollama app or run `ollama serve`; verify with `curl http://localhost:11434/api/tags`.

**JSON EOF / validation error:** The vision model may have truncated output. Increase the model's output-token limit or extract smaller, overlapping crops. Review the FastAPI traceback and Ollama stop reason.

**Upload fails:** Check the browser developer console and backend logs. Ensure FastAPI runs on port 8000 and Next.js on 3000.

## License

Personal project; no license specified. CVS and ExtraBucks are trademarks of their respective owners. This project is independent and not affiliated with CVS.
