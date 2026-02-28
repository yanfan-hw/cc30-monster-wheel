import * as cc from "cc";

const {ccclass, property} = cc._decorator;

@ccclass("Wheel")
export class Wheel extends cc.Component {
    @property(cc.Node)
    parentSymbol: cc.Node = null;

    listSymbolSprite: cc.Sprite[] = [];
    lastSymbolIndex = 0;
    targetSymbolResult = 0;

    needSpeedUp = false;
    isShowResult = false;

    onLoad() {
        this.parentSymbol.children.forEach(s => {
            let cmpSprite = s.getChildByName("Sprite").getComponent(cc.Sprite);
            this.listSymbolSprite.push(cmpSprite);
        });
        this.reset();
    }

    startWheel() {
        this.reset();
        this.runningWheel();
    }

    stopWheel() {
        cc.Tween.stopAllByTarget(this.node);
        let step = 0;
        let currentIndex = this.lastSymbolIndex;
        let totalStepToStop = this.listSymbolSprite.length - this.lastSymbolIndex + this.targetSymbolResult;
        let speed = 1/totalStepToStop;

        const cbLoop = (delayTime) => {
            cc.tween(this.node)
                .call(() => {
                    let symbolSprite = this.listSymbolSprite[currentIndex % this.listSymbolSprite.length];
                    this.getTweenBlinkSymbol(symbolSprite).start();
                    currentIndex++;
                    step++
                })
                .delay(delayTime)
                .call(() => {
                    if(step >= totalStepToStop) {
                        let symbolSprite = this.listSymbolSprite[currentIndex % this.listSymbolSprite.length];
                        this.getTweenBlinkSymbol(
                            symbolSprite, 0.25, 0.5,
                            () => {
                                this.lastSymbolIndex = currentIndex % this.listSymbolSprite.length;
                                this.reset();
                            }
                        ).start();
                        return;
                    }
                    speed = (totalStepToStop - step == 4) ? 0.25: speed;
                    cbLoop(speed);
                })
                .start();
        };
        cbLoop(speed);
    }

    runningWheel() {
        let symbolSprite = this.listSymbolSprite[this.lastSymbolIndex];
        let speed = this.needSpeedUp ? 1/30 : 0.15;
        cc.tween(this.node)
            .call(() => {
                this.getTweenBlinkSymbol(symbolSprite, 0.25, 0).start();
            })
            .delay(speed)
            .call(() => {
                this.checkLoopWheel();
            })
            .start();
    }

    stopWheelWithResult(targetSymbolValue: number) {
        this.isShowResult = true;
        this.targetSymbolResult = targetSymbolValue;
    }

    getTweenBlinkSymbol(symbolSprite: cc.Sprite, fadeDuration = 0.25, delayFade = 0, cb?:Function) {
        if(symbolSprite) {
            cc.Tween.stopAllByTarget(symbolSprite.color);
            symbolSprite.color = new cc.Color(255, 255, 255, 255);
            return cc.tween(symbolSprite.color)
                .delay(delayFade)
                .to(fadeDuration, {r: 50}, {
                    onUpdate: (target: cc.Color, _ratio) => {
                        let toValue = target.r;
                        symbolSprite.color = new cc.Color(toValue, toValue, toValue, 255);
                    }
                })
                .call(() => {
                    symbolSprite.color = new cc.Color(50, 50, 50, 255);
                    cb && cb();
                });
        }
    }

    checkLoopWheel() {
        this.lastSymbolIndex++;

        const lengthSymbol = this.listSymbolSprite.length;
        if(this.lastSymbolIndex >= lengthSymbol) {
            this.lastSymbolIndex = 0;
        }
        if(!this.needSpeedUp) {
            this.needSpeedUp = this.lastSymbolIndex >= lengthSymbol / 2;
        }

        if(!this.isShowResult) {
            this.runningWheel();
        } else {
            this.stopWheel();
        }
    }

    reset() {
        cc.Tween.stopAllByTarget(this.node);
        this.needSpeedUp = false;
        this.isShowResult = false;

        this.resetListSymbol();
    }

    resetListSymbol() {
        this.listSymbolSprite.forEach((symbolSprite) => {
            cc.Tween.stopAllByTarget(symbolSprite);
            symbolSprite.color = new cc.Color(50, 50, 50, 255);
        });
    }
}

