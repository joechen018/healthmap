# 🏥 HealthMap: Mapping the U.S. Healthcare Ecosystem

**HealthMap** is an open-source tool to visualize the structure of the U.S. healthcare system — including payers, providers, vendors, and their complex web of relationships.

This project helps people explore:

- Who owns whom (e.g. UnitedHealth → Optum → Change)
- How companies are connected (partnerships, contracts, investments)
- Where the money flows (administrative vs clinical)
- How new entrants (e.g. Hinge Health, Availity) fit into the ecosystem

It’s like a **periodic table of healthcare companies** — with AI-backed auto-updates and real-time relationship mapping.

---

## 🧠 Key Features

- 🔍 **AI-generated healthcare knowledge graph**\
  Automatically parses news, Wikipedia, and Crunchbase to build structured JSONs of each company and its relationships.

- 🥸 **Interactive visualization**\
  Built using `React` + `D3` or `react-force-graph`, so you can click around the industry like a map.

- 🤖 **Auto-update pipeline**\
  Uses Claude or GPT-4 to pull fresh news and regenerate entity relationships.

- 🏗️ **Composable JSON schema**\
  Each company is defined in its own `.json` file, easy to modify or regenerate via LLMs.

---

## 📁 Project Structure

```
healthmap/
├── README.md
├── frontend/                 # React app to visualize the graph
│   ├── App.jsx
│   └── ...
├── backend/                  # Python backend to fetch/scrape/enrich
│   ├── scrape.py             # Pull data from Wikipedia/Crunchbase
│   ├── enrich.py             # Call LLMs to generate relationships
│   └── ...
├── data/
│   └── entities/
│       ├── optum.json
│       ├── unitedhealth.json
│       └── ...
├── prompts/                  # LLM prompt templates
└── tools/                    # Optional CLI tools for batch updates
```

---

## 🏁 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourname/healthmap.git
cd healthmap
```

### 2. Set Up Python Backend

```bash
cd backend
pip install -r requirements.txt
```

Set your Claude or OpenAI API key:

```bash
export CLAUDE_API_KEY=your_key
```

Run the enrichment script:

```bash
python enrich.py "Optum"
```

This will generate `data/entities/optum.json`.

### 3. Run the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## 🛠️ Contributing

You can help by:

- Adding new healthcare entities
- Improving scraping/LLM enrichment prompts
- Building out the visual layers
- Suggesting alternative views (donut, tree, sankey)

To generate a new company file:

```bash
python backend/enrich.py "Hinge Health"
```

---

## 💡 Examples

Example company data structure:

```json
{
  "name": "Optum",
  "type": "Vendor",
  "parent": "UnitedHealth Group",
  "revenue": "226B",
  "subsidiaries": ["Change Healthcare", "MedExpress"],
  "relationships": [
    {"target": "UnitedHealth Group", "type": "owned_by"},
    {"target": "Change Healthcare", "type": "owns"},
    {"target": "DispatchHealth", "type": "partner"}
  ]
}
```

---

## 🔮 Vision

Eventually, HealthMap will:

- Auto-track M&A and healthcare news
- Classify companies by admin vs clinical spend
- Let users generate custom landscape maps (e.g. MSK, behavioral)

---

## 🧱 Built With

- React + D3 / react-force-graph
- Python + BeautifulSoup + Requests
- Claude or GPT-4 for enrichment

---

## 📬 Contact

Built by Joe Chen\
DM or open an issue to suggest a new feature or company!