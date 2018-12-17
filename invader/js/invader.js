
//グローバル展開
phina.globalize();

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
var SCORE = 0;
var GAME_STATUS = "";
const ASSETS = {
    "image": {
        "buro": "./assets/images/buropiyo.png",
        "mero": "./assets/images/meropiyo.png",
        "mika": "./assets/images/mikapiyo.png",
        "nasu": "./assets/images/nasupiyo.png",
        "take": "./assets/images/takepiyo.png",
        "toma": "./assets/images/tomapiyo.png"
    }
};
const ENEMY_ASSETS = [
    "buro", "mero", "mika", "nasu", "take"
];

phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // X/Yそれぞれ40分割したグリッドで置き換え
        this.gridX = Grid(SCREEN_WIDTH, 40);
        this.gridY = Grid(SCREEN_HEIGHT, 40);
        this.backgroundColor = 'black';

        this.player = Player(this.gridX.center(), this.gridY.span(37)).addChildTo(this);
        // 複数の敵を登録する対象
        this.enemyGroup = EnemyGroup(this, 7, 5, 2, 4).addChildTo(this);

        this.enemyGroup.allMoveTo(this.gridX.center() - this.gridX.span(this.enemyGroup.column * this.enemyGroup.gapX) / 2, this.gridY.span(5));
        // 敵が発射したミサイルを登録する対象
        this.missileGroup = DisplayElement().addChildTo(this);
    },
    update: function (app) {
        // ミサイルと弾の当たり判定
        if (this.player.bullet != null && this.player.parent != null) {
            this.missileGroup.children.some(missile => {
                if (missile.hitTestElement(this.player.bullet)) {
                    missile.flare('hit');
                    this.player.bullet.flare('hit');
                }
            });
        }
        // 弾と敵の当たり判定
        if (this.player.bullet != null) {
            this.enemyGroup.children.some(enemy => {
                if (enemy.hitTestElement(this.player.bullet)) {
                    // 直接それぞれのメソッドを呼ばずにイベントで対応させる。
                    enemy.flare('hit');
                    this.player.bullet.flare('hit');
                    return true;
                }

                return false;
            })
        }
        // ミサイルとプレイヤーの当たり判定
        this.missileGroup.children.some(missile => {
            if (missile.hitTestElement(this.player)) {
                missile.flare('hit');
                this.player.flare('hit');
            }
        });
        //プレイヤーと敵　当たり判定
        if (this.player != null) {
            this.enemyGroup.children.some(enemy => {
                if (enemy.hitTestElement(this.player) && enemy.parent != null) {
                    this.player.flare('hit');
                    this.exit();
                }
            })
        }
        //ゲームクリア
        if (this.enemyGroup.children.length <= 0) {
            GAME_STATUS = "GAME CLEAR";
            this.exit();
        }
    }
});

phina.define('Player', {
    superClass: 'Sprite',
    init: function (x, y) {
        this.superInit('toma', 64, 64);
        this.setFrameIndex(10, 64, 64);
        this.x = x;
        this.y = y;
        this.SPEED = 5;
        this.bullet = null;
    },

    update: function (app) {
        const key = app.keyboard;

        if (key.getKey('left')) {
            this.x -= this.SPEED;
            if (this.left < 0) {
                this.left = 0;
            }
        }
        if (key.getKey('right')) {
            this.x += this.SPEED;
            if (this.right > SCREEN_WIDTH) {
                this.right = SCREEN_WIDTH;
            }
        }

        // 弾は同時に1発しか発射できない仕様なので、bulletがnullのときにスペースキー押されていたら発射
        if (this.bullet == null && key.getKey('space')) {
            this.bullet = Bullet(this.x, this.top).addChildTo(this.parent);
        }

        // すでにbulletが無効(isInvalid==true)ならnullにする
        if (this.bullet != null && this.bullet.isInvalid) {
            this.bullet = null;
        }
    },

    onhit: function () {
        this.remove();
    }

});

phina.define('Bullet', {
    superClass: 'RectangleShape',
    init: function (x, y) {
        this.superInit({
            width: 3,
            height: 15,
            fill: 'white',
            stroke: null,
        });
        this.x = x;
        this.y = y;
        this.isInvalid = false;
        this.SPEED = 5;
    },

    // 弾を画面上から消して無効にするイベントリスナ(なにかに当たった)
    onhit: function () {
        this.remove();
        this.isInvalid = true;
    },

    update: function () {
        this.y -= this.SPEED;
        if (this.bottom < 0) {
            this.flare('hit');
        }
    }
});

phina.define('Enemy', {
    superClass: 'Sprite',
    init: function (x, y, image) {
        this.superInit(image, 64, 64);
        this.setFrameIndex(7, 64, 64);
        this.x = x;
        this.y = y;
    },

    // 敵を画面上から消すイベントリスナ(倒された)
    onhit: function () {
        this.remove();
    },
});

phina.define('Missile', {
    superClass: 'PathShape',

    init: function (x, y) {
        this.superInit({
            // ミサイルの見た目(相対パスで指定)
            paths: [
                {x: 0, y: 0},
                {x: 3, y: 2},
                {x: -3, y: 4},
                {x: 3, y: 6},
                {x: -3, y: 8},
                {x: 3, y: 10},
                {x: -3, y: 12},
                {x: 3, y: 14},
                {x: 0, y: 16},
            ],
            fill: null,
            // ミサイルの色
            stroke: 'orangered',
            lineJoin: 'miter',
            // ミサイルの線の太さ
            strokeWidth: 1,
        });
        this.x = x;
        this.y = y;
        // ミサイルの移動速度
        this.SPEED = 4;
    },
    onhit: function () {
        this.remove();
    },

    update: function () {
        this.y += this.SPEED;
        if (this.top > SCREEN_HEIGHT) {
            this.flare('hit');
        }
    }
});
phina.define("ResultScene", {
    superClass: "ResultScene",
    init: function () {
        this.superInit({
            score: SCORE,
            message: "This is JavaScript Class Work",
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        });
        SCORE = 0;
    }
});

phina.define('EnemyGroup', {
    superClass: 'DisplayElement',
    init: function (scene, column, row, gapX, gapY) {
        this.superInit();
        this.time = 0;
        this.interval = 1000;
        this.direction = 1;
        this.existRatio = 1;
        this.column = column;
        this.row = row;
        this.gapX = gapX;
        this.gapY = gapY;
        this.make(scene, column, row, gapX, gapY);
        this.beginInterval = 1000;
        this.maxAmountOfEnemy = this.children.length;
        this.attackInterval = 200;
        this.isOnWall = false;

    },

    update: function (app) {
        // deltaTimeを加算していって経過時間を計る
        this.time += app.deltaTime;
        const scene = this.parent;
        this.interval = this.children.length / this.maxAmountOfEnemy * this.beginInterval;

        let right = 0;
        let left = scene.gridX.columns;

        if (this.time / this.interval >= 1) {
            this.children.forEach(enemy => {
                enemy.moveBy(scene.gridX.unit() * this.direction, 0);
                // 全体の右端のポジションを計算
                right = Math.max(right, enemy.x / scene.gridX.unit());
                // 全体の左端のポジションを計算
                left = Math.min(left, enemy.x / scene.gridX.unit());
            });
            this.time -= this.interval;

        }

        // 移動の向きを変更するタイミング
        if (this.direction > 0 && right >= 38
            || this.direction < 0 && left <= 2) {
            this.direction = -this.direction;
            this.isOnWall = true;
        }
        if (app.frame % this.attackInterval == 0) {
            this.shot();
        }
    },


    make: function (scene, column, row, gapX, gapY) {
        for (x=0; x<column; x++) {
            for (y=0; y<row; y++) {
                this.addChild(Enemy(scene.gridX.span(x * gapX), scene.gridY.span(y * gapY), ENEMY_ASSETS[(x) % 5]));
            }
        }

    },
    allMoveTo: function (gridX, gridY) {
        var distX = this.x + gridX;
        var distY = this.y + gridY;
        this.children.forEach(enemy => {
            enemy.moveBy(distX, distY);
        });
    },

    shot: function () {
        var attackableEnemys = {};
        var enemys = [];
        var enemy = null;
        this.children.forEach(enemy => {
            attackableEnemys[enemy.x] = enemy;
        });

        for (key in attackableEnemys) {
            enemys.push(attackableEnemys[key]);
        }
        enemy = enemys[Math.floor(Math.random() * enemys.length)];
        Missile(enemy.x, enemy.y).addChildTo(this.parent.missileGroup);
    }
});

phina.main(() => {
    const app = GameApp({
        title: "インベーダー",
        fps: 60,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
    });

    app.run();
});