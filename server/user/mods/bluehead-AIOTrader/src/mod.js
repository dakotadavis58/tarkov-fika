"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aio_trader_1 = require("./aio_trader");
const bluehead_trader_1 = require("./bluehead_trader");
const aio_injector_case_1 = require("./aio_injector_case");
const CustomTradeController_1 = require("./CustomTradeController");
let logger;
const modName = "bluehead-AIOTrader";
class BlueheadAioTrader {
    pkg;
    config;
    blueheadTrader;
    aioTrader;
    constructor() {
        this.config = require("../config/config.json");
    }
    preSptLoad(container) {
        logger = container.resolve("WinstonLogger");
        if (this.config.enable !== true) {
            logger.debug("AIOTrader-preSptLoad Disabled");
            return;
        }
        logger.debug("[AIOTrader]postAkiLoad Start");
        const modLoader = container.resolve("PostSptModLoader");
        this.pkg = require("../package.json");
        logger.info(`Loading: ${this.pkg.author}: ${this.pkg.name} - ${this.pkg.version}`);
        // //avatar
        const imageRouter = container.resolve("ImageRouter");
        imageRouter.addRoute("/files/trader/avatar/aiotrader", `${modLoader.getModPath(modName)}avatar/aiotrader.png`);
        imageRouter.addRoute("/files/trader/avatar/blueheadtrader", `${modLoader.getModPath(modName)}avatar/bluehead.jpg`);
        if (this.config.enable_aio_trader === true) {
            logger.debug("[AIOTrader]postAkiLoad loading Bluehead Trader");
            this.aioTrader = new aio_trader_1.AIOTrader(container);
            this.aioTrader.preSptLoad(container);
        }
        if (this.config.enable_bluehead_trader === true) {
            logger.debug("[AIOTrader]postAkiLoad loading Bluehead Trader");
            this.blueheadTrader = new bluehead_trader_1.BlueheadTrader(container);
            this.blueheadTrader.preSptLoad(container);
            // class override must be in preSptLoad to work
            container.register("CustomTradeController", CustomTradeController_1.CustomTradeController);
            container.register("TradeController", { useToken: "CustomTradeController" });
            logger.debug("[AIOTrader]override");
        }
    }
    postDBLoad(container) {
        logger = container.resolve("WinstonLogger");
        if (this.config.enable !== true) {
            logger.debug("[AIOTrader]postDBLoad Disabled");
            return;
        }
        logger.debug("[AIOTrader]postDBLoad Start");
        if (this.config.enable_aio_injector_case === true) {
            logger.debug("[AIOTrader]loading AIO_Injector_case");
            new aio_injector_case_1.AIOInjectorCase(container);
        }
        if (this.config.enable_aio_trader === true) {
            logger.debug("[AIOTrader]loading AIO Trader");
            this.aioTrader.postDBLoad(container);
        }
        if (this.config.enable_bluehead_trader === true) {
            logger.debug("[AIOTrader]postDBLoad loading Bluehead Trader");
            this.blueheadTrader.postDBLoad(container);
        }
    }
}
module.exports = { mod: new BlueheadAioTrader() };
//# sourceMappingURL=mod.js.map