from datetime import datetime
from bson import ObjectId
from config.database import db_instance


class SiteDeployment:
    @staticmethod
    def collection():
        return db_instance.get_collection('site_deployments')

    @staticmethod
    def upsert(user_id: str, repo: str, branch: str, url: str | None, last_commit: str | None):
        col = SiteDeployment.collection()
        col.update_one(
            { 'userId': ObjectId(user_id), 'repo': repo },
            { '$set': {
                'branch': branch,
                'url': url,
                'lastCommit': last_commit,
                'updatedAt': datetime.utcnow()
            }, '$setOnInsert': {
                'createdAt': datetime.utcnow()
            }},
            upsert=True
        )

    @staticmethod
    def get(user_id: str, repo: str):
        col = SiteDeployment.collection()
        return col.find_one({ 'userId': ObjectId(user_id), 'repo': repo })


