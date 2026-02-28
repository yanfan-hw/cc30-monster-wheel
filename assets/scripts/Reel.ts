import * as cc from "cc";
import {EReelState} from "./EReelState";
import {Wheel} from "./Wheel";

const {ccclass, property} = cc._decorator;

@ccclass("Reel")
export class Reel extends cc.Component {
    @property([cc.SpriteFrame])
    listSymbolFrame: cc.SpriteFrame[] = [];

    @property(cc.Prefab)
    symbolPrefab: cc.Prefab = null;

    @property(cc.Node)
    buttonSpin: cc.Node = null;

    @property(cc.Node)
    wheel: cc.Node = null;

    scriptWheel: Wheel = null;

    symbolHeight = 148;
    symbolVisibleCount = 3;
    totalSymbol = 0;
    listSymbolIdlePosY: number[] = [];

    currentState = EReelState.IDLE;
    stepMoveReel = 0;
    stepToStopReel = 0;
    stop = 0;

    isShowResult = false;
    listResult: number[] = [];

    onLoad() {
        this.scriptWheel = this.wheel.getComponent(Wheel);
        this.setupSymbol();

        this.buttonSpin.on("click", this._onClickButtonSpin, this);
        cc.input.on(cc.Input.EventType.KEY_DOWN, (event: cc.EventKeyboard) => {
            if(event.keyCode == cc.KeyCode.SPACE) {
                this._onClickButtonSpin();
            }
        }, this);
    }

    startSpin() {
        this.stepToStopReel = Number.MAX_SAFE_INTEGER - 1;
        let moveY = 100;
        let dur = 0.15;

        cc.tween(this.node)
            .by(dur, { position: cc.v3(0, moveY, 0)})
            .by(dur, { position: cc.v3(0, -moveY, 0)})
            .call(() => {
                this.runSpinning();
            })
            .start();
    }

    stopSpin() {
        let moveY = 150;
        let dur = 0.25;
        cc.tween(this.node)
            .by(dur, { position: cc.v3(0, -moveY, 0)})
            .by(dur, { position: cc.v3(0, moveY, 0)})
            .call(() => {
                this.reset();
                console.timeEnd("SPIN");
            })
            .start();
    }

    runSpinning() {
        this.currentState = EReelState.SPINNING;
        let dur = 0.06 + 0.06 * this.stop / 4;
        let moveY = this.symbolHeight;

        cc.tween(this.node)
            .by(dur, { position: cc.v3(0, -moveY, 0)})
            .call(() => {
                this.checkSymbolOutBottom();
                this.checkLoopSpinning();
            })
            .start();
    }

    stopSpinWithResult(listSymbolValue = []) {
        this.stepToStopReel = 9 * 2 - this.totalSymbol;
        this.listResult = [...listSymbolValue];
        this.listResult.unshift(cc.randomRangeInt(0, this.listSymbolFrame.length));
        this.listResult.push(cc.randomRangeInt(0, this.listSymbolFrame.length));
        let centerValue = listSymbolValue[Math.floor(listSymbolValue.length * 0.5)];
        console.time("SPIN");
        this.scriptWheel.stopWheelWithResult(centerValue);
    }

    checkLoopSpinning() {
        if(this.stepToStopReel > this.symbolVisibleCount) {
            this.runSpinning();
            this.stepToStopReel--;
            if(this.stepToStopReel < this.totalSymbol) {
                this.isShowResult = true;
            }
        } else if(this.stepToStopReel == this.symbolVisibleCount) {
            this.stopSpin();
        }
    }

    checkSymbolOutBottom() {
        let symbolOut = this.node.children[this.stepMoveReel % this.totalSymbol];
        let symbolSprite = symbolOut.getComponent(cc.Sprite);
        let pY = symbolOut.getPosition().y;
        pY += (this.symbolHeight * this.totalSymbol);
        symbolOut.setPosition(cc.v3(0, pY, 0));

        if (!this.isShowResult) {
            symbolSprite.spriteFrame = this.getRandomSymbolSprite();
        } else if (this.stop < this.totalSymbol) {
            this.stepToStopReel = this.totalSymbol + this.symbolVisibleCount - (this.stop + 1);
            if(this.checkSymbolIndexInView()) {
                const value = this.listResult[this.stop];
                symbolSprite.spriteFrame = this.listSymbolFrame[value];
            }
            this.stop++;
        }
        this.stepMoveReel++;
    }

    checkSymbolIndexInView() {
        //buffer 1 top/bottom
        return (this.stop >= 1) && (this.stop <= this.symbolVisibleCount + 1);
    }

    setupSymbol() {
        this.node.removeAllChildren();
        this.totalSymbol = this.symbolVisibleCount + 2; //buffer 2 top+bottom
        let startY = -(this.symbolVisibleCount / 2 + 0.5) * this.symbolHeight;
        for(let i = 0; i < this.totalSymbol; i++) {
            let newY = startY + i * this.symbolHeight;
            let newSymbol = cc.instantiate(this.symbolPrefab);
            newSymbol.setPosition(cc.v3(0, newY, 0));
            let cmpSpite = newSymbol.getComponent(cc.Sprite);
            cmpSpite.spriteFrame = this.getRandomSymbolSprite();

            this.node.addChild(newSymbol);
            this.listSymbolIdlePosY.push(newY);
        }
    }

    reset() {
        this.currentState = EReelState.IDLE;
        this.stepMoveReel = 0;
        this.stepToStopReel = Number.MAX_SAFE_INTEGER;
        this.stop = 0;
        this.isShowResult = false;
        this.listResult = [];

        this.node.setPosition(cc.v3(0, 0, 0));
        this.node.children.sort((s1, s2) => s1.getPosition().y - s2.getPosition().y);
        this.node.children.forEach((s, index) => {
            let pY = this.listSymbolIdlePosY[index];
            s.setPosition(cc.v3(0, pY, 0));
        });
    }

    getRandomSymbolSprite() {
        let randomIndex = cc.randomRangeInt(0, this.listSymbolFrame.length);
        return this.listSymbolFrame[randomIndex];
    }

    _onClickButtonSpin() {
        let cmpLabelButton = this.buttonSpin.getChildByName("Label").getComponent(cc.Label);
        if (this.currentState == EReelState.IDLE) {
            cmpLabelButton.string = "STOP";
            this.startSpin();
            this.scriptWheel.startWheel();
        } else if (this.currentState == EReelState.SPINNING) {
            cmpLabelButton.string = "SPIN";
            let listSymbolValue = Array.from({length: this.symbolVisibleCount}, () => {
                return cc.randomRangeInt(0, this.listSymbolFrame.length);
            });
            this.stopSpinWithResult(listSymbolValue);
        }
    }
}

