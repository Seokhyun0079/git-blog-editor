const { Octokit } = require('octokit');
require('dotenv').config();
// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const deleteFile = async (filePath, sha) => {
  await octokit.rest.repos.deleteFile({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path: filePath,
    message: 'Delete post',
    branch: 'main',
    sha: sha
  });
};

const createOrUpdateFile = async (filePath, content, message, sha) => {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path: filePath,
    message: message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: 'main',
    sha: sha
  });
};

const createImageFile = async (imagePath, fileId, file) => {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path: imagePath,
    message: `Upload image: ${fileId}`,
    content: file.buffer.toString('base64'),
    branch: 'main'
  });
};

const getContent = async (filePath) => {
  const response = await octokit.rest.repos.getContent({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path: filePath
  });
  return {
    sha: response.data.sha,
    content: JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf-8'))
  };
};

const getFile = async (filePath) => {
  const response = await octokit.rest.repos.getContent({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    path: filePath
  });
  return {
    sha: response.data.sha,
    content: Buffer.from(response.data.content, 'base64').toString('utf-8')
  };
};

module.exports = {
  deleteFile,
  createOrUpdateFile,
  getContent,
  createImageFile,
  getFile
};
