(function () {   
    const CONFIGS = {
        planetDistance: 1000,
        mapWidth: 3000,
        mapHeight: 12000,
        gameWidth: window.innerWidth,
        gameHeight: window.innerHeight,
        skyHeight: 1000,
        groundHeight: 50,
        rocketMaxVelocity: 300,
        rocketAcceleration: 150,
        fuelIncreaseAmount: 10,
        cloudsSpeed: 0.4,
        asteroidsAverageSpeed: 100,
        asteroidsAverageDamage: 10,
        fuelCansAmount: 150,
        asteroidsAmount: 200
    };

    const game = new Phaser.Game(CONFIGS.gameWidth, CONFIGS.gameHeight, Phaser.CANVAS, '', {preload: preload, create: create, update: update, render: render});

    function preload() {
        game.load.audio('openingSound', 'assets/audio/opening.mp3');
        game.load.audio('explosionSound', 'assets/audio/explosion.mp3');
        game.load.audio('fuelCollectionSound', 'assets/audio/fuelCollection.mp3');
        game.load.audio('setFlagSound', 'assets/audio/setFlag.wav');
        game.load.audio('endingSound', 'assets/audio/ending.mp3');

        game.load.image('sky', 'assets/img/sky.jpg');
        game.load.image('space', 'assets/img/space.jpg');
        game.load.image('ground', 'assets/img/ground.png');
        game.load.image('screen', 'assets/img/screen.png');
        game.load.spritesheet('rocket', 'assets/img/rocket-spritesheet.png', 50, 50);
        game.load.spritesheet('asteroid', 'assets/img/asteroid-spritesheet.png', 150, 150);
        game.load.image('fuelBar', 'assets/img/fuelBar.png');
        game.load.spritesheet('fuelCan', 'assets/img/fuelCan-spritesheet.png', 35, 40);
        game.load.image('clouds', 'assets/img/clouds.png');
        game.load.image('flag', 'assets/img/flag.png');
        game.load.image('fuelTrail', 'assets/img/fuelTrail.png');


        game.load.image('mercury', 'assets/img/planets/1-mercury.png');
        game.load.image('venus', 'assets/img/planets/2-venus.png');
        game.load.image('mars', 'assets/img/planets/3-mars.png');
        game.load.image('jupiter', 'assets/img/planets/4-jupiter.png');
        game.load.image('saturn', 'assets/img/planets/5-saturn.png');
        game.load.image('uranus', 'assets/img/planets/6-uranus.png');
        game.load.image('neptune', 'assets/img/planets/7-neptune.png');
        game.load.image('pluto', 'assets/img/planets/8-pluto.png');
        game.load.image('sun', 'assets/img/planets/9-sun.png');
        game.load.image('moon', 'assets/img/planets/10-moon.png');
    }

    let planets;
    let rocket;
    let ground;
    let cursors;
    let fuelBar;
    let fuelCans;
    let asteroids;
    let clouds;
    let moon;
    let flag;
    let emitter;

    let timer;
    let reachMoonText;
    let reachEarthText;
    let winText;
    let gameOverText;

    let fuelCollectionSound;
    let explosionSound;
    let setFlagSound;
    let endingSound;
    let openingSound;

    function create() {
        // general game settings
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.world.setBounds(0, 0, CONFIGS.mapWidth, CONFIGS.mapHeight);
        
        // background
        game.add.tileSprite(0, 0, game.world.width, game.world.height, 'sky');
        game.add.tileSprite(0, 0, game.world.width, game.world.height - CONFIGS.skyHeight, 'space');

        // planets
        planets = game.add.group();
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 2 * CONFIGS.planetDistance, 'mercury');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 3 * CONFIGS.planetDistance, 'venus');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 4 * CONFIGS.planetDistance, 'mars');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 5 * CONFIGS.planetDistance, 'jupiter');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 6 * CONFIGS.planetDistance, 'saturn');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 7 * CONFIGS.planetDistance, 'uranus');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 8 * CONFIGS.planetDistance, 'neptune');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 9 * CONFIGS.planetDistance, 'pluto');
        planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 10 * CONFIGS.planetDistance, 'sun');
        moon = planets.create(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 11 * CONFIGS.planetDistance, 'moon');
        
        planets.children.forEach(el => {
            el.anchor.set(0.5);
            el.scale.setTo(1.5);
        });

        // moon
        game.physics.enable(moon, Phaser.Physics.ARCADE);
        moon.body.setCircle(150, 50, 50);
        
        // flag
        flag = game.add.sprite(moon.x, moon.y, 'flag');
        flag.anchor.set(0.5);
        flag.scale.set(0.5);
        flag.alpha = 0;

        // ground
        ground = game.add.tileSprite(0, game.world.height - CONFIGS.groundHeight, game.world.width, CONFIGS.groundHeight, 'ground');
        game.physics.enable(ground, Phaser.Physics.ARCADE);
        ground.body.immovable = true;
        
        // emitter
        emitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);
        emitter.makeParticles(['fuelTrail']);
        let lifespan = 500;
        emitter.setAlpha(0.8, 0, lifespan);
        emitter.setScale(0.8, 0.3, 0.8, 0.3, lifespan);
        emitter.start(false, lifespan, 0.01);

        // rocket
        rocket = game.add.sprite(CONFIGS.mapWidth / 2, CONFIGS.mapHeight - 75, 'rocket');
        rocket.anchor.set(0.5);
        game.physics.enable(rocket, Phaser.Physics.ARCADE);
        rocket.body.drag.set(35);
        rocket.body.maxVelocity.set(CONFIGS.rocketMaxVelocity);
        rocket.angle = -90;
        rocket.body.collideWorldBounds = true;
        rocket.body.setCircle(10, 15, 15);
        rocket.animations.add('rotation', makeArray(16), 20, true);
        rocket.wentIntoSpace = false;
        rocket.reachedMoon = false;
        rocket.gotBack = false;
        
        // controls
        cursors = game.input.keyboard.createCursorKeys();

        // camera following
        game.camera.follow(rocket);

        // fuel cans
        fuelCans = game.add.group();
        fuelCans.enableBody = true;
        for (let i = 0; i < CONFIGS.fuelCansAmount; i++ ) {
            let fuelCan = fuelCans.create( game.world.randomX, game.world.randomY - 150, 'fuelCan' );
            fuelCan.body.setSize(46, 58, -9, -9);
            fuelCan.animations.add('rotation', [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1], 16, true);
            fuelCan.animations.play('rotation');
        }

        // asteroids
        asteroids = game.add.group();
        asteroids.enableBody = true;
        for (let i = 0; i < CONFIGS.asteroidsAmount; i++ ) {
            let asteroid = asteroids.create( game.world.randomX, game.world.randomY - (CONFIGS.skyHeight + 100), 'asteroid' );
            let size = 0.5 + Math.random();
            asteroid.body.setCircle(25, 51, 51);
            asteroid.anchor.set(0.5);
            asteroid.scale.setTo(size);
            asteroid.destroyed = false;
            asteroid.animations.add('rotation', makeArray(48), 12, true);
            asteroid.animations.add('explosion', [49, 50, 51, 52, 53, 54, 55, 56, 57], 12, false);
            asteroid.animations.play('rotation');
            asteroid.randomRotation = Math.random() * 2 * Math.PI;
            asteroid.randomSpeed = CONFIGS.asteroidsAverageSpeed * ( Math.random() + 1 );
            game.physics.arcade.velocityFromRotation( asteroid.randomRotation, asteroid.randomSpeed, asteroid.body.velocity );
        }

        // clouds
        clouds = game.add.tileSprite(0, CONFIGS.mapHeight - CONFIGS.skyHeight, CONFIGS.mapWidth, 100, 'clouds');
        clouds.scale.setTo(2);
        clouds.anchor.set(0.5);
        
        // fuel bar
        fuelBar = new FuelBar();
        fuelBar.x = 0;
        fuelBar.y = 0;  
        fuelBar.fixedToCamera = true;

        // sounds
        openingSound = game.add.audio('openingSound');
        fuelCollectionSound = game.add.audio('fuelCollectionSound');
        explosionSound = game.add.audio('explosionSound');
        setFlagSound = game.add.audio('setFlagSound');
        endingSound = game.add.audio('endingSound');

        // timer
        const timerStyle = {
            font: '25px Arial', 
            fill: '#fff'
        };
        timer = game.add.text(5, 20, 'Time: ', timerStyle);
        timer.startTime = -1;
        timer.fixedToCamera = true;

        // tasks
        let screen = game.add.sprite(CONFIGS.gameWidth - 3, CONFIGS.gameHeight - 3, 'screen');
        screen.anchor.set(1);
        screen.fixedToCamera = true;

        const reachStyle = {
            font: '20px Arial',
            fill: '#ccc'
        };
        reachMoonText = game.add.text(CONFIGS.gameWidth - 190, CONFIGS.gameHeight - 90, 'reach the moon', reachStyle);
        reachMoonText.fixedToCamera = true;
        reachEarthText = game.add.text(CONFIGS.gameWidth - 190, CONFIGS.gameHeight - 50, 'get back to Earth', reachStyle);
        reachEarthText.fixedToCamera = true;

        // game over text
        const tableStyle = {
            font: '50px Arial',
            fontWeight: 'bold',
            fill: '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            align: 'center'
        };
        gameOverText = game.add.text(game.width / 2, game.height / 2, 'GAME OVER', tableStyle);
        gameOverText.anchor.set(0.5);
        gameOverText.fixedToCamera = true;
        gameOverText.alpha = 0;

        // win text
        winText = game.add.text(game.width / 2, game.height / 2, `You win.`, tableStyle);
        winText.anchor.set(0.5);
        winText.fixedToCamera = true;
        winText.alpha = 0;

        // easy mode
        easyModeKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
        easyModeKey.onDown.add(turnOnEasyMode, this); 
        function turnOnEasyMode() {
            if (timer.startTime < 0 ){  
                asteroids.setAll('body.velocity.x', 0);
                asteroids.setAll('body.velocity.y', 0); 
            }
        }
    }

    function update() {
        // clouds animation
        clouds.x += CONFIGS.cloudsSpeed;
        if (clouds.x > 1000 || clouds.x < 0) {
            CONFIGS.cloudsSpeed = - CONFIGS.cloudsSpeed;
        }

        // rocket animation
        rocket.animations.play('rotation');
        if (rocket.body.velocity.getMagnitude() < 50) {
            rocket.animations.stop('rotation');
        }

        // collision with the ground
        let collisionWithGround = game.physics.arcade.collide(rocket, ground);
        
        // space entering
        if (rocket.y < CONFIGS.mapHeight - CONFIGS.skyHeight) {
            if (rocket.wentIntoSpace === false) {
                openingSound.play('', 0, 0.5);
                rocket.wentIntoSpace = true;    
            }
        }

        // enable controls
        rocket.body.acceleration.set(0);
        rocket.body.angularVelocity = 0;

        if (fuelBar.fuelAmountPercent > 0) {
            if (cursors.up.isDown) {
                game.physics.arcade.accelerationFromRotation(rocket.rotation, CONFIGS.rocketAcceleration, rocket.body.acceleration);
                fuelBar.decreaseFuel(0.2);

                if (timer.startTime < 0) {
                    timer.startTime = Math.floor(game.time.now);
                }
            }
        }

        if (cursors.left.isDown) {
            rocket.body.angularVelocity = -100;
        } else if (cursors.right.isDown) {
            rocket.body.angularVelocity = 100; 
        } else {
            rocket.body.angularVelocity = 0;
        }

        game.physics.arcade.velocityFromRotation( rocket.rotation, rocket.body.velocity.getMagnitude(), rocket.body.velocity );

        // asteroids movement
        asteroids.children.forEach(asteroid => {
            if (asteroid.x < 0 - asteroid.width) {
                asteroid.x = CONFIGS.mapWidth + asteroid.width;
            }
            if (asteroid.x > CONFIGS.mapWidth + asteroid.width) {
                asteroid.x = 0 - asteroid.width;
            }
            if (asteroid.y > CONFIGS.mapHeight - CONFIGS.skyHeight) {
                asteroid.y = 0;
            }
            if (asteroid.y < 0 - asteroid.height) {
                asteroid.y = CONFIGS.mapHeight - CONFIGS.skyHeight;
            }
        });

        // emitter
        let px = -rocket.body.velocity.x * 0.3;
        let py = -rocket.body.velocity.y * 0.3;
        emitter.minParticleSpeed.set(px, py);
        emitter.maxParticleSpeed.set(px, py);
        emitter.emitX = rocket.x;
        emitter.emitY = rocket.y;

        // overlapping
        game.physics.arcade.overlap(rocket, fuelCans, collectFuel, null, this);
        game.physics.arcade.overlap(rocket, asteroids, destroyAsteroid, null, this);
        game.physics.arcade.overlap(rocket, moon, setFlag, null, this);

        // timer
        let currentTime = Math.floor(game.time.now) - timer.startTime;
        let ms = currentTime % 1000;
        let s = Math.floor(currentTime / 1000);
        let m = Math.floor(s / 60);
        s = s % 60;

        if (timer.startTime > 0) {
            timer.text = `Time: ${m}m ${s}s ${ms}ms`;
        }

        // game over 
        if(rocket.body.velocity.getMagnitude() === 0 && fuelBar.fuelAmountPercent === 0 && rocket.gotBack === false) {
            gameOverText.alpha = 1;
            game.input.keyboard.enabled = false;
            timer.alpha = 0;
        }

        // win
        if (collisionWithGround) {
            if (rocket.reachedMoon === true && rocket.gotBack === false) {
                endingSound.play('', 0, 0.5);
                reachEarthText.addColor('#067906', 0);
                rocket.gotBack = true;

                timer.alpha = 0;
                winText.text = `You win. \n${timer.text}`;
                winText.alpha = 1;
                game.input.keyboard.enabled = false;
            }
        }

    }

    function render() {
        // game.debug.body(rocket);
        // game.debug.body(moon);
        // asteroids.children.forEach( asteroid => game.debug.body(asteroid));
        // fuelCans.children.forEach( fuelCan => game.debug.body(fuelCan));
    }

    function collectFuel(rocket, fuelCan) {
        fuelCollectionSound.play('', 0, 0.3);
        fuelBar.increaseFuel();
        fuelCan.destroy();
    }

    function destroyAsteroid(rocket, asteroid) {
        explosionSound.play('', 0, 0.3);

        if (asteroid.destroyed === false) {
            fuelBar.decreaseFuel( CONFIGS.asteroidsAverageDamage * (1 + asteroid.scale.y) );
            asteroid.destroyed = true;
            game.physics.arcade.velocityFromRotation( rocket.rotation, rocket.body.velocity.getMagnitude() * 0.6, rocket.body.velocity );
        } 

        asteroid.animations.play('explosion');
        setTimeout(() => {
            asteroid.destroy();
        }, 1500); 
    }

    function setFlag() {
        if (rocket.reachedMoon === false) {
            setFlagSound.play();
            rocket.reachedMoon = true;
            flag.alpha = 1;
            reachMoonText.addColor('#067906', 0);
            rocket.reachedMoon = true;
        }
    }

    class FuelBar extends Phaser.Group {
        constructor() {
            super(game);
            this.bar = this.create(0, 0, 'fuelBar');
            this.fuelAmountPercent = 100;
            this.renderBar();
        }
        decreaseFuel(n) {
            this.fuelAmountPercent -= n;
            if (this.fuelAmountPercent < 0) {
                this.fuelAmountPercent = 0;
            }
            this.renderBar();
        } 
        increaseFuel() {
            this.fuelAmountPercent += CONFIGS.fuelIncreaseAmount;
            if (this.fuelAmountPercent > 100) {
                this.fuelAmountPercent = 100;
            }
            this.renderBar();
        }
        renderBar() {
            this.bar.scale.setTo(CONFIGS.gameWidth / 1000 * this.fuelAmountPercent, 2);
        }  
    }

    function makeArray(n) {
        return Array(n).fill().map((el, i) => i);
    }
})();