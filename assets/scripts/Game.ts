import {
    _decorator, Collider2D, Component, Contact2DType, Director, Input, input,
    instantiate, Label, Node, Prefab, RigidBody2D, Vec2, Vec3
} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('Game')
export class Game extends Component {

    @property({type: Node})
    private ballNode: Node = null; // 绑定 ball节点

    @property({type: Node})
    private blocksNode: Node = null; // 绑定 blocks 节点

    @property({type: Prefab})
    private blockPrefab: Prefab = null; // 绑定资源管理器中的 block 预制体文件

    @property({type: Label})
    private scoreLabel: Label = null; //绑定 score 节点

    private bounceSpeed: number = 0;// 小球第一次落地时的速度
    private gameState: number = 0; // 0:等待开始，1: 游戏开始，2: 游戏结束
    private blockGap: number = 250;// 两块跳板的间距
    private score: number = 0; //游戏得分
    start() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        this.ballNode.position = new Vec3(-250, 200, 0);
        this.collisionHandler();
        this.initBlock(); // 初始化跳板
    }

    update(dt: number) {
        if (this.gameState == 1) {
            console.log('[update] moveAllBlock');
            this.moveAllBlock(dt);
        }

    }

    initBlock() {
        let posX;
        for (let i = 0; i < 5; i++) {
            if (i == 0) {
                posX = this.ballNode.position.x; // 第一块跳板生成在小球下方
            } else {
                posX = posX + this.blockGap; // 根据间隔获取下一块跳板的位置
            }

            this.createNewBlock(new Vec3(posX, 0, 0));
        }
    }

    //增加得分
    incrScore() {
        this.score = this.score + 1;
        this.scoreLabel.string = String(this.score);
    }

    onTouchStart() {
        // 只有小球落地后才可以进行操作
        if (this.bounceSpeed == 0) return;

        let rigidbody = this.ballNode.getComponent(RigidBody2D);
        rigidbody.linearVelocity = new Vec2(0, 20); // 跳跃
        //将小球的下落速度变成反弹速度的 1.5 倍，实现加速逻辑
        // rigidbody.linearVelocity = new Vec2(0, -this.bounceSpeed * 1.5);
        this.gameState = 1; // 游戏开始
    }

    collisionHandler() {
        let collider = this.ballNode.getComponent(Collider2D);
        let rigidbody = this.ballNode.getComponent(RigidBody2D);

        collider.on(Contact2DType.BEGIN_CONTACT, () => {
            console.log('碰撞产生');
            // 首次落地前 bounceSpeed 值为 0，此时会将小球的落地速度的绝对值进行赋值
            if (this.bounceSpeed == 0) {
                this.bounceSpeed = Math.abs(rigidbody.linearVelocity.y);
            } else {
                // 此后将落地反弹的速度锁定为第一次落地的速度
                rigidbody.linearVelocity = new Vec2(0, this.bounceSpeed);
            }
        }, this);
    }

    createNewBlock(pos) {
        let blockNode = instantiate(this.blockPrefab); // 创建预制节点
        blockNode.position = pos; // 设置节点生成位置
        this.blocksNode.addChild(blockNode); // 将节点添加到 blocks 节点下
    }

    //获取最后一块跳板的位置
    getLastBlockPosX() {
        let lastBlockPosX = 0;
        for (let blockNode of this.blocksNode.children) {
            if (blockNode.position.x > lastBlockPosX) {
                lastBlockPosX = blockNode.position.x;
                console.log('[update] getLastBlockPosX', lastBlockPosX);
            }
        }
        return lastBlockPosX;
    }

    //跳板出界处理
    checkBlockOut(blockNode) {
        //跳板超出屏幕后将被销毁并生成新的跳板
        if (blockNode.position.x < -400) {
            let nextBlockPosX = this.getLastBlockPosX() + this.blockGap;
            let nextBlockPosY = (Math.random() > .5 ? 1 : -1) * (10 + 40 * Math.random());
            blockNode.position = new Vec3(nextBlockPosX, nextBlockPosY, 0);
            // this.createNewBlock(new Vec3(nextPosX, 0, 0));

            this.incrScore(); // 增加得分
            console.log('[update] checkBlockOut 增加得分');
        }

        //小球掉出屏幕
        if (this.ballNode.position.y < -700) {
            this.gameState = 2;
            Director.instance.loadScene('Game'); // 重新加载 Game 场景
        }
    }

    moveAllBlock(dt) {
        let speed = -300 * dt; // 移动速度
        for (let blockNode of this.blocksNode.children) {
            let pos = blockNode.position.clone();
            pos.x += speed;
            blockNode.position = pos;
            this.checkBlockOut(blockNode); // 跳板出界处理
            console.log('[update] moveAllBlock');
        }
    }
}


