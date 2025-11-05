from flask import Blueprint, request, jsonify, redirect
import os
import requests
from functools import wraps
from routes.auth import token_required  # reuse existing auth decorator
from models.github_token import GitHubTokenStore
from models.user import User
from models.site_deployment import SiteDeployment

github_bp = Blueprint('github', __name__, url_prefix='/api/github')


def get_github_oauth_config():
    client_id = os.getenv('GITHUB_CLIENT_ID')
    client_secret = os.getenv('GITHUB_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("WARNING: GitHub OAuth credentials are missing!")
        print(f"GITHUB_CLIENT_ID: {'Present' if client_id else 'Missing'}")
        print(f"GITHUB_CLIENT_SECRET: {'Present' if client_secret else 'Missing'}")
        
    config = {
        'client_id': client_id or '',
        'client_secret': client_secret or '',
        'redirect_uri': os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:5000/api/github/callback'),
        'scopes': os.getenv('GITHUB_SCOPES', 'repo,workflow,pages:write')
    }
    
    # Debug print
    print("GitHub OAuth Config:", {k: v if k != 'client_secret' else '***' for k, v in config.items()})
    return config


@github_bp.route('/authorize', methods=['GET'])
def authorize():
    cfg = get_github_oauth_config()
    state = request.args.get('state')
    
    if not cfg['client_id']:
        print("❌ GitHub client ID is missing!")
        return jsonify({
            'error': 'configuration_error',
            'error_description': 'GitHub OAuth is not properly configured'
        }), 500
    
    if not state:
        print("❌ No state parameter provided!")
        return jsonify({
            'error': 'invalid_request',
            'error_description': 'State parameter is required'
        }), 400
    
    try:
        # URL encode the redirect URI and scopes
        redirect_uri = requests.utils.quote(cfg['redirect_uri'])
        scopes = requests.utils.quote(cfg['scopes'])
        
        authorize_url = (
            'https://github.com/login/oauth/authorize'
            f"?client_id={cfg['client_id']}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scopes}"
            f"&state={state}"
            '&allow_signup=true'
        )
        
        print(f"✅ Generated GitHub authorization URL (state: {state})")
        return jsonify({'url': authorize_url})
        
    except Exception as e:
        print(f"❌ Error generating authorization URL: {str(e)}")
        return jsonify({
            'error': 'server_error',
            'error_description': 'Failed to generate authorization URL'
        }), 500


@github_bp.route('/callback', methods=['GET', 'POST'])
def callback():
    print("GitHub Callback received!")
    
    # Handle both GET (GitHub redirect) and POST (frontend code exchange) requests
    if request.method == 'GET':
        print("Query params:", dict(request.args))
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
    else:  # POST
        print("Processing code exchange from frontend")
        data = request.get_json(silent=True) or {}
        code = data.get('code')
        state = data.get('state')
        error = data.get('error')
        error_description = data.get('error_description')

    # Handle GitHub error response first
    if error:
        print(f"GitHub Error: {error} - {error_description}")
        error_params = {
            'error': error,
            'error_description': error_description or 'GitHub authentication failed'
        }
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
        return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))

    if not code:
        print("Error: No code in callback")
        error_params = {
            'error': 'missing_code',
            'error_description': 'No authorization code received from GitHub'
        }
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
        return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))

    # Exchange code for token
    cfg = get_github_oauth_config()
    token_url = 'https://github.com/login/oauth/access_token'
    headers = {'Accept': 'application/json'}
    payload = {
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'code': code,
        'redirect_uri': cfg['redirect_uri']
    }

    try:
        print("🔄 Exchanging code for token...")
        res = requests.post(token_url, headers=headers, json=payload, timeout=15)
        
        # Check for HTTP error first
        try:
            res.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP error in token exchange: {str(e)}")
            error_params = {
                'error': 'token_exchange_failed',
                'error_description': f'GitHub API error: {str(e)}'
            }
            # For GET requests, redirect to frontend
            if request.method == 'GET':
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
                return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))
            # For POST requests, return JSON response
            return jsonify(error_params), 400
            
        # Try to parse JSON response
        try:
            data = res.json()
        except ValueError:
            print("❌ Invalid JSON response from GitHub")
            error_params = {
                'error': 'invalid_response',
                'error_description': 'Invalid response from GitHub API'
            }
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
            return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))
            
        print("📦 Token response:", {k: '***' if k == 'access_token' else v for k, v in data.items()})
        
        access_token = data.get('access_token')
        token_type = data.get('token_type', 'bearer')
        
        if not access_token:
            print("❌ No access token in response")
            error_params = {
                'error': 'token_exchange_failed',
                'error_description': 'Failed to exchange code for access token'
            }
            if 'error' in data:
                error_params['github_error'] = data['error']
                error_params['github_error_description'] = data.get('error_description', '')
            
            # For GET requests, redirect to frontend
            if request.method == 'GET':
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
                return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))
            # For POST requests, return JSON response
            return jsonify(error_params), 400
        
        # For GET requests, redirect back to frontend with the token
        if request.method == 'GET':
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
            params = {
                'code': code,
                'state': state,
                'access_token': access_token,
                'token_type': token_type
            }
        
            print("✅ Redirecting to frontend with token")
            # URL encode each parameter value
            encoded_params = {k: requests.utils.quote(str(v)) for k, v in params.items() if v is not None}
            redirect_url = f"{frontend_url}/github-callback?" + "&".join(f"{k}={v}" for k, v in encoded_params.items())
            return redirect(redirect_url)
        
        # For POST requests, return JSON response with token
        return jsonify({
            'access_token': access_token,
            'token_type': token_type,
            'state': state
        }), 200
        
    except requests.RequestException as e:
        print("❌ Token exchange failed:", str(e))
        error_params = {
            'error': 'request_failed',
            'error_description': f'Failed to exchange code: {str(e)}'
        }
        # For GET requests, redirect to frontend
        if request.method == 'GET':
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
            return redirect(f"{frontend_url}/github-callback?" + "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in error_params.items()))
        # For POST requests, return JSON response
        return jsonify(error_params), 500


def github_headers(token: str):
    return {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github+json'
    }


@github_bp.route('/me', methods=['GET'])
@token_required
def github_me(current_user):
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 404  # Return 404 if no GitHub token exists
    token = token_doc['access_token']
    try:
        res = requests.get('https://api.github.com/user', headers=github_headers(token), timeout=15)
        if res.status_code == 401:  # Token invalid/expired
            # Clean up invalid token
            GitHubTokenStore.delete_for_user(str(current_user['_id']))
            User.update_github_connection(current_user['_id'], False)
            return jsonify({'message': 'GitHub token invalid/expired'}), 401
        res.raise_for_status()
        return jsonify({'message': 'GitHub connected', 'data': res.json()}), 200
    except requests.RequestException as e:
        return jsonify({'message': f'Fetch GitHub user failed: {str(e)}'}), 500

@github_bp.route('/link', methods=['POST'])
@token_required
def link_github(current_user):
    body = request.get_json(silent=True) or {}
    access_token = body.get('access_token')
    token_type = body.get('token_type', 'bearer')
    if not access_token:
        return jsonify({'message': 'Missing access_token'}), 400
    # Fetch login for convenience
    login = None
    try:
        me = requests.get('https://api.github.com/user', headers=github_headers(access_token), timeout=15)
        if me.ok:
            login = me.json().get('login')
    except requests.RequestException:
        pass
    GitHubTokenStore.upsert_for_user(str(current_user['_id']), access_token, token_type, login=login)
    User.update_github_connection(current_user['_id'], True)
    return jsonify({'message': 'GitHub linked'}), 200


@github_bp.route('/repos', methods=['POST'])
@token_required
def create_repo(current_user):
    body = request.get_json(silent=True) or {}
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']
    login = token_doc.get('login')
    name = body.get('name', 'skillslate-portfolio')
    description = body.get('description', 'SkillSlate portfolio repository')
    private = bool(body.get('private', False))
    homepage = body.get('homepage')

    if not token:
        return jsonify({'message': 'Missing token'}), 400

    try:
        res = requests.post(
            'https://api.github.com/user/repos',
            headers=github_headers(token),
            json={
                'name': name,
                'description': description,
                'private': private,
                'homepage': homepage,
                'has_issues': False,
                'has_wiki': False
            },
            timeout=15
        )
        res.raise_for_status()
        repo_json = res.json()
        return jsonify(repo_json), 201
    except requests.RequestException as e:
        return jsonify({'message': f'Create repo failed: {str(e)}'}), 500


@github_bp.route('/deploy/pages', methods=['POST'])
@token_required
def enable_pages(current_user):
    body = request.get_json(silent=True) or {}
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']
    owner = body.get('owner')
    repo = body.get('repo')
    branch = body.get('branch', 'main')
    path = body.get('path', '/')

    if not all([token, owner, repo]):
        return jsonify({'message': 'Missing token/owner/repo'}), 400

    try:
        res = requests.put(
            f'https://api.github.com/repos/{owner}/{repo}/pages',
            headers=github_headers(token),
            json={ 'source': { 'branch': branch, 'path': path } },
            timeout=15
        )
        # GitHub returns 201/202 depending on state
        if res.status_code not in (201, 202):
            return jsonify({'message': 'Enable pages failed', 'details': res.text}), res.status_code
        return jsonify(res.json()), res.status_code
    except requests.RequestException as e:
        return jsonify({'message': f'Enable pages failed: {str(e)}'}), 500


@github_bp.route('/push', methods=['POST'])
@token_required
def push_static_site(current_user):
    body = request.get_json(silent=True) or {}
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']

    owner = body.get('owner') or token_doc.get('login')
    repo = body.get('repo')
    branch = body.get('branch', 'main')
    files = body.get('files', [])  # [{ path, content, encoding }]
    commit_message = body.get('message', 'Deploy portfolio')

    if not all([owner, repo]) or not isinstance(files, list) or len(files) == 0:
        return jsonify({'message': 'Missing owner/repo/files'}), 400

    try:
        # 1) get current head sha (or create branch)
        ref_res = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
            headers=github_headers(token), timeout=15
        )
        if ref_res.status_code == 404:
            # create branch off default_branch
            repo_res = requests.get(f'https://api.github.com/repos/{owner}/{repo}', headers=github_headers(token), timeout=15)
            repo_res.raise_for_status()
            default_branch = repo_res.json().get('default_branch', 'main')
            base_ref = requests.get(
                f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{default_branch}',
                headers=github_headers(token), timeout=15
            )
            base_ref.raise_for_status()
            base_sha = base_ref.json()['object']['sha']
            # create new branch
            create_ref = requests.post(
                f'https://api.github.com/repos/{owner}/{repo}/git/refs',
                headers=github_headers(token),
                json={ 'ref': f'refs/heads/{branch}', 'sha': base_sha },
                timeout=15
            )
            create_ref.raise_for_status()
            head_sha = base_sha
        else:
            ref_res.raise_for_status()
            head_sha = ref_res.json()['object']['sha']

        # 2) fetch head commit to get tree sha
        commit_res = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/git/commits/{head_sha}',
            headers=github_headers(token), timeout=15
        )
        commit_res.raise_for_status()
        base_tree_sha = commit_res.json()['tree']['sha']

        # 3) create blobs for files
        blob_shas = {}
        for f in files:
            blob = requests.post(
                f'https://api.github.com/repos/{owner}/{repo}/git/blobs',
                headers=github_headers(token),
                json={ 'content': f.get('content', ''), 'encoding': f.get('encoding', 'utf-8') },
                timeout=15
            )
            blob.raise_for_status()
            blob_shas[f['path']] = blob.json()['sha']

        # 4) create tree from base tree
        tree = [{ 'path': p, 'mode': '100644', 'type': 'blob', 'sha': sha } for p, sha in blob_shas.items()]
        tree_res = requests.post(
            f'https://api.github.com/repos/{owner}/{repo}/git/trees',
            headers=github_headers(token),
            json={ 'base_tree': base_tree_sha, 'tree': tree },
            timeout=15
        )
        tree_res.raise_for_status()
        tree_sha = tree_res.json()['sha']

        # 5) create commit
        commit_res = requests.post(
            f'https://api.github.com/repos/{owner}/{repo}/git/commits',
            headers=github_headers(token),
            json={ 'message': commit_message, 'tree': tree_sha, 'parents': [head_sha] },
            timeout=15
        )
        commit_res.raise_for_status()
        new_commit_sha = commit_res.json()['sha']

        # 6) update ref to new commit
        update_ref = requests.patch(
            f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
            headers=github_headers(token),
            json={ 'sha': new_commit_sha, 'force': False },
            timeout=15
        )
        update_ref.raise_for_status()

        # Persist commit (URL not known yet)
        SiteDeployment.upsert(str(current_user['_id']), repo, branch, None, new_commit_sha)
        return jsonify({ 'message': 'Pushed', 'commit': new_commit_sha }), 200
    except requests.RequestException as e:
        return jsonify({'message': f'Push failed: {str(e)}'}), 500


@github_bp.route('/deploy', methods=['POST'])
@token_required
def one_click_deploy(current_user):
    """Create repo if missing, push files, enable pages, and return URL."""
    body = request.get_json(silent=True) or {}
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']
    owner = token_doc.get('login')

    repo = body.get('repo', 'skillslate-portfolio')
    branch = body.get('branch', 'main')
    path = body.get('path', '/')
    files = body.get('files', [])
    message = body.get('message', 'Deploy portfolio')

    if not isinstance(files, list) or len(files) == 0:
        return jsonify({'message': 'Missing files'}), 400

    try:
        print(f"\n🚀 Starting deployment to {owner}/{repo}")
        
        # Ensure repo exists
        info = requests.get(f'https://api.github.com/repos/{owner}/{repo}', headers=github_headers(token), timeout=15)
        repo_exists = info.status_code == 200
        
        if info.status_code == 404:
            print(f"📦 Repository doesn't exist, creating: {repo}")
            create = requests.post(
                'https://api.github.com/user/repos',
                headers=github_headers(token),
                json={ 'name': repo, 'private': False, 'has_issues': False, 'has_wiki': False, 'auto_init': True },
                timeout=15
            )
            if create.status_code == 422:
                # Repository name already taken - might exist but initial check failed
                # Try to get repo info again
                print(f"⚠️ 422 Error - repository might already exist, checking again...")
                info_retry = requests.get(f'https://api.github.com/repos/{owner}/{repo}', headers=github_headers(token), timeout=15)
                if info_retry.status_code == 200:
                    print(f"✅ Repository already exists, proceeding with update")
                    repo_exists = True
                else:
                    # Repository truly doesn't exist and name is invalid
                    error_data = create.json()
                    print(f"❌ 422 Error creating repository: {error_data}")
                    error_msg = error_data.get('message', 'Repository name is invalid')
                    if 'errors' in error_data:
                        errors = error_data['errors']
                        if isinstance(errors, list) and len(errors) > 0:
                            error_msg = errors[0].get('message', error_msg)
                    return jsonify({'message': f'Repository creation failed: {error_msg}'}), 422
            elif create.status_code not in (200, 201):
                create.raise_for_status()
            else:
                print(f"✅ Repository created successfully")
                # Wait a bit for GitHub to initialize the repo
                import time
                time.sleep(2)
                repo_exists = False
        elif info.status_code == 200:
            print(f"✅ Repository already exists, will update it")
            repo_exists = True
        else:
            print(f"❌ Error checking repository: {info.status_code}")
            info.raise_for_status()

        # 1) Create blobs for all files first
        print(f"📝 Creating blobs for {len(files)} file(s)")
        blob_shas = {}
        for f in files:
            blob = requests.post(
                f'https://api.github.com/repos/{owner}/{repo}/git/blobs',
                headers=github_headers(token),
                json={ 'content': f.get('content', ''), 'encoding': f.get('encoding', 'utf-8') },
                timeout=15
            )
            blob.raise_for_status()
            blob_shas[f['path']] = blob.json()['sha']
        print(f"✅ Created {len(blob_shas)} blob(s)")

        # 2) Check if branch exists
        print(f"🔍 Checking if branch '{branch}' exists")
        ref_res = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
            headers=github_headers(token), timeout=15
        )
        
        branch_exists = ref_res.status_code == 200
        parent_sha = None
        base_tree_sha = None
        
        if branch_exists:
            print(f"✅ Branch '{branch}' exists, will update it")
            # Branch exists - get current HEAD
            parent_sha = ref_res.json()['object']['sha']
            # Get the tree from current commit
            commit_res = requests.get(
                f'https://api.github.com/repos/{owner}/{repo}/git/commits/{parent_sha}',
                headers=github_headers(token), timeout=15
            )
            commit_res.raise_for_status()
            base_tree_sha = commit_res.json()['tree']['sha']
        else:
            print(f"📝 Branch '{branch}' doesn't exist, will create it")
        
        # 3) Create tree
        print(f"🌳 Creating git tree")
        tree_items = [{ 'path': p, 'mode': '100644', 'type': 'blob', 'sha': sha } for p, sha in blob_shas.items()]
        tree_json = { 'tree': tree_items }
        if base_tree_sha:
            tree_json['base_tree'] = base_tree_sha
            
        tree_res = requests.post(
            f'https://api.github.com/repos/{owner}/{repo}/git/trees',
            headers=github_headers(token),
            json=tree_json,
            timeout=15
        )
        tree_res.raise_for_status()
        tree_sha = tree_res.json()['sha']

        # 4) Create commit
        commit_json = { 'message': message, 'tree': tree_sha }
        if parent_sha:
            commit_json['parents'] = [parent_sha]
            
        commit_res = requests.post(
            f'https://api.github.com/repos/{owner}/{repo}/git/commits',
            headers=github_headers(token),
            json=commit_json,
            timeout=15
        )
        commit_res.raise_for_status()
        new_commit_sha = commit_res.json()['sha']

        # 5) Create or update branch reference
        if branch_exists:
            # Update existing branch
            update_ref = requests.patch(
                f'https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}',
                headers=github_headers(token),
                json={ 'sha': new_commit_sha, 'force': True },
                timeout=15
            )
            update_ref.raise_for_status()
        else:
            # Create new branch
            create_ref = requests.post(
                f'https://api.github.com/repos/{owner}/{repo}/git/refs',
                headers=github_headers(token),
                json={ 'ref': f'refs/heads/{branch}', 'sha': new_commit_sha },
                timeout=15
            )
            create_ref.raise_for_status()

        # Enable Pages - with retry for new repositories
        print(f"📄 Enabling GitHub Pages for {owner}/{repo} on branch {branch}")
        import time
        
        pages_enabled = False
        max_retries = 2
        
        for attempt in range(max_retries):
            pages = requests.post(
                f'https://api.github.com/repos/{owner}/{repo}/pages',
                headers=github_headers(token),
                json={ 'source': { 'branch': branch, 'path': path }, 'build_type': 'legacy' },
                timeout=15
            )
            
            if pages.status_code in (201, 204):
                print(f"✅ Pages enabled successfully: {pages.status_code}")
                pages_enabled = True
                break
            elif pages.status_code == 409:
                print(f"✅ Pages already enabled (409)")
                pages_enabled = True
                break
            elif pages.status_code == 404 and attempt < max_retries - 1:
                print(f"⚠️ Pages API returned 404 (attempt {attempt + 1}/{max_retries}), waiting 2 seconds...")
                time.sleep(2)
            elif pages.status_code == 422:
                # Validation failed - try checking if pages already exists
                print(f"⚠️ 422 Error - checking if Pages already enabled...")
                pages_check = requests.get(
                    f'https://api.github.com/repos/{owner}/{repo}/pages',
                    headers=github_headers(token),
                    timeout=15
                )
                if pages_check.status_code == 200:
                    print(f"✅ Pages already enabled")
                    pages_enabled = True
                    break
            else:
                print(f"⚠️ Pages enable returned {pages.status_code}: {pages.text}")
        
        if not pages_enabled:
            print(f"⚠️ Could not automatically enable Pages, but deployment succeeded")
            print(f"ℹ️ Pages will be available once GitHub processes the repository")

        url = f'https://{owner}.github.io/{repo}/' if path == '/' else f'https://{owner}.github.io/{repo}{path}'
        print(f"🌐 Deployment URL: {url}")
        # Persist URL (last commit already stored by push)
        SiteDeployment.upsert(str(current_user['_id']), repo, branch, url, None)
        return jsonify({ 'message': 'Deployed', 'url': url }), 200
    
    except requests.RequestException as e:
        return jsonify({'message': f'Deploy failed: {str(e)}'}), 500


@github_bp.route('/status', methods=['GET'])
@token_required
def pages_status(current_user):
    repo = request.args.get('repo')
    if not repo:
        return jsonify({'message': 'Missing repo'}), 400
    token_doc = GitHubTokenStore.get_for_user(str(current_user['_id']))
    if not token_doc:
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']
    owner = token_doc.get('login')
    try:
        res = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/pages',
            headers=github_headers(token), timeout=15
        )
        if res.status_code == 404:
            return jsonify({'enabled': False}), 200
        res.raise_for_status()
        data = res.json()
        saved = SiteDeployment.get(str(current_user['_id']), repo)
        return jsonify({
            'enabled': True,
            'status': data.get('status'),
            'cname': data.get('cname'),
            'html_url': data.get('html_url'),
            'last_commit': (saved or {}).get('lastCommit'),
            'url': (saved or {}).get('url')
        }), 200
    except requests.RequestException as e:
        return jsonify({'message': f'Fetch pages status failed: {str(e)}'}), 500


