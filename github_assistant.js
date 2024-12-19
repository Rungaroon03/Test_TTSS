const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');


const app = express();
const port = 3000;

// GitHub Token 
const GITHUB_TOKEN = 'GitHub Token';

// Headers Authorization
const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
};

app.use(bodyParser.json());


// 1. Add a Repository
app.post('/repositories', async (req, res) => {
  const { repository_name, description, private = false } = req.body;

  if (!repository_name) {
    return res.status(400).json({ error: 'Repository name is required.' });
  }

  try {
    // สร้าง repository
    const response = await axios.post('https://api.github.com/user/repos', {
      name: repository_name,
      description: description || '',
      private: private,
    }, { headers });

    return res.status(201).json({ message: 'Repository created successfully.', repository: response.data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Remove a Repository
app.delete('/repositories', async (req, res) => {
  const { repository_name, owner } = req.body;

  if (!repository_name || !owner) {
    return res.status(400).json({ error: 'Repository name and owner are required.' });
  }

  try {
    // ลบ repository 
    const response = await axios.delete(`https://api.github.com/repos/${owner}/${repository_name}`, { headers });

    return res.status(200).json({
      message: 'Repository deleted successfully from GitHub.',
      repository: response.data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. Get List of Repositories
app.get('/repositories', async (req, res) => {
  try {
    // ดึง repository
    const response = await axios.get('https://api.github.com/user/repos?per_page=100', { headers });
    // console.log('Fetched Data:', response);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Get Pull Requests for a Repository
app.get('/repositories/:repository_name/pull-requests', async (req, res) => {
  const { repository_name } = req.params;
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: 'Owner is required.' });
  }

  try {
    // Pull Requests ของ repository 
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repository_name}/pulls`, { headers });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. Merge a Pull Request (with condition)
app.post('/repositories/:repository_name/pull-requests/:pull_request_id/merge', async (req, res) => {
  const { repository_name, pull_request_id } = req.params;
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: 'Owner is required.' });
  }

  try {
    // ดึงข้อมูล pull request 
    const prResponse = await axios.get(`https://api.github.com/repos/${owner}/${repository_name}/pulls/${pull_request_id}`, { headers });

    const prData = prResponse.data;
    const labels = prData.labels.map(label => label.name);

    // เช็ค label "do not merge" 
    if (labels.includes('do not merge')) {
      return res.status(400).json({ error: 'not merge' });
    }

    // merge pull request
    const mergeResponse = await axios.put(
      `https://api.github.com/repos/${owner}/${repository_name}/pulls/${pull_request_id}/merge`,
      {},
      { headers }
    );

    return res.status(200).json({
      message: 'Pull request merged successfully.',
      pull_request: mergeResponse.data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
