# Alumlo

Search and analytics for understanding where a school's graduates or a company's former employees went next.

[Live demo](https://alumlo.vercel.app)

## Why I built it

I built Alumlo to help schools and employers understand their alumni's career outcomes. The idea was to use those outcomes to inform marketing and find people worth reaching out to for 'success stories.' Public LinkedIn profiles contained much of the information, but answering a question meant looking through individual careers and keeping track of the connections yourself.

Alumlo puts those records in one place and lets someone search them in plain English. It also shows aggregate information, like where alumni work, which roles they hold, and how long they stayed at an organization.

## Where the project ended up

I worked on the original application from January through July 2025. It led to sales conversations with Chick-fil-A, KIPP National Charter Schools, and universities, but no signed contracts. I learned a lot about outreach and sales, especially how difficult it is to turn interest in a product into someone actually paying for it.

Ultimately, I stopped working on Alumlo because I wanted to focus more on building and started my job at Peak as a Software Engineer.

I still think alumni outcomes have merit as a business. I was able to get large organizations to demo Alumlo on my own, which suggests the problem was worth their attention. That interest didn't turn into a sale, but I think a larger team and better search could make the idea worth pursuing again.

I returned to the code in September 2026 to get the demo running again and clean up the repository. The original database was gone, so I rebuilt storage around Postgres and pgvector. The demo now uses 500 profiles with generated names and no profile URLs or photos. The full LinkedIn-derived dataset is not included in this repository.

## How it works

The frontend uses Next.js, React, and Tailwind. Python scripts prepare the profile data, and Postgres stores the records and their embeddings.

Search starts by classifying a question as a standard, chronological, or temporal query. The pipeline standardizes terms and asks a model to extract structured filters. For example, a query about people who worked at Google before joining the organization can produce a `pre_company_company_filter`.

Those filters go to the [`search_profiles` SQL function](db/migrations/005_search.sql). The model produces JSON, and the application supplies it as a query parameter. Matching profiles are ordered by embedding similarity when embeddings are available.

The original chronological search path used a fine-tuned model. The [297 training examples](models/training.jsonl) and [40 evaluation examples](models/alumni_eval_tricky_40.jsonl) are still here. The restored version defaults to prompt-based translation through OpenRouter, with an optional replacement fine-tune configured in [models.ts](web/app/config/models.ts).

The Learn page works differently. SQL computes the alumni statistics first, then a model uses those numbers to answer the question. The charts use the same aggregate data.

## What the demo includes

- Search by career and education history, expand a search, and export results as CSV.
- Ask questions about aggregate alumni outcomes in Learn, or view the charts in Visualize.
- Check the structure of a profile JSON file in Enrich Data. This runs in the browser; importing records is a separate command-line step.
- View the current organization and clear browser history in Settings.

There are no user accounts in the demo. Recent searches and chats are stored in the browser. Salary, seniority, and other enrichment fields are unpopulated, so the analytics pages show those gaps. The search result cards' Match Highlights section still uses a fallback message; connecting it to the extracted filters is unfinished.

## Run locally

You need Node.js with npm, Python 3.10 or later, Docker Compose, and an OpenRouter API key for the model calls. Run these commands from the repository root.

Create a `.env` file with these two entries, replacing the API key:

```dotenv
DATABASE_URL=postgresql://alumlo:alumlo@localhost:54322/alumlo
OPENROUTER_API_KEY=your-key
```

Optional model overrides are listed in [.env.example](.env.example). Omit overrides you aren't using.

Start the database and load the sample:

```sh
docker compose up -d --wait db
python3 -m venv .venv
source .venv/bin/activate
python -m pip install psycopg2-binary

mkdir -p data/profiles
cp data/sample/profiles.json data/profiles/sample.json
python ingest/seed.py --tenant demo --name "Chick-fil-A"
python ingest/embed.py --tenant demo
```

Docker applies the schema when it first creates the database. The seed command uses the local database address above. Embedding reads the API key from `.env` and makes calls through OpenRouter.

Start the app:

```sh
cd web
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). To check the production build, run `npm run build` from `web/`.

See [deployment notes](docs/deploying.md) for hosting the app and using a managed database.

## What I'd change

The original schema put each customer's name in table and function names. That meant adding a customer also meant changing the database schema. The restored version uses a shared schema with a tenant ID, which makes more sense for the same data belonging to different organizations.

The search pipeline is still a large route file. I would split classification, filter extraction, and expansion into separate modules so each step can be checked on its own. I would also run the saved evaluation queries before claiming that one model or prompt performs better than another. The training data shows what I asked the model to learn; it does not establish how well it learned it.
