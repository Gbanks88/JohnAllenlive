from pydantic import BaseModel
from typing import List, Optional, Dict

class UserPreferences(BaseModel):
    theme: str = "light"
    animations_enabled: bool = True
    high_contrast: bool = False
    font_size: str = "medium"
    keyboard_shortcuts: bool = True
    notifications_enabled: bool = True
    saved_opportunities: List[str] = []
    custom_filters: Dict[str, any] = {}
    accessibility_settings: Dict[str, bool] = {
        "screen_reader_optimized": False,
        "reduced_motion": False,
        "high_contrast": False,
        "large_text": False
    }

class PreferencesManager:
    def __init__(self):
        self._preferences = {}  # In-memory storage, replace with database in production

    async def get_preferences(self, user_id: str) -> UserPreferences:
        if user_id not in self._preferences:
            self._preferences[user_id] = UserPreferences()
        return self._preferences[user_id]

    async def update_preferences(self, user_id: str, preferences: UserPreferences):
        self._preferences[user_id] = preferences
        return self._preferences[user_id]

    async def save_opportunity(self, user_id: str, opportunity_id: str):
        if user_id not in self._preferences:
            self._preferences[user_id] = UserPreferences()
        if opportunity_id not in self._preferences[user_id].saved_opportunities:
            self._preferences[user_id].saved_opportunities.append(opportunity_id)
        return self._preferences[user_id]

    async def remove_saved_opportunity(self, user_id: str, opportunity_id: str):
        if user_id in self._preferences:
            if opportunity_id in self._preferences[user_id].saved_opportunities:
                self._preferences[user_id].saved_opportunities.remove(opportunity_id)
        return self._preferences[user_id]

    async def update_accessibility(self, user_id: str, settings: Dict[str, bool]):
        if user_id not in self._preferences:
            self._preferences[user_id] = UserPreferences()
        self._preferences[user_id].accessibility_settings.update(settings)
        return self._preferences[user_id]

    async def set_custom_filters(self, user_id: str, filters: Dict[str, any]):
        if user_id not in self._preferences:
            self._preferences[user_id] = UserPreferences()
        self._preferences[user_id].custom_filters = filters
        return self._preferences[user_id]
