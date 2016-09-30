"""models.py - This file contains the class definitions for the Datastore
entities used by the Game. Because these classes are also regular Python
classes they can include methods (such as 'to_form' and 'new_game')."""

import random
from google.appengine.ext import ndb
from protorpc import messages

class User(ndb.Model):
    """User profile"""
    name = ndb.StringProperty(required=True)
    wins = ndb.IntegerProperty(required=False)
    email = ndb.StringProperty(required=False)

    def to_rankform(self):
        return RankingForm(user=self.name, wins=self.wins)

class Score(ndb.Model):
    """Scoreboard object"""
    user = ndb.KeyProperty(required=True, kind='User')
    game = ndb.KeyProperty(required=True, kind='Game')
    win_loss = ndb.StringProperty(required=True)
    score = ndb.IntegerProperty(required=True)

    def to_form(self):
        return ScoreForm(user=self.user.get().name, game=str(self.game.urlsafe()), win_loss=self.win_loss, score=self.score)

    def to_highform(self):
        return HighScoreForm(user=self.user.get().name, score=self.score)




class Game(ndb.Model):
    """Game object"""
    target = ndb.StringProperty(required=True)
    attempts_allowed = ndb.IntegerProperty(required=True)
    attempts_remaining = ndb.IntegerProperty(required=True, default=5)
    game_over = ndb.BooleanProperty(required=True, default=False)
    win_loss = ndb.StringProperty(required=True, default="ACTIVE")
    user = ndb.KeyProperty(required=True, kind='User')
    correct = ndb.StringProperty(repeated=True)
    incorrect = ndb.StringProperty(repeated=True)
    all_guesses = ndb.StringProperty(repeated=True)
    score = ndb.IntegerProperty(required=True)

    @classmethod
    def new_game(cls, user):
        words = ["mackintoshm","adoptivelya","backgroundb","carbonizedc","deathblowsd","earthbounde","fetchinglyf","godfathersg","handsomelyh","impersonali","jacklightsj","kingcraftsk","labyrinthsl","narcotizedn","obfuscatedo","paintbrushp"]
        target = str(random.choice(words))
        correct = []
        for x in range(len(target)):
            correct.append("*")
        attempts = len(target)*2
        game = Game(user=user,
                    target=target,
                    attempts_allowed=attempts,
                    attempts_remaining=attempts,
                    correct = correct,
                    incorrect = [],
                    all_guesses = [],
                    score = 0,
                    game_over=False)
        game.put()
        return game

    def to_form(self, message):
        form = GameForm()
        form.urlsafe_key = self.key.urlsafe()
        form.user_name = self.user.get().name
        form.attempts_remaining = self.attempts_remaining
        form.score = self.score
        form.game_over = self.game_over
        form.win_loss = self.win_loss
        form.message = message
        return form

    def to_history_form(self):
        form = GameHistoryForm()
        form.urlsafe_key = self.key.urlsafe()
        form.history = self.all_guesses
        return form

    def to_games_form(self):
        return UserGameForm(user=self.user.get().name, game=str(self.key.urlsafe()), game_over=self.game_over)

    def end_game(self, won=False):
        """Ends the game - if won is True, the player won. - if won is False,the player lost."""
        self.game_over = True
        self.put()

class GameForm(messages.Message):
    urlsafe_key = messages.StringField(1, required=True)
    attempts_remaining = messages.IntegerField(2, required=True)
    game_over = messages.BooleanField(3, required=True)
    message = messages.StringField(4, required=True)
    user_name = messages.StringField(5, required=True)
    score = messages.IntegerField(6, required=True)
    win_loss = messages.StringField(7, required=True)

class GameHistoryForm(messages.Message):
    urlsafe_key = messages.StringField(1, required=True)
    history = messages.StringField(2, repeated=True)

class NewGameForm(messages.Message):
    user_name = messages.StringField(1, required=True)

class MakeMoveForm(messages.Message):
    guess = messages.StringField(1, required=True)

class ScoreForm(messages.Message):
    user = messages.StringField(1, required=True)
    game = messages.StringField(2, required=True)
    win_loss = messages.StringField(3, required=True)
    score = messages.IntegerField(4, required=True)

class ScoreForms(messages.Message):
    items = messages.MessageField(ScoreForm, 1, repeated=True)

class UserGameForm(messages.Message):
    user = messages.StringField(1,required=True)
    game = messages.StringField(2,required=True)
    game_over = messages.BooleanField(3,required=True)

class UserGameForms(messages.Message):
    items = messages.MessageField(UserGameForm, 1, repeated=True)

class HighScoreForm(messages.Message):
    user = messages.StringField(1, required=True)
    score = messages.IntegerField(2, required=True)

class HighScoreForms(messages.Message):
    items = messages.MessageField(HighScoreForm,1,repeated=True)

class RankingForm(messages.Message):
    user = messages.StringField(1, required=True)
    wins = messages.IntegerField(2, required=True)

class RankingForms(messages.Message):
    items = messages.MessageField(RankingForm,1,repeated=True)