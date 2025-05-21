const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Octokit } = require('octokit');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Log environment variables
console.log('=== Environment Variables ===');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('GITHUB_OWNER:', process.env.GITHUB_OWNER);
console.log('GITHUB_REPO:', process.env.GITHUB_REPO);
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Set' : 'Not set');
console.log('==========================');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Function to read index.html template
async function readIndexTemplate() {
  try {
    const templatePath = path.join(__dirname, 'templates', 'index.html');
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    console.error('Error reading index.html template:', error);
    throw error;
  }
}

// Function to create or update index.html
async function createOrUpdateIndexHtml() {
  try {
    let currentSha = null;
    let needsUpdate = true;
    const templateContent = await readIndexTemplate();

    // Check if index.html exists
    try {
      const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'index.html'
      });

      // Compare content if file exists
      const currentContent = Buffer.from(response.data.content, 'base64').toString();
      if (currentContent === templateContent) {
        console.log('index.html is up to date');
        needsUpdate = false;
      } else {
        console.log('index.html needs update');
        currentSha = response.data.sha;
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('index.html does not exist. Creating new file.');
      } else {
        throw error;
      }
    }

    // Create or update file if needed
    if (needsUpdate) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'index.html',
        message: currentSha ? 'Update index.html' : 'Create index.html',
        content: Buffer.from(templateContent).toString('base64'),
        branch: 'main',
        ...(currentSha && { sha: currentSha })
      });
      console.log(currentSha ? 'index.html has been updated' : 'index.html has been created');
    }
  } catch (error) {
    console.error('Error checking/creating/updating index.html:', error);
  }
}

// Check and create/update index.html on server start
createOrUpdateIndexHtml();

// Create blog post endpoint
app.post('/api/posts', upload.array('files'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files;

    // Convert post data to JSON
    const postData = {
      title,
      content,
      createdAt: new Date().toISOString(),
      files: files ? files.map(file => ({
        name: file.originalname,
        path: file.path
      })) : []
    };

    // Commit file to GitHub
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: `posts/${Date.now()}.json`,
      message: `Add new blog post: ${title}`,
      content: Buffer.from(JSON.stringify(postData, null, 2)).toString('base64'),
      branch: 'main'
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get blog posts endpoint
app.get('/api/posts', async (req, res) => {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'posts'
    });

    const posts = await Promise.all(
      response.data.map(async (file) => {
        const content = await octokit.rest.repos.getContent({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path: file.path
        });
        return JSON.parse(Buffer.from(content.data.content, 'base64').toString());
      })
    );

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 