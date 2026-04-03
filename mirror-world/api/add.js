export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action } = req.body;
  const actionMap = {
    dog: { emoji: '🐕', name: '柯基小狗' },
    fitness: { emoji: '💪', name: '哑铃' },
    tv: { emoji: '📀', name: '觉醒年代DVD' },
    mask: { emoji: '💚', name: 'V脸面膜' },
    game: { emoji: '🎮', name: '游戏手柄' }
  };
  const item = actionMap[action];
  if (!item) return res.status(400).json({ error: 'Invalid action' });
  
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!githubToken || !owner || !repo) return res.status(500).json({ error: 'GitHub config missing' });
  
  const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/items.json`;
  let currentItems = [];
  let sha = null;
  try {
    const getRes = await fetch(getFileUrl, { headers: { Authorization: `Bearer ${githubToken}` } });
    if (getRes.ok) {
      const data = await getRes.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      currentItems = JSON.parse(content);
      sha = data.sha;
    }
  } catch(e) {}
  
  currentItems.push({ emoji: item.emoji, name: item.name, timestamp: Date.now() });
  const updateRes = await fetch(getFileUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Add ${item.name}`, content: Buffer.from(JSON.stringify(currentItems, null, 2)).toString('base64'), sha })
  });
  if (!updateRes.ok) return res.status(500).json({ error: 'Update failed' });
  res.json({ success: true, items: currentItems });
}