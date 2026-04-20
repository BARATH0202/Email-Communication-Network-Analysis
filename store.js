// data/store.js  — in-memory database (no external DB required)
const { randomUUID: uuidv4 } = require('crypto');

const PEOPLE = [
  { id: 'p0',  name: 'Alice Chen',    dept: 'Executive',   role: 'CEO',          email: 'alice@acmecorp.com' },
  { id: 'p1',  name: 'Bob Patel',     dept: 'Engineering', role: 'CTO',          email: 'bob@acmecorp.com' },
  { id: 'p2',  name: 'Carol Smith',   dept: 'Marketing',   role: 'CMO',          email: 'carol@acmecorp.com' },
  { id: 'p3',  name: 'David Kim',     dept: 'Finance',     role: 'CFO',          email: 'david@acmecorp.com' },
  { id: 'p4',  name: 'Eva Müller',    dept: 'HR',          role: 'HR Director',  email: 'eva@acmecorp.com' },
  { id: 'p5',  name: 'Frank Zhou',    dept: 'Engineering', role: 'Lead Dev',     email: 'frank@acmecorp.com' },
  { id: 'p6',  name: 'Grace Lee',     dept: 'Engineering', role: 'Sr Dev',       email: 'grace@acmecorp.com' },
  { id: 'p7',  name: 'Henry Brown',   dept: 'Engineering', role: 'Developer',    email: 'henry@acmecorp.com' },
  { id: 'p8',  name: 'Isla White',    dept: 'Marketing',   role: 'Brand Mgr',   email: 'isla@acmecorp.com' },
  { id: 'p9',  name: 'Jake Tanaka',   dept: 'Marketing',   role: 'Content Lead', email: 'jake@acmecorp.com' },
  { id: 'p10', name: 'Kira Osei',     dept: 'Sales',       role: 'Sales Dir',    email: 'kira@acmecorp.com' },
  { id: 'p11', name: 'Leo Rossi',     dept: 'Sales',       role: 'Account Exec', email: 'leo@acmecorp.com' },
  { id: 'p12', name: 'Maya Singh',    dept: 'Finance',     role: 'Analyst',      email: 'maya@acmecorp.com' },
  { id: 'p13', name: 'Niko Wolf',     dept: 'HR',          role: 'Recruiter',    email: 'niko@acmecorp.com' },
  { id: 'p14', name: 'Olivia Park',   dept: 'Engineering', role: 'QA Lead',      email: 'olivia@acmecorp.com' },
  { id: 'p15', name: 'Paul Gomez',    dept: 'Sales',       role: 'Account Exec', email: 'paul@acmecorp.com' },
];

const idx = {}; PEOPLE.forEach(p => idx[p.id] = p);

const RAW_EDGES = [
  ['p0','p1',45],['p0','p2',38],['p0','p3',29],['p0','p4',22],['p0','p10',18],['p0','p11',12],
  ['p1','p5',52],['p1','p6',41],['p1','p7',33],['p1','p14',28],['p1','p3',15],
  ['p2','p8',44],['p2','p9',37],['p2','p10',25],['p2','p3',12],
  ['p3','p12',40],['p3','p1',14],['p3','p10',10],['p3','p4',9],
  ['p4','p13',35],['p4','p3',8],['p4','p11',7],
  ['p5','p6',30],['p5','p7',28],['p5','p14',20],['p5','p9',11],
  ['p6','p7',22],['p6','p14',18],['p6','p8',8],
  ['p7','p14',16],['p7','p6',10],
  ['p8','p9',25],['p8','p10',12],['p8','p6',7],
  ['p9','p2',12],['p9','p5',9],
  ['p10','p11',28],['p10','p15',22],['p10','p2',16],
  ['p11','p15',20],['p11','p4',8],['p11','p3',6],
  ['p12','p1',10],['p12','p13',8],
  ['p13','p12',9],['p13','p11',6],
  ['p14','p5',14],['p14','p6',12],
  ['p15','p11',14],['p15','p2',8],
];

// Build email records from edges
function buildEmails() {
  const SUBJECTS = [
    'Q3 performance review','Project sync request','Budget approval needed',
    'Feature roadmap update','Recruitment pipeline','Client proposal review',
    'Marketing campaign brief','Sales pipeline report','Engineering sprint review',
    'Compliance update','Partnership discussion','Team OKR alignment',
    'Product launch checklist','Quarterly board summary','Hiring decision',
    'Infrastructure upgrade plan','Customer escalation','Brand guidelines update',
  ];
  const BODIES = [
    'Please review the attached document and share your feedback at your earliest convenience.',
    'Following up on our last discussion — I wanted to get your input before we proceed.',
    'Sharing the updated report as discussed. Let me know if any changes are needed.',
    'A quick heads-up on the upcoming deadline. Please ensure your deliverables are submitted.',
    'Happy to discuss this further in a call if that would be helpful.',
  ];
  const CATS = ['Work','Work','Work','Marketing','Finance','HR','Support'];
  const SENTS = ['Positive','Positive','Neutral','Negative'];
  const STATS = ['Read','Replied','Unread','Archived'];
  const PRIS  = ['High','Medium','Medium','Low'];

  const emails = [];
  let idCounter = 1;
  RAW_EDGES.forEach(([from, to, vol]) => {
    for (let i = 0; i < Math.min(vol, 8); i++) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 90));
      emails.push({
        id: `e${idCounter++}`,
        from,
        to,
        subject: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
        body: BODIES[Math.floor(Math.random() * BODIES.length)],
        category: CATS[Math.floor(Math.random() * CATS.length)],
        sentiment: SENTS[Math.floor(Math.random() * SENTS.length)],
        priority: PRIS[Math.floor(Math.random() * PRIS.length)],
        status: STATS[Math.floor(Math.random() * STATS.length)],
        date: d.toISOString().slice(0,10),
        responseTimeHours: Math.random() > 0.3 ? Math.round(Math.random() * 48) : null,
        volume: vol,
      });
    }
  });
  return emails;
}

// ── STORE ──────────────────────────────────────────────────────────────────────
const store = {
  people:  [...PEOPLE],
  emails:  buildEmails(),
  edges:   RAW_EDGES.map(([a,b,w]) => ({ id: uuidv4(), from: a, to: b, weight: w })),
  idx,
};

// ── GRAPH ANALYTICS ─────────────────────────────────────────────────────────
function computeNeighbors(personId) {
  const ns = new Set();
  store.edges.forEach(e => {
    if (e.from === personId) ns.add(e.to);
    if (e.to   === personId) ns.add(e.from);
  });
  return ns;
}

function computeDegrees() {
  const deg = {};
  store.people.forEach(p => { deg[p.id] = 0; });
  store.edges.forEach(e => {
    deg[e.from] = (deg[e.from] || 0) + e.weight;
    deg[e.to]   = (deg[e.to]   || 0) + e.weight;
  });
  return deg;
}

function bfs(src, tgt, adjMap) {
  const vis = new Set([src]);
  const queue = [[src, [src]]];
  while (queue.length) {
    const [cur, path] = queue.shift();
    if (cur === tgt) return path;
    (adjMap[cur] || []).forEach(n => {
      if (!vis.has(n)) { vis.add(n); queue.push([n, [...path, n]]); }
    });
  }
  return null;
}

function computeBetweenness() {
  const adjMap = {};
  store.people.forEach(p => { adjMap[p.id] = []; });
  store.edges.forEach(e => {
    adjMap[e.from].push(e.to);
    adjMap[e.to].push(e.from);
  });
  const bet = {};
  store.people.forEach(p => { bet[p.id] = 0; });
  const ids = store.people.map(p => p.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const path = bfs(ids[i], ids[j], adjMap);
      if (!path) continue;
      path.slice(1, -1).forEach(mid => { bet[mid]++; });
    }
  }
  return bet;
}

function computeCloseness() {
  const adjMap = {};
  store.people.forEach(p => { adjMap[p.id] = []; });
  store.edges.forEach(e => {
    adjMap[e.from].push(e.to);
    adjMap[e.to].push(e.from);
  });
  const clo = {};
  store.people.forEach(p => {
    let total = 0, reached = 0;
    store.people.forEach(q => {
      if (q.id === p.id) return;
      const path = bfs(p.id, q.id, adjMap);
      if (path) { total += path.length - 1; reached++; }
    });
    clo[p.id] = reached > 0 ? reached / total : 0;
  });
  return clo;
}

function computePageRank(iters = 40, d = 0.85) {
  const n = store.people.length;
  let pr = {};
  store.people.forEach(p => { pr[p.id] = 1 / n; });
  const adjMap = {};
  store.people.forEach(p => { adjMap[p.id] = []; });
  store.edges.forEach(e => {
    adjMap[e.from].push(e.to);
    adjMap[e.to].push(e.from);
  });
  for (let iter = 0; iter < iters; iter++) {
    const nxt = {};
    store.people.forEach(p => { nxt[p.id] = (1 - d) / n; });
    store.people.forEach(p => {
      const ns = adjMap[p.id] || [];
      const od = ns.length || 1;
      ns.forEach(nb => { nxt[nb] += d * pr[p.id] / od; });
    });
    pr = nxt;
  }
  return pr;
}

function detectCommunities() {
  const map = {};
  store.people.forEach(p => { map[p.id] = p.dept; });
  return map;
}

store.computeAnalytics = () => {
  const degrees     = computeDegrees();
  const betweenness = computeBetweenness();
  const closeness   = computeCloseness();
  const pagerank    = computePageRank();
  const communities = detectCommunities();
  return { degrees, betweenness, closeness, pagerank, communities };
};

module.exports = store;
