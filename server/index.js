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

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Function to read template files
async function readTemplate(filename) {
  try {
    const templatePath = path.join(__dirname, 'templates', filename);
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filename} template:`, error);
    throw error;
  }
}

// Function to create or update template file
async function createOrUpdateTemplate(filename) {
  try {
    let currentSha = null;
    let needsUpdate = true;
    const templateContent = await readTemplate(filename);

    // Check if file exists
    try {
      const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filename
      });

      // Compare content if file exists
      const currentContent = Buffer.from(response.data.content, 'base64').toString();
      if (currentContent === templateContent) {
        console.log(`${filename} is up to date`);
        needsUpdate = false;
      } else {
        console.log(`${filename} needs update`);
        currentSha = response.data.sha;
      }
    } catch (error) {
      if (error.status === 404) {
        console.log(`${filename} does not exist. Creating new file.`);
      } else {
        throw error;
      }
    }

    // Create or update file if needed
    if (needsUpdate) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filename,
        message: currentSha ? `Update ${filename}` : `Create ${filename}`,
        content: Buffer.from(templateContent).toString('base64'),
        branch: 'main',
        ...(currentSha && { sha: currentSha })
      });
      console.log(currentSha ? `${filename} has been updated` : `${filename} has been created`);
    }
  } catch (error) {
    console.error(`Error checking/creating/updating ${filename}:`, error);
  }
}

// Function to create or update README.md
async function createOrUpdateReadme() {
  try {
    let currentSha = null;
    let needsUpdate = true;

    const readmeContent = await readTemplate('README.md');

    // Check if README.md exists
    try {
      const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'README.md'
      });

      // Compare content if file exists
      const currentContent = Buffer.from(response.data.content, 'base64').toString();
      if (currentContent === readmeContent) {
        console.log('README.md is up to date');
        needsUpdate = false;
      } else {
        console.log('README.md needs update');
        currentSha = response.data.sha;
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('README.md does not exist. Creating new file.');
      } else {
        throw error;
      }
    }

    // Create or update file if needed
    if (needsUpdate) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'README.md',
        message: currentSha ? 'Update README.md' : 'Create README.md',
        content: Buffer.from(readmeContent).toString('base64'),
        branch: 'main',
        ...(currentSha && { sha: currentSha })
      });
      console.log(currentSha ? 'README.md has been updated' : 'README.md has been created');
    }
  } catch (error) {
    console.error('Error checking/creating/updating README.md:', error);
  }
}

// Check and create/update template files on server start
async function initializeTemplates() {
  await createOrUpdateTemplate('index.html');
  await createOrUpdateTemplate('post.html');
}

// Initialize templates and README on server start
async function initializeFiles() {
  await createOrUpdateTemplate('index.html');
  await createOrUpdateTemplate('post.html');
  await createOrUpdateReadme();
}

// Initialize files on server start
initializeFiles();

// Function to update meta.json
async function updateMetaJson(newPostFile) {
  try {
    let metaContent;
    let currentSha = null;

    // Try to get existing meta.json
    try {
      const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: 'posts/meta.json'
      });
      metaContent = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
      currentSha = response.data.sha;
    } catch (error) {
      if (error.status === 404) {
        // Create new meta.json if it doesn't exist
        metaContent = { posts: [] };
      } else {
        throw error;
      }
    }

    // Add new post file to the list if it's not already there
    if (!metaContent.posts.includes(newPostFile)) {
      metaContent.posts.push(newPostFile);
    }

    // Update meta.json
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'posts/meta.json',
      message: 'Update meta.json',
      content: Buffer.from(JSON.stringify(metaContent, null, 2)).toString('base64'),
      branch: 'main',
      ...(currentSha && { sha: currentSha })
    });

    console.log('meta.json has been updated');
  } catch (error) {
    console.error('Error updating meta.json:', error);
    throw error;
  }
}

// Function to create or update index.html
async function createOrUpdateIndexHtml() {
  try {
    let currentSha = null;
    let needsUpdate = true;
    const templateContent = await readTemplate('index.html');

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

// Upload images endpoint
app.post('/api/upload', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];

    for (const file of files) {
      const imagePath = `images/${file.originalname}`;

      // Upload image to GitHub
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: imagePath,
        message: `Upload image: ${file.originalname}`,
        content: file.buffer.toString('base64'),
        branch: 'main'
      });

      uploadedFiles.push({
        name: file.originalname,
        url: response.data.content.html_url
      });
    }

    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create blog post endpoint
app.post('/api/posts', upload.array('files'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files || [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}.json`;

    // Upload files to GitHub
    const uploadedFiles = [];
    for (const file of files) {
      const imagePath = `images/${file.originalname}`;
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: imagePath,
        message: `Upload image: ${file.originalname}`,
        content: file.buffer.toString('base64'),
        branch: 'main'
      });
      uploadedFiles.push({
        name: file.originalname,
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${imagePath}`
      });
    }

    // Create post data
    const postData = {
      title,
      content,
      createdAt: new Date().toISOString(),
      files: uploadedFiles
    };

    // Create post file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: `posts/${filename}`,
      message: `Create post: ${title}`,
      content: Buffer.from(JSON.stringify(postData, null, 2)).toString('base64'),
      branch: 'main'
    });

    // Update meta.json
    await updateMetaJson(filename);

    res.json({ success: true, filename });
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