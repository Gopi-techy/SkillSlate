from datetime import datetime
from bson import ObjectId
from config.database import db_instance


class GitHubTokenStore:
    @staticmethod
    def collection():
        return db_instance.get_collection('github_tokens')

    @staticmethod
    def upsert_for_user(user_id: str, access_token: str, token_type: str = 'bearer', scope: str | None = None, login: str | None = None):
        col = GitHubTokenStore.collection()
        col.update_one(
            { 'userId': ObjectId(user_id) },
            { '$set': {
                'accessToken': access_token,
                'tokenType': token_type,
                'scope': scope,
                'login': login,
                'updatedAt': datetime.utcnow()
            }, '$setOnInsert': {
                'createdAt': datetime.utcnow()
            }},
            upsert=True
        )

    @staticmethod
    def get_for_user(user_id: str):
        col = GitHubTokenStore.collection()
        doc = col.find_one({ 'userId': ObjectId(user_id) })
        if not doc:
            return None
        return {
            'access_token': doc.get('accessToken'),
            'token_type': doc.get('tokenType', 'bearer'),
            'scope': doc.get('scope'),
            'login': doc.get('login')
        }

    @staticmethod
    def delete_for_user(user_id: str):
        """Delete a user's GitHub token."""
        col = GitHubTokenStore.collection()
        return col.delete_one({ 'userId': ObjectId(user_id) })

