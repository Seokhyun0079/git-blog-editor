const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Octokit } = require('octokit');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { deleteFile, createOrUpdateFile, getContent, createImageFile, getFile } = require('./git-utils');
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

// Initialize templates and README on server start
async function initializeFiles() {
  try {
    // Create posts directory if it doesn't exist
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'posts/.gitkeep',
      message: 'Create posts directory',
      content: Buffer.from('').toString('base64'),
      branch: 'main'
    });

    // Create images directory if it doesn't exist
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'images/.gitkeep',
      message: 'Create images directory',
      content: Buffer.from('').toString('base64'),
      branch: 'main'
    });

    await createOrUpdateTemplate('index.html');
    await createOrUpdateTemplate('post.html');
    await createOrUpdateReadme();
  } catch (error) {
    if (error.status === 422) {
      console.log('Directories already exist');
    } else {
      console.error('Error initializing files:', error);
    }
  }
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

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get meta.json
    const metaContent = await getContent('posts/meta.json');
    // Get post file
    const postContent = await getContent(`posts/${id}.json`);

    // Delete attached files
    if (postContent.files && postContent.files.length > 0) {
      for (const file of postContent.files) {
        const filePath = file.url.split('/main/')[1];
        console.log('Deleting file:', filePath);
        const fileResponse = await getContent(filePath);
        await deleteFile(filePath, fileResponse.data.sha);
      }
    }

    // Delete post file
    await deleteFile(`posts/${id}.json`, postContent.sha);
    metaContent.content.posts = metaContent.content.posts.filter(post => post !== `${id}.json`);
    // Update meta.json
    await createOrUpdateFile('posts/meta.json', metaContent.content, 'Update meta.json', metaContent.sha);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create blog post endpoint
app.post('/api/posts', upload.array('files'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files || [];
    const postId = uuidv4();
    const filename = `${postId}.json`;

    // Upload files to GitHub
    const uploadedFiles = [];
    for (const file of files) {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const imagePath = `images/${fileId}${fileExtension}`;
      await createImageFile(imagePath, fileId, file);
      uploadedFiles.push({
        id: fileId,
        name: `${fileId}${fileExtension}`,
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${imagePath}`
      });
    }

    // Create post data
    const postData = {
      id: postId,
      title,
      content,
      createdAt: new Date().toISOString(),
      files: uploadedFiles
    };

    // Create post file
    await createOrUpdateFile(`posts/${filename}`, postData, `Create post: ${title}`, null);

    // Update meta.json
    await updateMetaJson(filename);

    res.json({ success: true, filename, postId });
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
      response.data
        .filter((file) => !file.path.endsWith('meta.json') && !file.path.endsWith('.gitkeep'))
        .map(async (file) => {
          try {
            const content = await octokit.rest.repos.getContent({
              owner: process.env.GITHUB_OWNER,
              repo: process.env.GITHUB_REPO,
              path: file.path
            });
            return JSON.parse(Buffer.from(content.data.content, 'base64').toString());
          } catch (error) {
            console.error(`Error fetching post ${file.path}:`, error);
            return null;
          }
        })
    );

    // Filter out any null values from failed post fetches
    const validPosts = posts.filter(post => post !== null);

    res.json({ success: true, data: validPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/posts/:id', upload.array('files'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const files = req.files || [];

    // Get post file
    const postContent = await getContent(`posts/${id}.json`);

    // Compare existing files with new files
    const existingFiles = postContent.content.files || [];
    let newFiles = [];
    if (req.body.files === "[object Object]") {
      newFiles = [];
    } else {
      newFiles = JSON.parse(req.body.files || '[]');
    }

    // Find files to delete (exist in GitHub but not in new files)
    const filesToDelete = existingFiles.filter(existingFile =>
      !newFiles.some(newFile => newFile.id === existingFile.id)
    );

    console.log('filesToDelete');
    // Delete files that are no longer needed
    for (const file of filesToDelete) {
      const filePath = file.url.split('/main/')[1];
      console.log('filePath', filePath);
      const fileResponse = await getFile(filePath);
      await deleteFile(filePath, fileResponse.sha);
      console.log('file deleted');
    }

    // Upload new files
    const uploadedFiles = [];
    for (const file of files) {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const imagePath = `images/${fileId}${fileExtension}`;
      await createImageFile(imagePath, fileId, file);
      uploadedFiles.push({
        id: fileId,
        name: `${fileId}${fileExtension}`,
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${imagePath}`
      });
    }
    console.log('file Uploaded');

    // Combine existing files that weren't deleted with new files
    const finalFiles = [
      ...existingFiles.filter(existingFile =>
        newFiles.some(newFile => newFile.id === existingFile.id)
      ),
      ...uploadedFiles
    ];

    // Update post data
    const updatedPostData = {
      ...postContent.content,
      title,
      content,
      updatedAt: new Date().toISOString(),
      files: finalFiles
    };

    // Update post file
    const postResponse = await getContent(`posts/${id}.json`);
    await createOrUpdateFile(`posts/${id}.json`, updatedPostData, `Update post: ${title}`, postResponse.sha);

    res.json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 