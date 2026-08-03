// Vercel serverless function: GET /api/download-extension
//
// Redirects the visitor straight to the extension's zip download and, in the
// background, logs the event by incrementing a counter kept in downloads.json
// at the root of this repo (via the GitHub Contents API). The redirect never
// waits on the logging step, so a slow or failed GitHub write never blocks
// or breaks the actual download.
//
// Requires an environment variable GITHUB_TOKEN (a GitHub personal access
// token with "Contents: Read and write" permission on this repo) to be set
// in the Vercel project settings. If it's missing, the redirect still works,
// the counter just won't move.

const GITHUB_OWNER = 'puria1234';
const GITHUB_REPO = 'nib-site';
const COUNTER_PATH = 'downloads.json';
const DOWNLOAD_TARGET = 'https://github.com/puria1234/nib/archive/refs/heads/main.zip';

module.exports = async (req, res) => {
    // Fire-and-forget: don't let counter logic delay or break the redirect.
    incrementCounter().catch((err) => {
          console.error('download counter update failed:', err);
    });

        res.writeHead(302, { Location: DOWNLOAD_TARGET });
    res.end();
};

async function incrementCounter() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return;

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${COUNTER_PATH}`;

    const getRes = await fetch(apiUrl, {
          headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/vnd.github+json',
          },
    });
    if (!getRes.ok) throw new Error(`GET ${COUNTER_PATH} failed: ${getRes.status}`);

    const getJson = await getRes.json();
    const current = JSON.parse(Buffer.from(getJson.content, 'base64').toString('utf-8'));
    const nextCount = (current.count || 0) + 1;

    const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/vnd.github+json',
                  'Content-Type': 'application/json',
          },
                body: JSON.stringify({
                        message: `Increment download counter to ${nextCount}`,
                        content: Buffer.from(JSON.stringify({ count: nextCount })).toString('base64'),
                        sha: getJson.sha,
                        committer: { name: 'Nib Download Bot', email: 'bot@nib.local' },
                }),
    });
    if (!putRes.ok) throw new Error(`PUT ${COUNTER_PATH} failed: ${putRes.status}`);
}
