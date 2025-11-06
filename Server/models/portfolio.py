from datetime import datetime
from bson import ObjectId
from config.database import db_instance

class Portfolio:
    def __init__(self, user_id, name, template, status='draft', url=None, github_repo=None, data=None, html=None):
        self.user_id = user_id
        self.name = name
        self.template = template
        self.status = status  # 'draft', 'building', 'deployed', 'failed'
        self.url = url
        self.github_repo = github_repo
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.last_deployed = None
        self.content = None  # Portfolio content/HTML (deprecated, use html)
        self.data = data  # Structured portfolio data (JSON)
        self.html = html  # Generated HTML
        self.settings = {}  # Portfolio settings and configuration
    
    @staticmethod
    def get_collection():
        """Get the portfolios collection"""
        return db_instance.get_collection('portfolios')
    
    def save(self):
        """Save portfolio to database"""
        portfolio_doc = {
            'userId': ObjectId(self.user_id),
            'name': self.name,
            'template': self.template,
            'status': self.status,
            'url': self.url,
            'githubRepo': self.github_repo,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at,
            'lastDeployed': self.last_deployed,
            'content': self.content,
            'data': self.data,
            'html': self.html,
            'settings': self.settings
        }
        
        collection = self.get_collection()
        result = collection.insert_one(portfolio_doc)
        return result.inserted_id
    
    @staticmethod
    def find_by_user_id(user_id):
        """Find all portfolios for a user"""
        collection = Portfolio.get_collection()
        return list(collection.find({'userId': ObjectId(user_id)}).sort('createdAt', -1))
    
    @staticmethod
    def find_by_id(portfolio_id):
        """Find portfolio by ID"""
        collection = Portfolio.get_collection()
        return collection.find_one({'_id': ObjectId(portfolio_id)})
    
    @staticmethod
    def find_by_id_and_user(portfolio_id, user_id):
        """Find portfolio by ID and user ID (for security)"""
        collection = Portfolio.get_collection()
        return collection.find_one({
            '_id': ObjectId(portfolio_id),
            'userId': ObjectId(user_id)
        })
    
    @staticmethod
    def update_status(portfolio_id, status, url=None, github_repo=None):
        """Update portfolio status"""
        collection = Portfolio.get_collection()
        update_data = {
            'status': status,
            'updatedAt': datetime.utcnow()
        }
        
        if url:
            update_data['url'] = url
        if github_repo:
            update_data['githubRepo'] = github_repo
        if status == 'deployed':
            update_data['lastDeployed'] = datetime.utcnow()
        
        collection.update_one(
            {'_id': ObjectId(portfolio_id)},
            {'$set': update_data}
        )
    
    @staticmethod
    def update_content(portfolio_id, content, settings=None):
        """Update portfolio content"""
        collection = Portfolio.get_collection()
        update_data = {
            'content': content,
            'updatedAt': datetime.utcnow()
        }
        
        if settings:
            update_data['settings'] = settings
        
        collection.update_one(
            {'_id': ObjectId(portfolio_id)},
            {'$set': update_data}
        )
    
    @staticmethod
    def update_portfolio(portfolio_id, update_data):
        """Update portfolio with custom data"""
        collection = Portfolio.get_collection()
        update_data['updatedAt'] = datetime.utcnow()
        
        collection.update_one(
            {'_id': ObjectId(portfolio_id)},
            {'$set': update_data}
        )
    
    @staticmethod
    def delete_portfolio(portfolio_id, user_id):
        """Delete portfolio (only if owned by user)"""
        collection = Portfolio.get_collection()
        result = collection.delete_one({
            '_id': ObjectId(portfolio_id),
            'userId': ObjectId(user_id)
        })
        return result.deleted_count > 0
    
    @staticmethod
    def count_by_user(user_id):
        """Count portfolios for a user"""
        collection = Portfolio.get_collection()
        return collection.count_documents({'userId': ObjectId(user_id)})
    
    @staticmethod
    def to_dict(portfolio_doc, include_html=False):
        """Convert portfolio document to dictionary"""
        if not portfolio_doc:
            return None
        
        result = {
            'id': str(portfolio_doc['_id']),
            'userId': str(portfolio_doc['userId']),
            'name': portfolio_doc['name'],
            'template': portfolio_doc['template'],
            'status': portfolio_doc['status'],
            'url': portfolio_doc.get('url'),
            'githubRepo': portfolio_doc.get('githubRepo'),
            'createdAt': portfolio_doc.get('createdAt', '').isoformat() if portfolio_doc.get('createdAt') else None,
            'updatedAt': portfolio_doc.get('updatedAt', '').isoformat() if portfolio_doc.get('updatedAt') else None,
            'lastDeployed': portfolio_doc.get('lastDeployed', '').isoformat() if portfolio_doc.get('lastDeployed') else None,
            'settings': portfolio_doc.get('settings', {})
        }
        
        # Include HTML content if requested
        if include_html:
            result['html'] = portfolio_doc.get('html')
            result['content'] = portfolio_doc.get('content')
            result['data'] = portfolio_doc.get('data')
        
        return result
