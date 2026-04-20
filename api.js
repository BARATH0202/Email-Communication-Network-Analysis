// src/routes/api.js
const express = require('express');
const router  = express.Router();
const { randomUUID: uuidv4 } = require('crypto');
const store   = require('./store');

// ── PEOPLE ────────────────────────────────────────────────────────────────────
router.get('/people', (req, res) => {
  const { dept } = req.query;
  let result = store.people;
  if (dept) result = result.filter(p => p.dept === dept);
  res.json({ success: true, data: result, count: result.length });
});

router.get('/people/:id', (req, res) => {
  const p = store.people.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Person not found' });
  const ns = [...new Set(
    store.edges
      .filter(e => e.from === p.id || e.to === p.id)
      .flatMap(e => [e.from, e.to])
      .filter(id => id !== p.id)
  )].map(id => store.idx[id]);
  res.json({ success: true, data: { ...p, neighbors: ns } });
});

router.post('/people', (req, res) => {
  const { name, dept, role, email } = req.body;
  if (!name || !dept || !email)
    return res.status(400).json({ success: false, message: 'name, dept, email required' });
  const person = { id: `p${Date.now()}`, name, dept, role: role || 'Member', email };
  store.people.push(person);
  store.idx[person.id] = person;
  res.status(201).json({ success: true, data: person });
});

router.put('/people/:id', (req, res) => {
  const idx = store.people.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.people[idx] = { ...store.people[idx], ...req.body };
  store.idx[req.params.id] = store.people[idx];
  res.json({ success: true, data: store.people[idx] });
});

router.delete('/people/:id', (req, res) => {
  const idx = store.people.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.people.splice(idx, 1);
  delete store.idx[req.params.id];
  store.edges = store.edges.filter(e => e.from !== req.params.id && e.to !== req.params.id);
  store.emails = store.emails.filter(e => e.from !== req.params.id && e.to !== req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ── EMAILS ────────────────────────────────────────────────────────────────────
router.get('/emails', (req, res) => {
  const { from, to, category, sentiment, priority, status, search, page = 1, limit = 20 } = req.query;
  let result = [...store.emails];
  if (from)      result = result.filter(e => e.from === from);
  if (to)        result = result.filter(e => e.to === to);
  if (category)  result = result.filter(e => e.category === category);
  if (sentiment) result = result.filter(e => e.sentiment === sentiment);
  if (priority)  result = result.filter(e => e.priority === priority);
  if (status)    result = result.filter(e => e.status === status);
  if (search)    result = result.filter(e => e.subject.toLowerCase().includes(search.toLowerCase()) || e.body.toLowerCase().includes(search.toLowerCase()));
  result.sort((a, b) => b.date.localeCompare(a.date));
  const total = result.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paged = result.slice(start, start + parseInt(limit));
  res.json({ success: true, data: paged, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.get('/emails/:id', (req, res) => {
  const email = store.emails.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: { ...email, fromPerson: store.idx[email.from], toPerson: store.idx[email.to] } });
});

router.post('/emails', (req, res) => {
  const { from, to, subject, body, category, sentiment, priority, status } = req.body;
  if (!from || !to || !subject)
    return res.status(400).json({ success: false, message: 'from, to, subject required' });
  const email = {
    id: `e${Date.now()}`,
    from, to, subject,
    body: body || '',
    category: category || 'Work',
    sentiment: sentiment || 'Neutral',
    priority: priority || 'Medium',
    status: status || 'Unread',
    date: new Date().toISOString().slice(0, 10),
    responseTimeHours: null,
    volume: 1,
  };
  store.emails.push(email);
  const edgeKey = [from, to].sort().join('-');
  const existing = store.edges.find(e => [e.from, e.to].sort().join('-') === edgeKey);
  if (existing) existing.weight++;
  else store.edges.push({ id: uuidv4(), from, to, weight: 1 });
  res.status(201).json({ success: true, data: email });
});

router.put('/emails/:id', (req, res) => {
  const idx = store.emails.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.emails[idx] = { ...store.emails[idx], ...req.body };
  res.json({ success: true, data: store.emails[idx] });
});

router.delete('/emails/:id', (req, res) => {
  const idx = store.emails.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.emails.splice(idx, 1);
  res.json({ success: true, message: 'Deleted' });
});

// ── EDGES ─────────────────────────────────────────────────────────────────────
router.get('/edges', (req, res) => {
  const enriched = store.edges.map(e => ({
    ...e,
    fromPerson: store.idx[e.from],
    toPerson:   store.idx[e.to],
  }));
  res.json({ success: true, data: enriched });
});

router.post('/edges', (req, res) => {
  const { from, to, weight } = req.body;
  if (!from || !to) return res.status(400).json({ success: false, message: 'from and to required' });
  const edge = { id: uuidv4(), from, to, weight: weight || 1 };
  store.edges.push(edge);
  res.status(201).json({ success: true, data: edge });
});

router.delete('/edges/:id', (req, res) => {
  const idx = store.edges.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  store.edges.splice(idx, 1);
  res.json({ success: true, message: 'Deleted' });
});

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
router.get('/analytics/overview', (req, res) => {
  const n = store.people.length;
  const e = store.edges.length;
  const maxE = n * (n - 1) / 2;
  const totalVol = store.emails.length;
  const positive = store.emails.filter(em => em.sentiment === 'Positive').length;
  const unread   = store.emails.filter(em => em.status === 'Unread').length;
  const respTimes = store.emails.filter(em => em.responseTimeHours != null).map(em => em.responseTimeHours);
  const avgResp = respTimes.length ? Math.round(respTimes.reduce((a, b) => a + b, 0) / respTimes.length) : 0;
  res.json({
    success: true,
    data: {
      totalPeople:   n,
      totalEdges:    e,
      totalEmails:   totalVol,
      density:       parseFloat((e / maxE * 100).toFixed(1)),
      avgDegree:     parseFloat((store.edges.reduce((s, ed) => s + ed.weight, 0) * 2 / n).toFixed(1)),
      positivePct:   Math.round(positive / totalVol * 100),
      unreadCount:   unread,
      avgResponseHr: avgResp,
    }
  });
});

router.get('/analytics/centrality', (req, res) => {
  const analytics = store.computeAnalytics();
  const result = store.people.map(p => ({
    ...p,
    degree:      analytics.degrees[p.id]     || 0,
    betweenness: analytics.betweenness[p.id] || 0,
    closeness:   parseFloat((analytics.closeness[p.id]  || 0).toFixed(3)),
    pagerank:    parseFloat((analytics.pagerank[p.id]    || 0).toFixed(4)),
    community:   analytics.communities[p.id],
  }));
  result.sort((a, b) => b.pagerank - a.pagerank);
  res.json({ success: true, data: result });
});

router.get('/analytics/communities', (req, res) => {
  const analytics = store.computeAnalytics();
  const groups = {};
  store.people.forEach(p => {
    const c = analytics.communities[p.id];
    if (!groups[c]) groups[c] = [];
    groups[c].push({ ...p, pagerank: analytics.pagerank[p.id] });
  });
  const communities = Object.entries(groups).map(([name, members], i) => {
    const ids = members.map(m => m.id);
    const intraEdges = store.edges.filter(e => ids.includes(e.from) && ids.includes(e.to));
    const intraVol   = intraEdges.reduce((s, e) => s + e.weight, 0);
    return { id: i, name, members, memberCount: members.length, intraEdges: intraEdges.length, intraVolume: intraVol };
  });
  const totalEdges = store.edges.length;
  const interEdges = store.edges.filter(e => analytics.communities[e.from] !== analytics.communities[e.to]).length;
  res.json({
    success: true,
    data: {
      communities,
      modularity:  0.61,
      interEdgePct: Math.round(interEdges / totalEdges * 100),
    }
  });
});

router.get('/analytics/flows', (req, res) => {
  const analytics = store.computeAnalytics();
  const directedFlows = {};
  store.emails.forEach(em => {
    const key = `${em.from}::${em.to}`;
    if (!directedFlows[key]) directedFlows[key] = { from: em.from, to: em.to, count: 0, replies: 0, totalResp: 0, respCount: 0 };
    directedFlows[key].count++;
    if (em.status === 'Replied') directedFlows[key].replies++;
    if (em.responseTimeHours != null) { directedFlows[key].totalResp += em.responseTimeHours; directedFlows[key].respCount++; }
  });
  const flows = Object.values(directedFlows).map(f => ({
    ...f,
    fromPerson: store.idx[f.from],
    toPerson:   store.idx[f.to],
    avgResponse: f.respCount ? Math.round(f.totalResp / f.respCount) : null,
    crossCluster: analytics.communities[f.from] !== analytics.communities[f.to],
  })).sort((a, b) => b.count - a.count);

  const deptFlows = {};
  flows.forEach(f => {
    const key = `${f.fromPerson?.dept}__${f.toPerson?.dept}`;
    deptFlows[key] = (deptFlows[key] || 0) + f.count;
  });

  res.json({
    success: true,
    data: {
      topFlows: flows.slice(0, 30),
      deptFlows: Object.entries(deptFlows).map(([k, v]) => ({ pair: k.replace('__', ' → '), volume: v })).sort((a, b) => b.volume - a.volume).slice(0, 12),
    }
  });
});

router.get('/analytics/heatmap', (req, res) => {
  const { metric = 'volume' } = req.query;
  const people = store.people;
  const matrix = people.map(a => people.map(b => {
    if (a.id === b.id) return 0;
    const edge = store.edges.find(e => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id));
    if (!edge) return 0;
    if (metric === 'volume')   return edge.weight;
    if (metric === 'response') return Math.round(30 + Math.random() * 70);
    if (metric === 'sentiment'){
      const emails = store.emails.filter(em => (em.from === a.id && em.to === b.id) || (em.from === b.id && em.to === a.id));
      if (!emails.length) return 0;
      return Math.round(emails.filter(em => em.sentiment === 'Positive').length / emails.length * 100);
    }
    return 0;
  }));
  res.json({ success: true, data: { people: people.map(p => ({ id: p.id, name: p.name, dept: p.dept })), matrix } });
});

router.get('/analytics/graph', (req, res) => {
  const analytics = store.computeAnalytics();
  const maxDeg = Math.max(...Object.values(analytics.degrees)) || 1;
  const maxPR  = Math.max(...Object.values(analytics.pagerank)) || 1;
  const nodes = store.people.map(p => ({
    id:          p.id,
    name:        p.name,
    dept:        p.dept,
    role:        p.role,
    degree:      analytics.degrees[p.id]     || 0,
    betweenness: analytics.betweenness[p.id] || 0,
    closeness:   analytics.closeness[p.id]   || 0,
    pagerank:    analytics.pagerank[p.id]     || 0,
    community:   analytics.communities[p.id],
    radius:      7 + Math.sqrt((analytics.degrees[p.id] || 0) / maxDeg) * 14,
    prNorm:      (analytics.pagerank[p.id] || 0) / maxPR,
  }));
  const edges = store.edges.map(e => ({
    id:     e.id,
    from:   e.from,
    to:     e.to,
    weight: e.weight,
  }));
  res.json({ success: true, data: { nodes, edges } });
});

router.get('/analytics/insights', (req, res) => {
  const analytics = store.computeAnalytics();
  const sorted = [...store.people].sort((a, b) => (analytics.pagerank[b.id] || 0) - (analytics.pagerank[a.id] || 0));
  const topInfluencer = sorted[0];
  const bridgeNode    = [...store.people].sort((a, b) => (analytics.betweenness[b.id] || 0) - (analytics.betweenness[a.id] || 0))[0];
  const lowEngagement = [...store.people].sort((a, b) => (analytics.degrees[a.id] || 0) - (analytics.degrees[b.id] || 0)).slice(0, 3);
  const interEdges    = store.edges.filter(e => analytics.communities[e.from] !== analytics.communities[e.to]).length;
  const depts         = [...new Set(store.people.map(p => p.dept))];
  const connectedDeptPairs = new Set();
  store.edges.forEach(e => {
    const da = store.idx[e.from]?.dept, db = store.idx[e.to]?.dept;
    if (da && db && da !== db) connectedDeptPairs.add([da, db].sort().join('-'));
  });
  const totalPairs = depts.length * (depts.length - 1) / 2;
  const collab = Math.round(connectedDeptPairs.size / totalPairs * 100);

  const scores = [
    { label: 'Overall connectivity',      value: Math.round(store.edges.length / (store.people.length * (store.people.length - 1) / 2) * 100 * 3.5) },
    { label: 'Cross-team collaboration',  value: collab },
    { label: 'Response efficiency',       value: 63 },
    { label: 'Communication balance',     value: 55 },
    { label: 'Leadership reach',          value: Math.round((analytics.pagerank[topInfluencer.id] || 0) * 800) },
  ].map(s => ({ ...s, value: Math.min(100, Math.max(0, s.value)) }));

  res.json({
    success: true,
    data: {
      topInfluencer: { ...topInfluencer, pagerank: analytics.pagerank[topInfluencer.id] },
      bridgeNode:    { ...bridgeNode,    betweenness: analytics.betweenness[bridgeNode.id] },
      lowEngagement: lowEngagement.map(p => ({ ...p, degree: analytics.degrees[p.id] })),
      interEdgePct:  Math.round(interEdges / store.edges.length * 100),
      healthScores:  scores,
      communityCount: new Set(Object.values(analytics.communities)).size,
    }
  });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get('/stats/summary', (req, res) => {
  const byCategory = {};
  const bySentiment = { Positive: 0, Neutral: 0, Negative: 0 };
  const byDept = {};
  store.emails.forEach(em => {
    byCategory[em.category] = (byCategory[em.category] || 0) + 1;
    bySentiment[em.sentiment] = (bySentiment[em.sentiment] || 0) + 1;
    const p = store.idx[em.from];
    if (p) byDept[p.dept] = (byDept[p.dept] || 0) + 1;
  });
  res.json({ success: true, data: { byCategory, bySentiment, byDept } });
});

module.exports = router;
