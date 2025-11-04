# 💾 Portfolio HTML Storage Strategy

## Overview

This document explains how AI-generated portfolio HTML files are stored and managed in SkillSlate until deployment to GitHub Pages.

---

## 📊 Storage Architecture

```
AI Generation → MongoDB Database → Preview (iFrame) → GitHub Pages Deployment
```

### Storage Location
- **Database**: MongoDB `portfolios` collection
- **Field**: `html` (string, ~30-50KB per portfolio)
- **Status**: `draft` → `building` → `deployed`

---

## 🗄️ MongoDB Document Structure

### Portfolio Document Schema

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  userId: ObjectId("507f191e810c19729de860ea"),
  name: "John Doe Portfolio",
  template: "modern",
  status: "draft",  // draft → building → deployed
  
  // ✅ STRUCTURED DATA (JSON) - ~5-10KB
  data: {
    personalInfo: {
      name: "John Doe",
      title: "Full-Stack Developer",
      email: "john@example.com",
      phone: "+1234567890",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe"
    },
    bio: "Passionate developer...",
    skills: ["React", "Node.js", "Python", "AWS"],
    projects: [
      {
        title: "E-commerce Platform",
        description: "Built scalable platform serving 100k+ users",
        technologies: ["React", "Node.js", "MongoDB"],
        github: "https://github.com/johndoe/ecommerce",
        live: "https://demo.example.com"
      }
    ],
    experience: [
      {
        company: "Tech Corp",
        position: "Senior Developer",
        duration: "2020 - Present",
        location: "San Francisco, CA",
        responsibilities: [
          "Led team of 5 developers",
          "Architected microservices"
        ]
      }
    ],
    education: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        year: "2019"
      }
    ],
    theme: {
      primary: "#667eea",
      accent: "#764ba2",
      layout: "modern"
    }
  },
  
  // ✅ GENERATED HTML (Complete file) - ~30-50KB
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>John Doe - Full-Stack Developer</title>
  
  <style>
    /* All CSS inline (~10-15KB) */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
    }
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: gradient 15s ease infinite;
    }
    /* ... hundreds of lines of CSS ... */
  </style>
</head>

<body>
  <!-- Complete portfolio HTML structure -->
  <nav class="navbar">...</nav>
  <section class="hero">...</section>
  <section class="about">...</section>
  <section class="projects">...</section>
  <section class="skills">...</section>
  <section class="contact">...</section>
  
  <script>
    /* All JavaScript inline (~2-5KB) */
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href'))
          .scrollIntoView({ behavior: 'smooth' });
      });
    });
    // ... more JS ...
  </script>
</body>
</html>`,
  
  // Deployment Info
  url: null,  // Set after GitHub Pages deployment
  githubRepo: null,  // e.g., "username/portfolio"
  
  // Timestamps
  createdAt: ISODate("2025-11-04T10:30:00Z"),
  updatedAt: ISODate("2025-11-04T10:30:00Z"),
  lastDeployed: null
}
```

---

## 📏 Size Estimates

### Per Portfolio Document

```
Portfolio Document in MongoDB:
├─ Metadata (name, status, etc.): ~200 bytes
├─ data (JSON structure): ~5-10 KB
├─ html (Complete HTML string): ~30-50 KB
└─ Timestamps & references: ~100 bytes
────────────────────────────────────────
Total per portfolio: ~35-60 KB
```

### Storage Capacity

- **1,000 portfolios**: ~40-50 MB
- **10,000 portfolios**: ~400-500 MB
- **100,000 portfolios**: ~4-5 GB

MongoDB easily handles this scale with proper indexing.

---

## 🔄 Portfolio Lifecycle States

### 1. DRAFT (After AI Generation)
```javascript
{
  status: "draft",
  html: "<!DOCTYPE html>...",  // Stored in MongoDB
  url: null,                    // Not deployed yet
  githubRepo: null
}
```
- HTML stored in MongoDB
- User can preview anytime
- Can edit/refine with AI
- Not publicly accessible

### 2. BUILDING (During Deployment)
```javascript
{
  status: "building",
  html: "<!DOCTYPE html>...",  // Still in MongoDB
  url: null,                    // Being created
  githubRepo: "username/portfolio"
}
```
- Creating GitHub repository
- Pushing HTML to GitHub
- Enabling GitHub Pages
- Takes 30-60 seconds

### 3. DEPLOYED (Live on GitHub Pages)
```javascript
{
  status: "deployed",
  html: "<!DOCTYPE html>...",  // Still in MongoDB for editing
  url: "https://username.github.io/portfolio",
  githubRepo: "username/portfolio",
  lastDeployed: ISODate("2025-11-04T11:00:00Z")
}
```
- Live at public URL
- HTML exists in TWO places:
  1. **MongoDB** (for re-editing)
  2. **GitHub** (for hosting)
- Can redeploy after edits

---

## 💾 Storage Implementation

### Saving HTML to MongoDB

```python
# Server/models/portfolio.py

class Portfolio:
    def save(self):
        """Save portfolio to MongoDB"""
        portfolio_doc = {
            'userId': ObjectId(self.user_id),
            'name': self.name,
            'template': self.template,
            'status': 'draft',  # Initial status
            'data': self.data,  # Structured JSON
            'html': self.html,  # Complete HTML string
            'url': None,
            'githubRepo': None,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'lastDeployed': None
        }
        
        collection = self.get_collection()
        result = collection.insert_one(portfolio_doc)
        return result.inserted_id
```

### Retrieving HTML for Preview

```python
# Server/routes/ai_portfolio.py

@ai_portfolio_bp.route('/preview/<portfolio_id>', methods=['GET'])
@validate_auth_token
def get_preview(current_user, portfolio_id):
    """Get portfolio preview HTML"""
    portfolio = Portfolio.find_by_id_and_user(
        portfolio_id, 
        current_user['user_id']
    )
    
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    
    html_content = portfolio.get('html', '')
    
    # Return raw HTML
    return html_content, 200, {'Content-Type': 'text/html'}
```

### Frontend Preview

```javascript
// Client/src/components/AIPortfolioGenerator.js

loadPreview() {
  const iframe = document.getElementById('portfolio-preview');
  if (iframe && this.portfolioHtml) {
    // Load HTML directly into iframe
    iframe.srcdoc = this.portfolioHtml;
  }
}

// OR fetch from server
async loadPreviewFromServer(portfolioId) {
  const response = await apiService.get(
    `/api/ai/portfolio/preview/${portfolioId}`
  );
  iframe.srcdoc = response;  // Raw HTML
}
```

---

## 🚀 Deployment Process

### When User Clicks "Deploy to GitHub Pages"

```python
# Server/routes/portfolio.py

@portfolio_bp.route('/<portfolio_id>/deploy', methods=['POST'])
@validate_auth_token
def deploy_portfolio(current_user, portfolio_id):
    """Deploy portfolio to GitHub Pages"""
    
    # 1. Get HTML from MongoDB
    portfolio = Portfolio.find_by_id_and_user(
        portfolio_id, 
        current_user['user_id']
    )
    html_content = portfolio['html']
    
    # 2. Create GitHub repository
    repo_name = portfolio['name'].lower().replace(' ', '-')
    github_api.create_repo(
        repo_name,
        user_github_token,
        description=f"Portfolio for {portfolio['name']}"
    )
    
    # 3. Push HTML as index.html
    github_api.push_file(
        repo=f"{username}/{repo_name}",
        path='index.html',
        content=html_content,
        message='Deploy portfolio',
        token=user_github_token
    )
    
    # 4. Enable GitHub Pages
    github_api.enable_pages(
        repo=f"{username}/{repo_name}",
        branch='main',
        token=user_github_token
    )
    
    # 5. Update MongoDB
    Portfolio.update_status(
        portfolio_id,
        status='deployed',
        url=f"https://{username}.github.io/{repo_name}",
        github_repo=f"{username}/{repo_name}"
    )
    
    return jsonify({
        'success': True,
        'url': f"https://{username}.github.io/{repo_name}",
        'repo': f"{username}/{repo_name}"
    })
```

---

## 🔍 Storage Advantages

### ✅ Why MongoDB for HTML Storage

1. **Instant Preview**
   - No file system I/O
   - No temporary files
   - Direct database → iframe
   - Sub-second retrieval

2. **Version Control**
   - Keep edit history
   - Rollback capability
   - Track changes over time
   - Compare versions

3. **Easy Refinement**
   - User: "Make it more colorful"
   - AI regenerates HTML
   - Update same document
   - Previous version preserved

4. **Fast Deployment**
   - Read from database
   - Push to GitHub
   - No file management
   - Atomic operations

5. **Multi-tenant Safe**
   - User isolation via userId
   - Authorization checks
   - No file permissions issues
   - Secure by default

6. **Scalable**
   - Handles millions of documents
   - Automatic sharding
   - Replication support
   - Backup & restore built-in

7. **Queryable**
   - Find by user
   - Filter by status
   - Sort by date
   - Full-text search

---

## 📊 Database Indexes

### Performance Optimization

```python
# Server/app.py

def create_indexes():
    portfolios_collection = db_instance.get_collection('portfolios')
    
    # Compound index for user queries
    portfolios_collection.create_index([
        ('userId', 1),
        ('status', 1),
        ('createdAt', -1)
    ])
    
    # Index for deployment status
    portfolios_collection.create_index('status')
    
    # Index for search
    portfolios_collection.create_index('name')

# Fast queries:
# - Get all user's portfolios
# - Filter by draft/deployed
# - Sort by creation date
# - Search by name
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Generates Portfolio                                 │
│    ├─ Text prompt OR resume upload                          │
│    └─ Select template                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AI Processing (GPT-4o)                                   │
│    ├─ Extract data from input                               │
│    ├─ Generate structured JSON                              │
│    └─ Generate complete HTML with CSS/JS                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Save to MongoDB                                          │
│    POST /api/ai/portfolio/generate                          │
│    MongoDB.portfolios.insert({                              │
│      userId: "user123",                                     │
│      data: {...},                                           │
│      html: "<!DOCTYPE html>...",  ← 30-50KB stored          │
│      status: "draft"                                        │
│    })                                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend Receives portfolio_id                           │
│    Response: { portfolio_id, data, html }                   │
│    Store in component state                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Preview in iFrame                                        │
│    iframe.srcdoc = html                                     │
│    User sees live portfolio                                 │
│    Can refine with AI                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. User Clicks "Deploy"                                     │
│    POST /api/portfolio/:id/deploy                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Deployment Process                                       │
│    ├─ Read HTML from MongoDB                                │
│    ├─ Create GitHub repo                                    │
│    ├─ Push index.html to repo                               │
│    ├─ Enable GitHub Pages                                   │
│    └─ Update MongoDB: status="deployed"                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Dual Storage                                             │
│    HTML now exists in TWO places:                           │
│    ├─ MongoDB (for re-editing)                              │
│    └─ GitHub Pages (for hosting)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Storage States Summary

| State | MongoDB | GitHub | User Action |
|-------|---------|--------|-------------|
| **Draft** | ✅ HTML stored | ❌ Not pushed | Can preview, edit |
| **Building** | ✅ HTML stored | 🔄 Pushing... | Wait for deployment |
| **Deployed** | ✅ HTML stored | ✅ Live on Pages | View live, can re-edit |

---

## 🔧 Maintenance Operations

### Update Portfolio HTML
```python
def update_portfolio_html(portfolio_id, new_html):
    Portfolio.update_portfolio(portfolio_id, {
        'html': new_html,
        'updatedAt': datetime.utcnow()
    })
```

### Delete Portfolio
```python
def delete_portfolio(portfolio_id, user_id):
    # Remove from MongoDB
    success = Portfolio.delete_portfolio(portfolio_id, user_id)
    
    # TODO: Optionally delete from GitHub
    if portfolio.get('githubRepo'):
        github_api.delete_repo(portfolio['githubRepo'])
    
    return success
```

### Backup Strategy
```bash
# MongoDB backup includes all HTML
mongodump --db=skillslate --collection=portfolios --out=/backup

# Restore
mongorestore --db=skillslate --collection=portfolios /backup/skillslate/portfolios.bson
```

---

## 💡 Best Practices

### 1. Index Management
- Always index `userId` for user queries
- Index `status` for filtering drafts/deployed
- Index `createdAt` for chronological sorting

### 2. Size Monitoring
```javascript
// Monitor portfolio sizes
db.portfolios.aggregate([
  {
    $project: {
      size: { $bsonSize: "$$ROOT" }
    }
  },
  {
    $group: {
      _id: null,
      avgSize: { $avg: "$size" },
      maxSize: { $max: "$size" }
    }
  }
])
```

### 3. Cleanup Strategy
```python
# Delete old drafts (>30 days, not deployed)
def cleanup_old_drafts():
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    Portfolio.get_collection().delete_many({
        'status': 'draft',
        'createdAt': {'$lt': cutoff_date}
    })
```

### 4. Compression (Optional)
```python
# For very large HTML, compress before storage
import gzip
import base64

def compress_html(html):
    compressed = gzip.compress(html.encode('utf-8'))
    return base64.b64encode(compressed).decode('ascii')

def decompress_html(compressed):
    decoded = base64.b64decode(compressed.encode('ascii'))
    return gzip.decompress(decoded).decode('utf-8')
```

---

## 📚 Related Documentation

- [AI Portfolio Implementation](./AI_PORTFOLIO_IMPLEMENTATION.md)
- [GitHub Pages Deployment](./GITHUB_DEPLOYMENT.md) *(TODO)*
- [MongoDB Configuration](./Server/config/database.py)
- [Portfolio Model](./Server/models/portfolio.py)

---

## ✅ Summary

### Key Points

1. **Storage**: HTML stored as string in MongoDB `portfolios.html` field
2. **Size**: ~35-60 KB per portfolio (manageable at scale)
3. **Status**: Draft → Building → Deployed
4. **Preview**: Direct from MongoDB → iframe (instant)
5. **Deployment**: MongoDB → GitHub → Pages
6. **Persistence**: Stays in MongoDB even after deployment
7. **Editing**: Update MongoDB, redeploy to GitHub
8. **Backup**: MongoDB backup = all portfolios

### Advantages

- ✅ Fast retrieval (indexed queries)
- ✅ Secure (user isolation)
- ✅ Scalable (millions of portfolios)
- ✅ Version control ready
- ✅ No file system complexity
- ✅ Easy backup & restore
- ✅ Queryable metadata

---

**Last Updated**: November 4, 2025  
**Version**: 1.0
