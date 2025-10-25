from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from models.portfolio import Portfolio
from models.user import User
from utils.validators import validate_auth_token
import jwt
import os

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')

@portfolio_bp.route('/', methods=['GET'])
@validate_auth_token
def get_portfolios(current_user):
    """Get all portfolios for the current user"""
    try:
        portfolios = Portfolio.find_by_user_id(current_user['user_id'])
        portfolio_list = [Portfolio.to_dict(portfolio) for portfolio in portfolios]
        
        return jsonify({
            'success': True,
            'portfolios': portfolio_list,
            'count': len(portfolio_list)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch portfolios',
            'error': str(e)
        }), 500

@portfolio_bp.route('/', methods=['POST'])
@validate_auth_token
def create_portfolio(current_user):
    """Create a new portfolio"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Portfolio name is required'
            }), 400
        
        if not data.get('template'):
            return jsonify({
                'success': False,
                'message': 'Template is required'
            }), 400
        
        # Check portfolio limit (2 for GitHub Pages)
        portfolio_count = Portfolio.count_by_user(current_user['user_id'])
        if portfolio_count >= 2:
            return jsonify({
                'success': False,
                'message': 'Portfolio limit reached. Maximum 2 portfolios allowed with GitHub Pages.',
                'code': 'PORTFOLIO_LIMIT_REACHED'
            }), 400
        
        # Create portfolio
        portfolio = Portfolio(
            user_id=current_user['user_id'],
            name=data['name'],
            template=data['template'],
            status=data.get('status', 'draft'),
            url=data.get('url'),
            github_repo=data.get('githubRepo')
        )
        
        portfolio_id = portfolio.save()
        
        return jsonify({
            'success': True,
            'message': 'Portfolio created successfully',
            'portfolio': {
                'id': str(portfolio_id),
                'name': portfolio.name,
                'template': portfolio.template,
                'status': portfolio.status
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to create portfolio',
            'error': str(e)
        }), 500

@portfolio_bp.route('/<portfolio_id>', methods=['GET'])
@validate_auth_token
def get_portfolio(current_user, portfolio_id):
    """Get a specific portfolio"""
    try:
        portfolio = Portfolio.find_by_id_and_user(portfolio_id, current_user['user_id'])
        
        if not portfolio:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found'
            }), 404
        
        return jsonify({
            'success': True,
            'portfolio': Portfolio.to_dict(portfolio)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch portfolio',
            'error': str(e)
        }), 500

@portfolio_bp.route('/<portfolio_id>', methods=['PUT'])
@validate_auth_token
def update_portfolio(current_user, portfolio_id):
    """Update a portfolio"""
    try:
        portfolio = Portfolio.find_by_id_and_user(portfolio_id, current_user['user_id'])
        
        if not portfolio:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found'
            }), 404
        
        data = request.get_json()
        
        # Update portfolio fields
        if 'name' in data:
            portfolio['name'] = data['name']
        if 'template' in data:
            portfolio['template'] = data['template']
        if 'status' in data:
            portfolio['status'] = data['status']
        if 'url' in data:
            portfolio['url'] = data['url']
        if 'githubRepo' in data:
            portfolio['githubRepo'] = data['githubRepo']
        
        portfolio['updatedAt'] = datetime.utcnow()
        
        # Update in database
        collection = Portfolio.get_collection()
        collection.update_one(
            {'_id': ObjectId(portfolio_id)},
            {'$set': portfolio}
        )
        
        return jsonify({
            'success': True,
            'message': 'Portfolio updated successfully',
            'portfolio': Portfolio.to_dict(portfolio)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to update portfolio',
            'error': str(e)
        }), 500

@portfolio_bp.route('/<portfolio_id>', methods=['DELETE'])
@validate_auth_token
def delete_portfolio(current_user, portfolio_id):
    """Delete a portfolio"""
    try:
        success = Portfolio.delete_portfolio(portfolio_id, current_user['user_id'])
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found or not owned by user'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Portfolio deleted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to delete portfolio',
            'error': str(e)
        }), 500

@portfolio_bp.route('/<portfolio_id>/deploy', methods=['POST'])
@validate_auth_token
def deploy_portfolio(current_user, portfolio_id):
    """Deploy a portfolio to GitHub Pages"""
    try:
        portfolio = Portfolio.find_by_id_and_user(portfolio_id, current_user['user_id'])
        
        if not portfolio:
            return jsonify({
                'success': False,
                'message': 'Portfolio not found'
            }), 404
        
        # Check if user has GitHub connected
        user = User.find_by_id(current_user['user_id'])
        if not user or not user.get('githubConnected'):
            return jsonify({
                'success': False,
                'message': 'GitHub account not connected. Please connect your GitHub account first.',
                'code': 'GITHUB_NOT_CONNECTED'
            }), 400
        
        # Update portfolio status to building
        Portfolio.update_status(portfolio_id, 'building')
        
        # TODO: Implement actual GitHub Pages deployment
        # For now, simulate deployment
        import time
        time.sleep(2)  # Simulate deployment time
        
        # Generate a mock URL
        portfolio_name = portfolio['name'].lower().replace(' ', '-')
        mock_url = f"https://{current_user['email'].split('@')[0]}.github.io/{portfolio_name}"
        
        # Update portfolio with deployed status
        Portfolio.update_status(portfolio_id, 'deployed', url=mock_url)
        
        return jsonify({
            'success': True,
            'message': 'Portfolio deployed successfully',
            'url': mock_url
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to deploy portfolio',
            'error': str(e)
        }), 500

@portfolio_bp.route('/stats', methods=['GET'])
@validate_auth_token
def get_portfolio_stats(current_user):
    """Get portfolio statistics for the user"""
    try:
        portfolios = Portfolio.find_by_user_id(current_user['user_id'])
        
        total_count = len(portfolios)
        deployed_count = len([p for p in portfolios if p['status'] == 'deployed'])
        draft_count = len([p for p in portfolios if p['status'] == 'draft'])
        building_count = len([p for p in portfolios if p['status'] == 'building'])
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total_count,
                'deployed': deployed_count,
                'draft': draft_count,
                'building': building_count,
                'maxAllowed': 2,
                'remaining': max(0, 2 - total_count)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch portfolio stats',
            'error': str(e)
        }), 500
