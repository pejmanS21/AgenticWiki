from datetime import datetime, timezone

from sqlmodel import Session

from app.models.entities import UserSettings


class SettingsRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self) -> UserSettings:
        settings = self.session.get(UserSettings, 1)
        if settings is None:
            settings = UserSettings(id=1)
            self.session.add(settings)
            self.session.commit()
            self.session.refresh(settings)
        return settings

    def update(self, data: dict) -> UserSettings:
        settings = self.get()
        for key, value in data.items():
            setattr(settings, key, value)
        settings.updated_at = datetime.now(timezone.utc)
        self.session.add(settings)
        self.session.commit()
        self.session.refresh(settings)
        return settings

