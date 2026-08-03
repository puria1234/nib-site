// Vercel serverless function: GET /api/downloads
//
// Read-only endpoint the frontend polls to display "N+ downloads". Reads
// downloads.json straight from the repo's raw content, so it needs no token
// and never increments anything itself.

const GITHUB_OWNER = 'puria1234';
const GITHUB_REPO = 'nib-site';
const COUNTER_PATH = 'downloads.json';

module.exports = async (req, res) => {
    try {
          const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${COUNTER_PATH}?t=${Date.now()}`;
          const r = await fetch(rawUrl, { cache: 'no-store' });
          const data = r.ok ? await r.json() : { count: 0 };
          res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
          res.status(200).json({ count: data.count || 0 });
    } catch (err) {
          res.status(200).json({ count: 0 });
    }
};
