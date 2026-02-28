
import { _decorator, Component, view,  Canvas, Widget, sys, macro, log, ResolutionPolicy, CCBoolean, CCInteger, screen, Camera, director} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CanvasScaleByOrientation')
export class CanvasScaleByOrientation extends Component {
    @property(CCBoolean)
    autoOrientation = false;
    @property(CCBoolean)
    isPortrait = true;
    @property({type:Canvas})
    canvas:Canvas|null = null;
    @property(CCBoolean)
    fitByOrientation = true;
    @property(CCBoolean)
    useCustomDesignResolution = false;
    @property(CCInteger)
    customDSWidth = 1280;
    @property(CCInteger)
    customDSHeight = 720;
    @property({type:Widget})
    widgetNodes:Array<Widget> = [];
    @property(CCBoolean)
    isDebug = false;

    @property({type:CCInteger})
    minScreenRatio = 0;

    _thisOnResized:any;

    innerSize : any;
    onLoad() {
        this.innerSize = {width :  window.innerWidth , height : window.innerHeight };
        this._thisOnResized = this.onScreenResized.bind(this);
        if (sys.isBrowser) {
            window.addEventListener('resize', this._thisOnResized);
        }
        else {
            view.on('canvas-resize', this._thisOnResized);
        }
        if (!sys.isNative) {
            var divFullscreen = document.getElementById('div_full_screen');
            if (this.isPortrait) {
                if (divFullscreen) {
                    divFullscreen.style.visibility = "hidden";
                }
            }

            if(this.autoOrientation){
                view.setOrientation(macro.ORIENTATION_AUTO);
            }else if(this.isPortrait){
                view.setOrientation(macro.ORIENTATION_PORTRAIT);
            }else{
                view.setOrientation(macro.ORIENTATION_LANDSCAPE);
            }
        }
    }

    start(){
        if(sys.isMobile){
            const eventResize = new Event('gameShow');
            window.dispatchEvent(eventResize);
        }
        if (sys.isNative) {
            director.emit("INTEGRATION_SET_CANVAS_ORIENT", this.isPortrait ? 0 : 1);
        }
        this.scaleCanvasByOrientation();
    }

    scaleCanvasByOrientation() {
        const screenWidth = window?window.innerWidth:screen.windowSize.width;
        const screenHeight = window?window.innerHeight:screen.windowSize.height;
        if (this.autoOrientation) {
            if (screenWidth < screenHeight) {
                this.isPortrait = true;
            } else {
                this.isPortrait = false;
            }
        } else {
            if (this.isPortrait) {
                view.setOrientation(macro.ORIENTATION_PORTRAIT);
            } else {
                view.setOrientation(macro.ORIENTATION_LANDSCAPE);
            }
        }


        if (this.canvas) {
            this.isDebug && log("Canvas after update: ");
            this.isDebug && log(this.canvas);

            this.canvas.alignCanvasWithScreen = true;
            if (this.fitByOrientation) {
                const designRatio = this.useCustomDesignResolution? this.customDSWidth/this.customDSHeight : view.getDesignResolutionSize().width / view.getDesignResolutionSize().height;
                let screenRatio =  screenWidth / screenHeight;
                if (window && sys.isMobile && sys.isBrowser) {
                    const isLandscapeOrien = this.isLandscapeScreen();
                    if (this.isPortrait) {
                        screenRatio = isLandscapeOrien ? screenHeight/screenWidth : screenWidth/screenHeight;
                    } else {
                        screenRatio = isLandscapeOrien ? window.innerWidth / window.innerHeight : window.innerHeight / window.innerWidth;
                    }
                }
                this.isDebug && log(`[TestResize]View size width: ${screenWidth}, height: ${screenHeight}  Design Resolution: W: ${view.getDesignResolutionSize().width}, H: ${view.getDesignResolutionSize().height},  Screen Ratio: ${screenRatio}, Design Ratio: ${designRatio}, minScreenRatio: ${this.minScreenRatio}`);
                if (this.isPortrait) {
                    if (screenRatio < designRatio) {
                        view.setDesignResolutionSize(
                            view.getDesignResolutionSize().width,
                            view.getDesignResolutionSize().height,
                            ResolutionPolicy.FIXED_WIDTH
                        );
                        this.isDebug && log(`CANVAS FIT WIDTH`);
                    } else {
                        view.setDesignResolutionSize(
                            view.getDesignResolutionSize().width,
                            view.getDesignResolutionSize().height,
                            ResolutionPolicy.FIXED_HEIGHT
                        );
                        this.isDebug && log(`CANVAS FIT HEIGHT`);
                    }
                    this.rotateRootPortraitGame();
                } else {
                    if (screenRatio < designRatio && screenRatio >= this.minScreenRatio) {
                        view.setDesignResolutionSize(
                            view.getDesignResolutionSize().width,
                            view.getDesignResolutionSize().height,
                            ResolutionPolicy.FIXED_WIDTH
                        );
                        this.isDebug && log(`[TestResize]CANVAS FIT WIDTH`);
                    } else {
                        view.setDesignResolutionSize(
                            view.getDesignResolutionSize().width,
                            view.getDesignResolutionSize().height,
                            ResolutionPolicy.FIXED_HEIGHT
                        );
                        this.isDebug && log(`[TestResize]CANVAS FIT HEIGHT`);
                    }
                }
            }
        } else {
            this.isDebug && log(`No canvas component`);
        }

        if (this.widgetNodes && this.widgetNodes.length > 0) {
            for (let i = 0; i < this.widgetNodes.length; i++) {
                const widget = this.widgetNodes[i];
                if(widget){
                    this.widgetNodes[i].updateAlignment();
                }
            }
        }
    }

    onScreenResized() {
        this.scheduleOnce(()=>{
            this.scaleCanvasByOrientation();
        }, 0.5);
    }

    isLandscapeScreen(){
        if(sys.isMobile && sys.isBrowser && typeof window.matchMedia === 'function') {
            if (window.matchMedia("(orientation: landscape)").matches) {
                return true;
            }
            if (window.matchMedia("(orientation: portrait)").matches) {
                return false;
            }
        }
        return true;
    }

    isShowKeyboard() {
        let currentViewSize = window.innerWidth * window.innerHeight;
        let rate = currentViewSize / (this.innerSize.width * this.innerSize.height) ;
        return rate < 0.8;
    }

    rotateRootPortraitGame() {
        if (!this.isPortrait) return;
        if (sys.isMobile && sys.isBrowser) {
            const isLandScapeView = this.isLandscapeScreen() && !this.isShowKeyboard() ;
            this.node.children.forEach(child => {
                if (!child.getComponent(Camera)) {
                    child.angle = isLandScapeView ? 180 : 0;
                }
            });
        }
    }

    onDestroy() {
        if (sys.isBrowser) {
            window.removeEventListener('resize', this._thisOnResized);
        }
        else {
            view.off('canvas-resize', this._thisOnResized);
        }
    }
}