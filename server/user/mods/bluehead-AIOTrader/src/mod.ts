import { DependencyContainer } from "tsyringe";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import type { PostSptModLoader } from "@spt/loaders/PostSptModLoader";
import { ImageRouter } from "@spt/routers/ImageRouter";

import { AIOTrader } from "./aio_trader";
import { BlueheadTrader } from "./bluehead_trader";
import { AIOInjectorCase } from "./aio_injector_case";
import { CustomTradeController } from "./CustomTradeController"
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";

let logger;
const modName = "bluehead-AIOTrader"

class BlueheadAioTrader implements IPostDBLoadMod, IPreSptLoadMod
{
    private pkg;
    private config;
    private blueheadTrader: BlueheadTrader;
    private aioTrader: AIOTrader;

    constructor() 
    {
        this.config = require("../config/config.json");
    }

    public preSptLoad(container: DependencyContainer): void 
    {
        logger = container.resolve<ILogger>("WinstonLogger");
        if (this.config.enable !== true) 
        {
            logger.debug("AIOTrader-preSptLoad Disabled");
            return
        }

        logger.debug("[AIOTrader]postAkiLoad Start");
        const modLoader: PostSptModLoader = container.resolve("PostSptModLoader");
        this.pkg = require("../package.json")
        logger.info(`Loading: ${this.pkg.author}: ${this.pkg.name} - ${this.pkg.version}`);

        // //avatar
        const imageRouter = container.resolve<ImageRouter>("ImageRouter");
        imageRouter.addRoute("/files/trader/avatar/aiotrader", `${modLoader.getModPath(modName)}avatar/aiotrader.png`);
        imageRouter.addRoute("/files/trader/avatar/blueheadtrader", `${modLoader.getModPath(modName)}avatar/bluehead.jpg`);

        if (this.config.enable_aio_trader === true) 
        {
            logger.debug("[AIOTrader]postAkiLoad loading Bluehead Trader");
            this.aioTrader = new AIOTrader(container);
            this.aioTrader.preSptLoad(container);
        }

        if (this.config.enable_bluehead_trader === true) 
        {
            logger.debug("[AIOTrader]postAkiLoad loading Bluehead Trader");
            this.blueheadTrader = new BlueheadTrader(container);
            this.blueheadTrader.preSptLoad(container);

            // class override must be in preSptLoad to work
            container.register<CustomTradeController>("CustomTradeController", CustomTradeController);
            container.register("TradeController", { useToken: "CustomTradeController" });
            logger.debug("[AIOTrader]override");
        }
    }

    public postDBLoad(container: DependencyContainer): void 
    {
        logger = container.resolve<ILogger>("WinstonLogger");

        if (this.config.enable !== true) 
        {
            logger.debug("[AIOTrader]postDBLoad Disabled");
            return
        }

        logger.debug("[AIOTrader]postDBLoad Start");

        if (this.config.enable_aio_injector_case === true) 
        {
            logger.debug("[AIOTrader]loading AIO_Injector_case");
            new AIOInjectorCase(container);

        }

        if (this.config.enable_aio_trader === true) 
        {
            logger.debug("[AIOTrader]loading AIO Trader");
            this.aioTrader.postDBLoad(container);
        }

        if (this.config.enable_bluehead_trader === true) 
        {
            logger.debug("[AIOTrader]postDBLoad loading Bluehead Trader");
            this.blueheadTrader.postDBLoad(container);

        }
    }

}

module.exports = { mod: new BlueheadAioTrader() };