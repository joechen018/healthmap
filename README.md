# 🏥 HealthMap: Mapping the U.S. Healthcare Ecosystem

**HealthMap** is an open-source tool to visualize the structure of the U.S. healthcare system — including payers, providers, vendors, and their complex web of relationships.

This project helps people explore:

- Who owns whom (e.g. UnitedHealth → Optum → Change)
- How companies are connected (partnerships, contracts, investments)
- Where the money flows (administrative vs clinical)
- How new entrants fit into the healthcare ecosystem

It's like a **periodic table of healthcare companies** — with AI-backed auto-updates and real-time relationship mapping.

---

## 🧠 Key Features

- 🔍 **AI-generated healthcare knowledge graph**  
  Automatically parses Wikipedia and news sources to build structured JSONs of each company and its relationships.

- 🥸 **Interactive visualization**  
  Built using React + react-force-graph, so you can click around the industry like a map.

- 🤖 **Claude-powered enrichment**  
  Uses Anthropic's Claude to analyze and infer relationships between healthcare entities.

- 🏗️ **Composable JSON schema**  
  Each company is defined in its own `.json` file, easy to modify or regenerate via LLMs.

---

## 📁 Project Structure

```
healthmap/
├── README.md
├── frontend/                 # React app to visualize the graph
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # CSS styles
│   │   ├── App.jsx           # Main application component
│   │   └── index.jsx         # Entry point
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
├── backend/                  # Python backend to fetch/scrape/enrich
│   ├── scraper/              # Data scraping modules
│   │   ├── wikipedia.py      # Wikipedia scraper
│   │   └── news.py           # News scraper
│   ├── enrichment/           # LLM enrichment modules
│   │   ├── claude.py         # Claude API integration
│   │   └── openai.py         # OpenAI API integration (fallback)
│   ├── utils/                # Utility functions
│   │   └── json_utils.py     # JSON handling utilities
│   ├── main.py               # Main entry point
│   └── requirements.txt      # Python dependencies
├── data/
│   └── entities/             # Entity JSON files
│       ├── unitedhealthcare.json
│       ├── elevance_health.json
│       └── kaiser_permanente.json
├── prompts/                  # LLM prompt templates
│   ├── entity_extraction.txt
│   └── relationship_inference.txt
└── tools/                    # CLI tools for batch updates
    ├── batch_update.py
    └── add_entity.py
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

Set your Claude API key:

```bash
# On macOS/Linux
export CLAUDE_API_KEY=your_key

# On Windows
set CLAUDE_API_KEY=your_key
```

### 3. Process Healthcare Entities

Process a single entity:

```bash
python main.py "UnitedHealth Group"
```

This will generate `data/entities/unitedhealth_group.json`.

List all processed entities:

```bash
python main.py --list
```

Process multiple entities in batch:

```bash
python ../tools/batch_update.py -e "UnitedHealth Group" "Elevance Health" "Kaiser Permanente"
```

### 4. Run the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## 🛠️ Contributing

You can help by:

- Adding new healthcare entities
- Improving scraping/LLM enrichment prompts
- Building out the visual layers
- Suggesting alternative views (donut, tree, sankey)

To generate a new company file:

```bash
python backend/main.py "Hinge Health"
```

---

## 💡 Entity Data Structure

Each healthcare entity is represented as a JSON file with the following structure:

```json
{
  "name": "UnitedHealthcare",
  "type": "Payer",
  "parent": "UnitedHealth Group",
  "revenue": "240B",
  "subsidiaries": [
    "UnitedHealthcare Community & State",
    "UnitedHealthcare Medicare & Retirement"
  ],
  "relationships": [
    {"target": "UnitedHealth Group", "type": "owned_by"},
    {"target": "Optum", "type": "partner"},
    {"target": "Elevance Health", "type": "competitor"}
  ]
}
```

Entity types include:
- **Payer**: Insurance companies
- **Provider**: Healthcare providers
- **Vendor**: Healthcare vendors
- **Integrated**: Integrated health systems

Relationship types include:
- **owned_by**: Entity is owned by the target
- **owns**: Entity owns the target
- **partner**: Entity has a partnership with the target
- **competitor**: Entity competes with the target
- **customer**: Entity is a customer of the target
- **vendor**: Entity is a vendor to the target

---

## 🔮 Future Enhancements

- Auto-track M&A and healthcare news
- Classify companies by admin vs clinical spend
- Let users generate custom landscape maps (e.g. MSK, behavioral)
- Add financial flow visualization
- Implement search and filtering capabilities
- Add user accounts and saved views

---

## 🧱 Built With

- **Frontend**: React, react-force-graph, Vite
- **Backend**: Python, BeautifulSoup, Requests
- **AI**: Anthropic Claude API (with OpenAI fallback)

---

## 📬 Contact

Built by Joe Chen  
Open an issue to suggest a new feature or company!
