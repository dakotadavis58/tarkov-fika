import { DependencyContainer } from "tsyringe";

// SPT types
import { ITraderAssort, ITraderBase } from "@spt/models/eft/common/tables/ITrader";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ITraderConfig, UpdateTime } from "@spt/models/spt/config/ITraderConfig";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { IRagfairConfig } from "@spt/models/spt/config/IRagfairConfig";
import { Traders } from "@spt/models/enums/Traders";
import { HashUtil } from "@spt/utils/HashUtil";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { TraderHelper } from "./traderHelpers";

// New trader settings
import * as baseJson from "../db/aio_trader.json";

class AIOTrader implements IPreSptLoadMod, IPostDBLoadMod {
    mod: string;
    logger: ILogger;
    config;
    hashUtil: HashUtil;
    traderHelper: TraderHelper;
    all_keys_case_template = [];
    currency_price_in_rouble = {};
    /* must be static */
    static traderId = baseJson._id;

    constructor(container: DependencyContainer) {
        this.config = require('../config/config.json');
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.mod = "AIOTrader.AIOTrader";
        this.traderHelper = new TraderHelper();
        this.hashUtil = container.resolve<HashUtil>("HashUtil");
    }

    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    public preSptLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.logger.debug(`[${this.mod}] preAki Loading... `);

        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER);

        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600, 4000);

        this.logger.debug(`[${this.mod}] preAki Loaded`);
    }

    /**
     * Majority of trader-related work occurs after the aki database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    public postDBLoad(container: DependencyContainer): void 
    {
        this.logger.debug(`[${this.mod}] postDb Loading... `);

        // Resolve SPT classes we'll use
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer: ConfigServer = container.resolve<ConfigServer>("ConfigServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        // Get a reference to the database tables
        const tables = databaseServer.getTables();

        this.updateCurrencyPriceInRouble(container);

        // Add new trader to the trader dictionary in DatabaseServer
        this.addTraderToDb(baseJson, tables, jsonUtil, container);

        this.traderHelper.addTraderToLocales(baseJson, tables, "AioTrader", baseJson.nickname, baseJson.surname, baseJson.location, "This is the cat shop");

        const ragfairConfig: IRagfairConfig = configServer.getConfig(ConfigTypes.RAGFAIR);
        ragfairConfig.traders[baseJson._id] = true;

        this.logger.debug(`[${this.mod}] postDb Loaded`);
    }

    /**
     * Add record to trader config to set the refresh time of trader in seconds (default is 60 minutes)
     * @param traderConfig trader config to add our trader to
     * @param baseJson json file for trader (db/base.json)
     * @param refreshTimeSecondsMin How many seconds between trader stock refresh min time
     * @param refreshTimeSecondsMax How many seconds between trader stock refresh max time
     */
    public setTraderUpdateTime(traderConfig: ITraderConfig, baseJson: any, refreshTimeSecondsMin: number, refreshTimeSecondsMax: number): void 
    {
        // Add refresh time in seconds to config
        const traderRefreshRecord: UpdateTime = {
            traderId: baseJson._id,
            seconds: {
                min: refreshTimeSecondsMin,
                max: refreshTimeSecondsMax
            }
        };

        traderConfig.updateTime.push(traderRefreshRecord);
    }

    /**
     * Add our new trader to the database
     * @param traderDetailsToAdd trader details
     * @param tables database
     * @param jsonUtil json utility class
     */
    private addTraderToDb(traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil, container: DependencyContainer): void 
    {
        // Add trader to trader table, key is the traders id
        Traders[traderDetailsToAdd._id] = traderDetailsToAdd._id
        tables.traders[traderDetailsToAdd._id] = {
            suits: [],
            assort: this.createAssortTable(container), // assorts are the 'offers' trader sells, can be a single item (e.g. carton of milk) or multiple items as a collection (e.g. a gun)
            base: jsonUtil.deserialize(jsonUtil.serialize(traderDetailsToAdd)) as ITraderBase,
            questassort: {
                started: {},
                success: {},
                fail: {}
            } // Empty object as trader has no assorts unlocked by quests
        };
    }

    private createAssortTable(container: DependencyContainer) 
    {
        let realPriceCache;
        const databaseServer: DatabaseServer = container.resolve("DatabaseServer");
        const assortTable: ITraderAssort = {
            nextResupply: 3600,
            items: [],
            barter_scheme: {},
            loyal_level_items: {},
        };

        if (this.config.realistic_price.enable === true) 
        {
            this.logger.info("AIOTrader: caching realistic price.");
            realPriceCache = this.getRealisticPriceCache(container);
        }

        const items = databaseServer.getTables().templates.items;
        let count = 0;
        for (const id in items) 
        {
            const base = items[id];

            if (base._type !== "Item") 
            {
                continue;
            }

            const uuid = this.hashUtil.generate() + "blue";
            const itemInfo = 
            {
                _id: uuid,
                _tpl: base._id,
                parentId: "hideout",
                slotId: "hideout",
                upd: {
                    UnlimitedCount: true,
                    StackObjectsCount: 999999
                    // BuyRestrictionCurrent: 0,
                    // BuyRestrictionMax: 999999,
                }
            };

            if (this.config.realistic_price.enable === true) 
            {
                if (realPriceCache[id] !== undefined) 
                {
                    assortTable.barter_scheme[uuid] = realPriceCache[id];
                } 
                else if (this.config.realistic_price.hide_no_price_item == true) 
                {
                    continue;
                }
            } 
            else 
            {
                assortTable.barter_scheme[uuid] = [[{ count: 1, _tpl: "5449016a4bdc2d6f028b456f" }]];
            }

            assortTable.loyal_level_items[uuid] = 1;
            assortTable.items.push(itemInfo);
            count++;

            // gen locked plate for armor
            if (base._parent === "5448e54d4bdc2dcc718b4568" // armor
                || base._parent == "5a341c4086f77401f2541505" // helmet
                || base._parent == "5448e5284bdc2dcb718b4567") 
            { // rig
                // this.logger.info(base._name);
                this.insertLockedPlate(uuid, base, assortTable);
            } 
            else if (base._parent === "543be5cb4bdc2deb348b4568") 
            {
                // this.logger.info(base._name);
                this.insertAmmoStock(uuid, base, assortTable);
            }
        }

        this.logger.info(`AIOTrader: Total num of items ${count}`);

        return assortTable;
    }

    private insertLockedPlate(uuid, base: ITemplateItem, assortTable: ITraderAssort) 
    {
        for (const slot of base._props.Slots) 
        {
            if (slot._props.filters[0].locked === true) 
            {
                assortTable.items.push({
                    "_id": this.hashUtil.generate() + "blue",
                    "_tpl": slot._props.filters[0].Plate,
                    "parentId": uuid,
                    "slotId": slot._name,
                    "upd": {}
                })
            }
        }
    }

    private insertAmmoStock(uuid, base: ITemplateItem, assortTable: ITraderAssort) 
    {
        const ammoId = base._props.StackSlots[0]._props.filters[0].Filter[0];
        assortTable.items.push({
            "_id": this.hashUtil.generate() + "blue",
            "_tpl": ammoId,
            "parentId": uuid,
            "slotId": "cartridges",
            "upd": {
                "StackObjectsCount":base._props.StackSlots[0]._max_count
            }
        })
    }

    // get ruble euro exchange rate and ruble dollar exchange rate
    private updateCurrencyPriceInRouble(container: DependencyContainer) 
    {
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const traders = databaseServer.getTables().traders;

        // init currency exchange rate
        this.currency_price_in_rouble = {
            "5449016a4bdc2d6f028b456f": 1, // Rubles to Rubles
            "5696686a4bdc2da3298b456a": 1, // Dollars to Rubles
            "569668774bdc2da2298b4568": 1 // Euros to Rubles
        }

        // except fence, lighthouse keeper
        const currencyTradersId = [
            "58330581ace78e27b8b10cee", // skier
            "5935c25fb3acc3127c3d8cd9", // peacekeeper 
        ]

        const currencyId = [
            "5449016a4bdc2d6f028b456f", // Rubles
            "5696686a4bdc2da3298b456a", // Dollars
            "569668774bdc2da2298b4568" // Euros
        ]

        // cache offers that use currency instead of barter
        for (const traderId of currencyTradersId) 
        {
            const assort = traders[traderId].assort;
            for (const item of assort.items) 
            {
                const tpl = item._tpl;
                const barterSchemes = assort.barter_scheme[item._id];

                if (currencyId.includes(tpl) && Array.isArray(barterSchemes))
                {
                    for (const scheme of barterSchemes[0]) 
                    {
                        if (scheme._tpl === "5449016a4bdc2d6f028b456f") 
                        {
                            this.currency_price_in_rouble[tpl] = scheme.count;
                        }
                    }
                }
            }
        }

        this.logger.debug(this.currency_price_in_rouble)
    }

    private getRealisticPriceCache(container: DependencyContainer) 
    {
        const cache = {}

        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const itemsDump = databaseServer.getTables().templates.prices;

        const currencyMap = {
            "ruble": "5449016a4bdc2d6f028b456f",
            "dollar": "5696686a4bdc2da3298b456a",
            "eur": "569668774bdc2da2298b4568"
        }

        // cache offers that use currency instead of barter from trader
        for (const itemId of Object.keys(itemsDump)) 
        {
            const customPrice = this.config.realistic_price.custom_price[itemId]
            if (customPrice !== undefined) 
            {
                cache[itemId] = [[{ count: customPrice.price, _tpl: currencyMap[customPrice.currency] }]]
            }
            else if (itemsDump[itemId] > 0) 
            {
                cache[itemId] = [[{ count: itemsDump[itemId], _tpl: "5449016a4bdc2d6f028b456f" }]];
            }
        }

        return cache;
    }
}



export { AIOTrader };
