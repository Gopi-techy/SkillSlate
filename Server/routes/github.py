from flask import Blueprint, request, jsonify
import os
import requests
from functools import wraps
from routes.auth import token_required  # reuse existing auth decorator
from models.github_token import GitHubTokenStore
from models.user import User
from models.site_deployment import SiteDeployment

github_bp = Blueprint('github', __name__, url_prefix='/api/github')


def get_github_oauth_config():
    return {
        'client_id': os.environ.get('GITHUB_CLIENT_ID', ''),
        'client_secret': os.environ.get('GITHUB_CLIENT_SECRET', ''),
        'redirect_uri': os.environ.get('GITHUB_REDIRECT_URI', 'http://localhost:5000/api/github/callback'),
        'scopes': os.environ.get('GITHUB_SCOPES', 'repo,workflow,pages:write')
    }


@github_bp.route('/authorize', methods=['GET'])
def authorize():
    cfg = get_github_oauth_config()
    state = request.args.get('state')
    authorize_url = (
        'https://github.com/login/oauth/authorize'
        f"?client_id={cfg['client_id']}"
        f"&redirect_uri={cfg['redirect_uri']}"
        f"&scope={cfg['scopes']}"
        f"&state={state or ''}"
        '&allow_signup=true'
    )
    return jsonify({'url': authorize_url})


@github_bp.route('/callback', methods=['GET'])
def callback():
    code = request.args.get('code')
    state = request.args.get('state')
    if not code:
        return jsonify({'message': 'Missing code'}), 400

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
        res = requests.post(token_url, headers=headers, json=payload, timeout=15)
        res.raise_for_status()
        data = res.json()
        access_token = data.get('access_token')
        token_type = data.get('token_type', 'bearer')
        if not access_token:
            return jsonify({'message': 'Failed to exchange code for token', 'details': data}), 400
        # Echo state back for client-side validation/binding to the session
        return jsonify({'message': 'GitHub token issued', 'token_type': token_type, 'access_token': access_token, 'state': state})
    except requests.RequestException as e:
        return jsonify({'message': f'GitHub token exchange failed: {str(e)}'}), 500


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
        return jsonify({'message': 'GitHub not linked'}), 400
    token = token_doc['access_token']
    try:
        res = requests.get('https://api.github.com/user', headers=github_headers(token), timeout=15)
        res.raise_for_status()
        return jsonify(res.json()), 200
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
        # Ensure repo exists
        info = requests.get(f'https://api.github.com/repos/{owner}/{repo}', headers=github_headers(token), timeout=15)
        if info.status_code == 404:
            create = requests.post(
                'https://api.github.com/user/repos',
                headers=github_headers(token),
                json={ 'name': repo, 'private': False, 'has_issues': False, 'has_wiki': False },
                timeout=15
            )
            create.raise_for_status()
        elif not info.ok:
            info.raise_for_status()

        # Push files
        push_res = push_static_site(current_user)
        if push_res[1] >= 400:
            return push_res

        # Enable Pages
        pages = requests.put(
            f'https://api.github.com/repos/{owner}/{repo}/pages',
            headers=github_headers(token),
            json={ 'source': { 'branch': branch, 'path': path } },
            timeout=15
        )
        if pages.status_code not in (201, 202):
            return jsonify({'message': 'Enable pages failed', 'details': pages.text}), pages.status_code

        url = f'https://{owner}.github.io/{repo}/' if path == '/' else f'https://{owner}.github.io/{repo}{path}'
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


