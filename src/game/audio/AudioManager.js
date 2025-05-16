export class AudioManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.volume = 0.7;
        
        this.initSounds();
    }

    initSounds() {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Background music
        this.loadSound('bgMusic', 'assets/audio/background.mp3', true);
        
        // Sound effects
        this.loadSound('jump', 'assets/audio/jump.mp3');
        this.loadSound('doubleJump', 'assets/audio/double_jump.mp3');
        this.loadSound('coin', 'assets/audio/coin.mp3');
        this.loadSound('powerup', 'assets/audio/powerup.mp3');
        this.loadSound('shield', 'assets/audio/shield.mp3');
        this.loadSound('extraLife', 'assets/audio/extra_life.mp3');
        this.loadSound('collision', 'assets/audio/collision.mp3');
        this.loadSound('gameOver', 'assets/audio/game_over.mp3');
    }

    loadSound(name, url, isLoop = false) {
        fetch(url)
            .then(response => {
                // If file not found, create dummy sound to avoid errors
                if (!response.ok) {
                    console.warn(`Sound file not found: ${url}`);
                    this.sounds[name] = {
                        isLoaded: false,
                        play: () => {},
                        stop: () => {}
                    };
                    return null;
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                if (!arrayBuffer) return;
                
                return this.audioContext.decodeAudioData(arrayBuffer);
            })
            .then(audioBuffer => {
                if (!audioBuffer) return;
                
                this.sounds[name] = {
                    buffer: audioBuffer,
                    isLoaded: true,
                    isLoop: isLoop,
                    source: null,
                    gainNode: null,
                    play: () => this.play(name),
                    stop: () => this.stop(name)
                };
                
                // Set background music
                if (name === 'bgMusic') {
                    this.backgroundMusic = this.sounds[name];
                }
            })
            .catch(error => {
                console.error(`Error loading sound ${name}:`, error);
            });
    }

    play(name, volume = this.volume) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (!sound || !sound.isLoaded) return;
        
        // Stop previous playback if exists
        this.stop(name);
        
        // Create source
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = sound.isLoop;
        
        // Create gain node
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Store references
        sound.source = source;
        sound.gainNode = gainNode;
        
        // Play sound
        source.start(0);
    }

    stop(name) {
        const sound = this.sounds[name];
        if (!sound || !sound.source) return;
        
        try {
            sound.source.stop(0);
        } catch (e) {
            // Source already stopped
        }
        
        sound.source = null;
        sound.gainNode = null;
    }

    playCollectible(type) {
        switch(type) {
            case 'coin':
                this.play('coin', 0.5);
                break;
            case 'shield':
                this.play('shield', 0.7);
                break;
            case 'magnet':
            case 'doublePoints':
                this.play('powerup', 0.7);
                break;
            case 'extraLife':
                this.play('extraLife', 0.8);
                break;
        }
    }

    playJump(isDoubleJump = false) {
        if (isDoubleJump) {
            this.play('doubleJump', 0.6);
        } else {
            this.play('jump', 0.5);
        }
    }

    playCollision() {
        this.play('collision', 0.8);
    }

    playGameOver() {
        this.stop('bgMusic');
        this.play('gameOver', 0.8);
    }

    startBackgroundMusic() {
        if (this.backgroundMusic) {
            this.play('bgMusic', 0.4);
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.stop('bgMusic');
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Stop all sounds
            for (const name in this.sounds) {
                this.stop(name);
            }
        } else {
            // Resume background music
            this.startBackgroundMusic();
        }
        
        return this.isMuted;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update volume of currently playing sounds
        for (const name in this.sounds) {
            const sound = this.sounds[name];
            if (sound.gainNode) {
                sound.gainNode.gain.value = this.volume;
            }
        }
    }
} 