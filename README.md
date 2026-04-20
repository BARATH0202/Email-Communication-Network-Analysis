# Email Communication Network Analytics

A full-stack web application for analysing organisational email communication patterns.
Includes interactive network graph, centrality metrics, community detection, heatmap, and full CRUD.

## Tech stack
- **Backend**: Node.js + Express (REST API, in-memory store)
- **Frontend**: Vanilla HTML/CSS/JS + Chart.js (single-page app)
- **No database required** — data is seeded in memory on startup

---

## Quick start (3 steps)

### 1. Install Node.js
Download from https://nodejs.org (v18 or later recommended)

### 2. Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### 3. Start the server
```
npm start
```

Then open your browser at:
```
http://localhost:3000
```

---

## Development mode (auto-restart on file changes)
```
npm run dev
```

---

## Project structure
```
email-network-app/
├── server.js              ← Express server entry point
├── package.json
├── data/
│   └── store.js           ← In-memory data + graph analytics
├── src/
│   └── routes/
│       └── api.js         ← All REST API endpoints
└── public/
    └── index.html         ← Complete single-page frontend
```

---

## API Endpoints

### People
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/people | List all people (filter: ?dept=) |
| GET    | /api/people/:id | Get person + neighbors |
| POST   | /api/people | Create person |
| PUT    | /api/people/:id | Update person |
| DELETE | /api/people/:id | Delete person + their edges/emails |

### Emails
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/emails | List emails (filter: sentiment, priority, status, search, page, limit) |
| GET    | /api/emails/:id | Get single email with sender/recipient info |
| POST   | /api/emails | Create email (also updates edge weight) |
| PUT    | /api/emails/:id | Update email |
| DELETE | /api/emails/:id | Delete email |

### Edges (network connections)
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/edges | List all edges with person details |
| POST   | /api/edges | Create edge |
| DELETE | /api/edges/:id | Delete edge |

### Analytics
| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/analytics/overview | KPI summary |
| GET    | /api/analytics/centrality | Degree, betweenness, closeness, PageRank per person |
| GET    | /api/analytics/communities | Community detection + modularity |
| GET    | /api/analytics/flows | Directed email flows + dept flows |
| GET    | /api/analytics/heatmap?metric=volume | N×N matrix (volume/response/sentiment) |
| GET    | /api/analytics/graph | Full graph data for visualisation |
| GET    | /api/analytics/insights | Synthesised organisational findings |
| GET    | /api/stats/summary | Category/sentiment/dept breakdown |

---

## App modules

| Module | Description |
|--------|-------------|
| Dashboard | KPI cards + 4 Chart.js charts |
| Network graph | Interactive force-directed canvas graph — drag, pan, zoom, click |
| Centrality | Degree · Betweenness · Closeness · PageRank bars + table |
| Communities | Cluster detection with modularity score |
| Email flows | Directed flow bars + dept-level flows + full table |
| Heatmap | N×N communication matrix |
| Insights | Health scores + bottlenecks + findings |
| Emails CRUD | Full create/read/update/delete with search + filters |
| People CRUD | Manage organisational members |
| Edges CRUD | Manage network connections |

---

## Customisation
- Edit `data/store.js` to change the seeded people and edges
- Add a real database (MongoDB, SQLite, PostgreSQL) by replacing the in-memory store
- Change the port: set the `PORT` environment variable before starting
