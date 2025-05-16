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
        this._coins = 0;
        this.observers = [];
        this.cleanupUI();
    }

    get state() {
        return this._state;
    }

    set state(newState) {
        if (this._state !== newState) {
            this._state = newState;
            this.notifyObservers();
        }
    }

    get score() {
        return this._score;
    }

    get highScore() {
        return this._highScore;
    }

    get coins() {
        return this._coins;
    }

    set coins(value) {
        this._coins = value;
        this.notifyObservers();
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
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
        this._coins = 0;
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
        try {
            return parseInt(localStorage.getItem('highScore') || '0', 10);
        } catch (e) {
            console.warn('Could not load high score from localStorage', e);
            return 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('highScore', this._highScore.toString());
        } catch (e) {
            console.warn('Could not save high score to localStorage', e);
        }
    }

    cleanupUI() {
        // Remove any existing UI elements
        document.querySelectorAll('.game-score, .game-over').forEach(el => el.remove());
    }
} 