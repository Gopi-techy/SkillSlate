# GitHub Pages Deployment Flow

## Overview
This document explains how SkillSlate creates GitHub repositories and deploys portfolios to GitHub Pages.

---

## User Flow

### 1. **Portfolio Creation**
User creates a portfolio using AI (via prompt or resume upload):
- AI generates the portfolio HTML
- Portfolio is saved to database
- User sees live preview

### 2. **Repository Name Configuration**
In the preview step, user can customize the GitHub repository name:

**Default Repository Name Generation:**
```javascript
// Pattern: {name}-portfolio
// Examples:
// - User "John Doe" → "john-doe-portfolio"
// - Portfolio name "My Work" → "my-work-portfolio"
// - Fallback → "portfolio-portfolio"
```

**User Customization:**
- Input field shows default name
- User can edit the repository name
- Real-time validation: only `a-z`, `0-9`, and `-` allowed
- "Reset" button to restore default name
- Stored in `this.customRepoName` property

### 3. **Deployment Process**

#### Step 1: GitHub Connection Check
```javascript
// Check if user has connected GitHub account
const githubStatus = await apiService.getGithubStatus();

if (!connected) {
  // Show confirmation dialog
  // Redirect to GitHub OAuth
  // After auth, auto-resume deployment
}
```

#### Step 2: Show Progress UI
```javascript
// Beautiful animated progress widget
this.step = 'generating';
this.generationProgress = 0;
this.generationMessage = 'initialize';

// Animated stages:
// - Initialize (15%)
// - Parsing (30%)
// - Structuring (50%)
// - Designing (75%)
// - Finalizing (95%)
// - Complete (100%)
```

#### Step 3: Deploy to GitHub
```javascript
const deployResponse = await apiService.deployToGithub({
  repo: customRepoName || defaultRepoName,
  branch: 'main',
  path: '/',
  files: [{ path: 'index.html', content: portfolioHtml }],
  message: 'Deploy portfolio via SkillSlate'
});
```

---

## Backend Deployment Logic

### Server Endpoint: `/api/github/deploy`

**File:** `Server/routes/github.py` - `one_click_deploy()` function

#### Deployment Steps:

**1. Repository Check & Creation**
```python
# Check if repository exists
info = requests.get(f'https://api.github.com/repos/{owner}/{repo}')

if info.status_code == 404:
    # Repository doesn't exist - create it
    create = requests.post(
        'https://api.github.com/user/repos',
        json={
            'name': repo,
            'private': False,
            'has_issues': False,
            'has_wiki': False,
            'auto_init': True  # Creates with README
        }
    )
    time.sleep(2)  # Wait for GitHub to initialize
```

**2. Create Git Blobs**
```python
# Create blob objects for each file
blob_shas = {}
for file in files:
    blob_res = requests.post(
        f'https://api.github.com/repos/{owner}/{repo}/git/blobs',
        json={
            'content': file['content'],
            'encoding': 'utf-8'
        }
    )
    blob_shas[file['path']] = blob_res.json()['sha']
```

**3. Check Branch Existence**
```python
# Check if branch exists (e.g., 'main')
ref_res = requests.get(
    f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}'
)

branch_exists = ref_res.status_code == 200
```

**4. Create Git Tree**
```python
# Create tree with all files
tree_items = [
    {'path': path, 'mode': '100644', 'type': 'blob', 'sha': sha}
    for path, sha in blob_shas.items()
]

tree_json = {'tree': tree_items}
if branch_exists:
    # Update existing tree
    tree_json['base_tree'] = current_tree_sha

tree_res = requests.post(
    f'https://api.github.com/repos/{owner}/{repo}/git/trees',
    json=tree_json
)
```

**5. Create Git Commit**
```python
commit_json = {
    'message': 'Deploy portfolio via SkillSlate',
    'tree': tree_sha
}

if branch_exists:
    # Add parent commit for updates
    commit_json['parents'] = [current_commit_sha]

commit_res = requests.post(
    f'https://api.github.com/repos/{owner}/{repo}/git/commits',
    json=commit_json
)
```

**6. Update Branch Reference**
```python
if branch_exists:
    # UPDATE existing branch using PATCH
    requests.patch(
        f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
        json={'sha': new_commit_sha, 'force': True}
    )
else:
    # CREATE new branch using POST
    requests.post(
        f'https://api.github.com/repos/{owner}/{repo}/git/refs',
        json={'ref': f'refs/heads/{branch}', 'sha': new_commit_sha}
    )
```

**7. Enable GitHub Pages**
```python
pages_res = requests.put(
    f'https://api.github.com/repos/{owner}/{repo}/pages',
    json={
        'source': {
            'branch': branch,  # 'main'
            'path': '/'        # Root directory
        }
    }
)
```

**8. Return Deployment URL**
```python
url = f'https://{owner}.github.io/{repo}/'

# Save deployment info to database
SiteDeployment.upsert(user_id, repo, branch, url, commit_sha)

return {'message': 'Deployed', 'url': url}
```

---

## Handling Different Scenarios

### Scenario 1: New Repository
- Repository doesn't exist
- Create repository with `auto_init: True`
- Create blobs → tree → commit
- Create branch reference
- Enable Pages

### Scenario 2: Existing Empty Repository
- Repository exists but has no commits
- Create blobs → tree → commit (no parents)
- Create branch reference
- Enable Pages

### Scenario 3: Existing Repository with Branch
- Repository and branch both exist
- Get current HEAD commit SHA
- Create blobs → tree (with base_tree) → commit (with parents)
- **UPDATE** branch reference using PATCH (not CREATE)
- Pages already enabled (or enable if not)

---

## Frontend API Integration

### File: `Client/src/utils/api.js`

```javascript
async deployToGithub(deployData) {
  return this.post('/github/deploy', deployData);
}
```

**Request Payload:**
```json
{
  "repo": "john-doe-portfolio",
  "branch": "main",
  "path": "/",
  "files": [
    {
      "path": "index.html",
      "content": "<html>...</html>",
      "encoding": "utf-8"
    }
  ],
  "message": "Deploy portfolio via SkillSlate"
}
```

**Response:**
```json
{
  "message": "Deployed",
  "url": "https://gopi-techy.github.io/john-doe-portfolio/"
}
```

---

## Success Page

After successful deployment:
1. Progress reaches 100%
2. Step changes to 'complete'
3. Shows deployment URL with copy button
4. Updates portfolio in database with deployment info
5. User can visit live site or create another portfolio

---

## Key Features

✅ **Automatic Repository Creation** - No manual setup required  
✅ **Custom Repository Names** - User can edit before deployment  
✅ **Smart Update Logic** - Handles new/empty/existing repos correctly  
✅ **GitHub Pages Auto-Enable** - Automatically configures GitHub Pages  
✅ **Beautiful Progress UI** - Animated stages with glassmorphism  
✅ **OAuth Integration** - Seamless GitHub authentication  
✅ **Auto-Resume After Auth** - Continues deployment after OAuth  
✅ **Error Handling** - Custom notifications for all errors  
✅ **URL Management** - Copy to clipboard, visit site  

---

## Security

- GitHub OAuth tokens stored securely in MongoDB
- Token refresh handled automatically
- Repository created as **public** (required for free GitHub Pages)
- No hardcoded credentials
- CORS protection on backend

---

## Future Enhancements

Possible improvements:
- [ ] Custom domain support (CNAME file)
- [ ] Deploy to multiple branches
- [ ] Deploy history/versions
- [ ] Rollback functionality
- [ ] Custom commit messages
- [ ] Multiple file support (CSS, JS, images)
- [ ] Repository visibility toggle (public/private)
- [ ] Deployment analytics
