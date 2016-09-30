from models import (
    Game,
    GameForm, 
    NewGameForm, 
    MakeMoveForm, 
    User, 
    Score, 
    ScoreForm, 
    ScoreForms, 
    UserGameForm, 
    UserGameForms, 
    HighScoreForm, 
    HighScoreForms, 
    GameHistoryForm, 
    RankingForm, 
    RankingForms
    )

from utils import get_by_urlsafe

USER_REQUEST = endpoints.ResourceContainer(name=messages.StringField(1), email=messages.StringField(2))
NEW_GAME_REQUEST = endpoints.ResourceContainer(NewGameForm)
MAKE_MOVE_REQUEST = endpoints.ResourceContainer(
    MakeMoveForm,
    urlsafe_game_key=messages.StringField(1),)
GET_GAME_REQUEST = endpoints.ResourceContainer(
        urlsafe_game_key=messages.StringField(1),)
CANCEL_GAME_REQUEST = endpoints.ResourceContainer(urlsafe_game_key=messages.StringField(1))
GET_HIGH_SCORES_REQUEST = endpoints.ResourceContainer(top=messages.IntegerField(1))
GET_RANKINGS_REQUEST = endpoints.ResourceContainer(top=messages.IntegerField(1))

class JSONMessage(messages.Message):
    message = messages.StringField(1)

@endpoints.api(name='hangman', version='v1')
class HangmanApi(remote.Service):
    @endpoints.method(USER_REQUEST,JSONMessage,name='create_user',path='users',http_method='POST')
    def create_user(self, request):
    	if User.query(User.name == request.name).get():
    		raise endpoints.ConflictException('A User with that name already exists!')
    	user = User(name=request.name,wins=0,email=request.email)
    	user.put()
    	return JSONMessage(message="User {} added!".format(request.name))
   
    @endpoints.method(request_message=NEW_GAME_REQUEST,
                  response_message=GameForm,
                  path='game',
                  name='new_game',
                  http_method='POST')
    def new_game(self, request):
        user = User.query(User.name == request.user_name).get()
        if not user:
            raise endpoints.NotFoundException(
                    'Username not found!!!')
        try:
            game = Game.new_game(user.key)
        except ValueError:
            raise endpoints.BadRequestException('Maximum must be greater than minimum!')

        return game.to_form('Your target word has {} letters! Good luck playing Guess a word!'.format(len(game.target)))

    @endpoints.method(request_message=MAKE_MOVE_REQUEST,
                  response_message=GameForm,
                  path='game/{urlsafe_game_key}/move',
                  name='make_move',
                  http_method='PUT')
    def make_move(self, request):
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        incorrectString = str("".join(game.incorrect))
        correctString = str("".join(game.correct))
        correctTarget = str(game.target.upper())
        if game.game_over:
            return game.to_form('Game over!')

        while correctString != correctTarget:

            if len(request.guess) != 1:
                return game.to_form('One at a time please!')

            if request.guess.isdigit():
                return game.to_form('Only Letters!!!')

            if request.guess.upper() in correctString:
                return game.to_form("Already attempted!!!")

            if request.guess.upper() in incorrectString:
                return game.to_form("Already attempted!!!")

            if request.guess in game.target:
                for i, c in enumerate(game.target):
                    if c == request.guess:
                        game.correct[i] = request.guess.upper()                         
                
                if (str("".join(game.correct))) == (str(game.target.upper())):
                    game.all_guesses.append('Correctly guessed {} and found {} to win the game!'.format(request.guess.upper(),game.target.upper()))
                    game.score += game.attempts_remaining
                    game.win_loss = "WIN"
                    score = Score(user=game.user,game=game.key,win_loss=game.win_loss,score=game.score)
                    win_user = User.query(User.key == game.user).get()
                    win_user.wins += 1
                    win_user.put()
                    score.put()
                    game.put()
                    game.end_game(False)
                    return game.to_form("Congratulations! You guess the word {}. You're a winner!".format(str(game.target.upper())))

                game.all_guesses.append('Correctly guessed {}'.format(request.guess.upper()))
                game.score += (game.attempts_allowed-(len(game.incorrect)/2))
                game.put()
                return game.to_form("You found a letter in the word! So far you've found {}!".format(str("".join(game.correct))))

            game.attempts_remaining -= 1
            if game.attempts_remaining < 1:
                game.all_guesses.append(str('Incorrectly guessed {} and lost the game'.format(request.guess.upper())))
                game.end_game(False)
                game.score -= game.attempts_remaining
                game.win_loss = "LOSS"
                game.put()
                score = Score(user=game.user,game=game.key,win_loss=game.win_loss,score=game.score)
                score.put()
                return game.to_form('Game Over you did not guess the word {} in the allowed {} attemps! Try again, start a new game.'.format(str(game.target.upper()),game.attempts_allowed))

            else:
                game.incorrect += str(request.guess.upper())
                game.incorrect += str('|')
                game.all_guesses.append(str('Incorrectly guessed {}'.format(request.guess.upper())))
                if game.score<=0:
                    game.score += 0
                if (game.score - (game.attempts_allowed-(len(game.incorrect)/2))) <= 0:
                    game.score = 0
                else:
                    game.score -= (game.attempts_allowed-(len(game.incorrect)/2))
                game.put()
                return game.to_form('Try Again, {} not in the target word! You have incorrectly guessed {} so far.'.format(str(request.guess.upper()),str("".join(game.incorrect))))
        
        else:
            game.all_guesses.append(str('Correctly guessed {} and won the game'.format(request.guess.upper())))
            game.end_game(False)
            game.put()
            score = Score(user=game.user,game=game.key,win_loss=game.win_loss,score=game.score)
            score.put()
            return game.to_form("Congratulations! You guess the word {}. You're a winner!".format(str(game.target.upper())))

    @endpoints.method(request_message=GET_GAME_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}/get',
                      name='get_game',
                      http_method='GET')
    def get_game(self, request):
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if game.game_over:
            return game.to_form('Game Found, but its over!!!')
        elif not game.game_over:
            return game.to_form('Game Found, Go ahead!!!')
        else:
            raise endpoints.NotFoundException('Sorry!!!!')

    @endpoints.method(request_message=CANCEL_GAME_REQUEST,
                      response_message=GameForm,
                      path='game/{urlsafe_game_key}/cancel',
                      name='cancel_game',
                      http_method='PUT')
    def cancel_game(self, request):
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if game and not game.game_over:
            game.end_game(False)
            game.win_loss = "CANCELED"
            game.put()
            return game.to_form('Game has been cancelled')
        if game and game.game_over:
            return game.to_form('Not a active game. You can only cancel active games!!!')
        else:
            raise endpoints.NotFoundException('Game not found!')

    @endpoints.method(response_message=ScoreForms,
                      path='scores',
                      name='get_scores',
                      http_method='GET')
    def get_scores(self, request):
        return ScoreForms(items=[score.to_form() for score in Score.query()])

    @endpoints.method(request_message=USER_REQUEST,
                      response_message=ScoreForms,
                      path='scores/user/{name}',
                      name='get_user_scores',
                      http_method='GET')
    def get_user_scores(self, request):
        user = User.query(User.name == request.name).get()
        if not user:
            raise endpoints.NotFoundException(
                    'Username not found !!!')
        scores = Score.query(Score.user == user.key)
        return ScoreForms(items=[score.to_form() for score in scores])

    @endpoints.method(request_message=USER_REQUEST,
                      response_message=UserGameForms,
                      path='games/user/{name}',
                      name='get_user_games',
                      http_method='GET')
    def get_user_games(self, request):
        user = User.query(User.name == request.name).get()
        if not user:
            raise endpoints.NotFoundException(
                    'Username not found !!!')
        games = Game.query(Game.user == user.key, Game.game_over == False)
        return UserGameForms(items=[game.to_games_form() for game in games])

    @endpoints.method(request_message = GET_HIGH_SCORES_REQUEST,
                      response_message=HighScoreForms,
                      path='scores/highscores/{top}',
                      name='get_high_scores',
                      http_method='GET')
    def get_high_scores(self, request):
        number_of_results = request.top
        return HighScoreForms(items=[score.to_highform() for score in Score.query().order(-Score.score).fetch(number_of_results, offset=0)])

    @endpoints.method(request_message = GET_RANKINGS_REQUEST,
                      response_message=RankingForms,
                      path='users/ranks/{top}',
                      name='get_user_rankings',
                      http_method='GET')
    def get_user_rankings(self, request):
        number_of_results = request.top
        return RankingForms(items=[user.to_rankform() for user in User.query().order(-User.wins).fetch(number_of_results, offset=0)])

    @endpoints.method(request_message=GET_GAME_REQUEST,
                      response_message=GameHistoryForm,
                      path='game/{urlsafe_game_key}/history',
                      name='get_game_history',
                      http_method='GET')
    def get_game_history(self, request):
        game = get_by_urlsafe(request.urlsafe_game_key, Game)
        if not game:
            raise endpoints.NotFoundException('Game not found!')
        else:
            return game.to_history_form()

APPLICATION = endpoints.api_server([HangmanApi])