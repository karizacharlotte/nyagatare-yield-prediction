"""Database models for farmer accounts and saved predictions."""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    phone         = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    recovery_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    predictions = db.relationship(
        'Prediction', backref='user', lazy=True,
        cascade='all, delete-orphan', order_by='Prediction.created_at.desc()',
    )

    def to_dict(self):
        return {'id': self.id, 'phone': self.phone}


class Prediction(db.Model):
    __tablename__ = 'predictions'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    crop       = db.Column(db.String(10), nullable=False)
    result     = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'crop': self.crop,
            'data': self.result,
            'saved_at': self.created_at.replace(tzinfo=timezone.utc).isoformat(),
        }
