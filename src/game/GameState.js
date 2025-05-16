export const GameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    PAUSED: 'paused'
};

export class GameState {
    constructor() {
        this._state = GameStates.MENU;
        this._score = 0;
        this._highScore = this.loadHighScore();
        this.observers = [];
        this.cleanupUI();
    }

    get state() {
        return this._state;
    }

    get score() {
        return this._score;
    }

    get highScore() {
        return this._highScore;
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notifyObservers() {
        this.observers.forEach(observer => {
            if (observer.onGameStateChanged) {
                observer.onGameStateChanged(this);
            }
        });
    }

    startGame() {
        this._state = GameStates.PLAYING;
        this._score = 0;
        this.notifyObservers();
    }

    pauseGame() {
        if (this._state === GameStates.PLAYING) {
            this._state = GameStates.PAUSED;
            this.notifyObservers();
        }
    }

    resumeGame() {
        if (this._state === GameStates.PAUSED) {
            this._state = GameStates.PLAYING;
            this.notifyObservers();
        }
    }

    gameOver() {
        this._state = GameStates.GAME_OVER;
        if (this._score > this._highScore) {
            this._highScore = this._score;
            this.saveHighScore();
        }
        this.notifyObservers();
    }

    addScore(points) {
        if (this._state === GameStates.PLAYING) {
            this._score += points;
            this.notifyObservers();
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('highScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('highScore', this._highScore.toString());
    }

    cleanupUI() {
        // Remove any existing UI elements
        document.querySelectorAll('.game-score, .game-over').forEach(el => el.remove());
    }
} 