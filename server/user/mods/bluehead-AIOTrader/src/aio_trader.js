"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOTrader = void 0;
const ConfigTypes_1 = require("/snapshot/project/obj/models/enums/ConfigTypes");
const Traders_1 = require("/snapshot/project/obj/models/enums/Traders");
const traderHelpers_1 = require("./traderHelpers");
// New trader settings
const baseJson = __importStar(require("../db/aio_trader.json"));
class AIOTrader {
    mod;
    logger;
    config;
    hashUtil;
    traderHelper;
    all_keys_case_template = [];
    currency_price_in_rouble = {};
    /* must be static */
    static traderId = baseJson._id;
    constructor(container) {
        this.config = require('../config/config.json');
        this.logger = container.resolve("WinstonLogger");
        this.mod = "AIOTrader.AIOTrader";
        this.traderHelper = new traderHelpers_1.TraderHelper();
        this.hashUtil = container.resolve("HashUtil");
    }
    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    preSptLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.logger.debug(`[${this.mod}] preAki Loading... `);
        const configServer = container.resolve("ConfigServer");
        const traderConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600, 4000);
        this.logger.debug(`[${this.mod}] preAki Loaded`);
    }
    /**
     * Majority of trader-related work occurs after the aki database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    postDBLoad(container) {
        this.logger.debug(`[${this.mod}] postDb Loading... `);
        // Resolve SPT classes we'll use
        const databaseServer = container.resolve("DatabaseServer");
        const configServer = container.resolve("ConfigServer");
        const jsonUtil = container.resolve("JsonUtil");
        // Get a reference to the database tables
        const tables = databaseServer.getTables();
        this.updateCurrencyPriceInRouble(container);
        // Add new trader to the trader dictionary in DatabaseServer
        this.addTraderToDb(baseJson, tables, jsonUtil, container);
        this.traderHelper.addTraderToLocales(baseJson, tables, "AioTrader", baseJson.nickname, baseJson.surname, baseJson.location, "This is the cat shop");
        const ragfairConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
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
    setTraderUpdateTime(traderConfig, baseJson, refreshTimeSecondsMin, refreshTimeSecondsMax) {
        // Add refresh time in seconds to config
        const traderRefreshRecord = {
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
    addTraderToDb(traderDetailsToAdd, tables, jsonUtil, container) {
        // Add trader to trader table, key is the traders id
        Traders_1.Traders[traderDetailsToAdd._id] = traderDetailsToAdd._id;
        tables.traders[traderDetailsToAdd._id] = {
            suits: [],
            assort: this.createAssortTable(container), // assorts are the 'offers' trader sells, can be a single item (e.g. carton of milk) or multiple items as a collection (e.g. a gun)
            base: jsonUtil.deserialize(jsonUtil.serialize(traderDetailsToAdd)),
            questassort: {
                started: {},
                success: {},
                fail: {}
            } // Empty object as trader has no assorts unlocked by quests
        };
    }
    createAssortTable(container) {
        let realPriceCache;
        const databaseServer = container.resolve("DatabaseServer");
        const assortTable = {
            nextResupply: 3600,
            items: [],
            barter_scheme: {},
            loyal_level_items: {},
        };
        if (this.config.realistic_price.enable === true) {
            this.logger.info("AIOTrader: caching realistic price.");
            realPriceCache = this.getRealisticPriceCache(container);
        }
        const items = databaseServer.getTables().templates.items;
        let count = 0;
        for (const id in items) {
            const base = items[id];
            if (base._type !== "Item") {
                continue;
            }
            const uuid = this.hashUtil.generate() + "blue";
            const itemInfo = {
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
            if (this.config.realistic_price.enable === true) {
                if (realPriceCache[id] !== undefined) {
                    assortTable.barter_scheme[uuid] = realPriceCache[id];
                }
                else if (this.config.realistic_price.hide_no_price_item == true) {
                    continue;
                }
            }
            else {
                assortTable.barter_scheme[uuid] = [[{ count: 1, _tpl: "5449016a4bdc2d6f028b456f" }]];
            }
            assortTable.loyal_level_items[uuid] = 1;
            assortTable.items.push(itemInfo);
            count++;
            // gen locked plate for armor
            if (base._parent === "5448e54d4bdc2dcc718b4568" // armor
                || base._parent == "5a341c4086f77401f2541505" // helmet
                || base._parent == "5448e5284bdc2dcb718b4567") { // rig
                // this.logger.info(base._name);
                this.insertLockedPlate(uuid, base, assortTable);
            }
            else if (base._parent === "543be5cb4bdc2deb348b4568") {
                // this.logger.info(base._name);
                this.insertAmmoStock(uuid, base, assortTable);
            }
        }
        this.logger.info(`AIOTrader: Total num of items ${count}`);
        return assortTable;
    }
    insertLockedPlate(uuid, base, assortTable) {
        for (const slot of base._props.Slots) {
            if (slot._props.filters[0].locked === true) {
                assortTable.items.push({
                    "_id": this.hashUtil.generate() + "blue",
                    "_tpl": slot._props.filters[0].Plate,
                    "parentId": uuid,
                    "slotId": slot._name,
                    "upd": {}
                });
            }
        }
    }
    insertAmmoStock(uuid, base, assortTable) {
        const ammoId = base._props.StackSlots[0]._props.filters[0].Filter[0];
        assortTable.items.push({
            "_id": this.hashUtil.generate() + "blue",
            "_tpl": ammoId,
            "parentId": uuid,
            "slotId": "cartridges",
            "upd": {
                "StackObjectsCount": base._props.StackSlots[0]._max_count
            }
        });
    }
    // get ruble euro exchange rate and ruble dollar exchange rate
    updateCurrencyPriceInRouble(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const traders = databaseServer.getTables().traders;
        // init currency exchange rate
        this.currency_price_in_rouble = {
            "5449016a4bdc2d6f028b456f": 1, // Rubles to Rubles
            "5696686a4bdc2da3298b456a": 1, // Dollars to Rubles
            "569668774bdc2da2298b4568": 1 // Euros to Rubles
        };
        // except fence, lighthouse keeper
        const currencyTradersId = [
            "58330581ace78e27b8b10cee", // skier
            "5935c25fb3acc3127c3d8cd9", // peacekeeper 
        ];
        const currencyId = [
            "5449016a4bdc2d6f028b456f", // Rubles
            "5696686a4bdc2da3298b456a", // Dollars
            "569668774bdc2da2298b4568" // Euros
        ];
        // cache offers that use currency instead of barter
        for (const traderId of currencyTradersId) {
            const assort = traders[traderId].assort;
            for (const item of assort.items) {
                const tpl = item._tpl;
                const barterSchemes = assort.barter_scheme[item._id];
                if (currencyId.includes(tpl) && Array.isArray(barterSchemes)) {
                    for (const scheme of barterSchemes[0]) {
                        if (scheme._tpl === "5449016a4bdc2d6f028b456f") {
                            this.currency_price_in_rouble[tpl] = scheme.count;
                        }
                    }
                }
            }
        }
        this.logger.debug(this.currency_price_in_rouble);
    }
    getRealisticPriceCache(container) {
        const cache = {};
        const databaseServer = container.resolve("DatabaseServer");
        const itemsDump = databaseServer.getTables().templates.prices;
        const currencyMap = {
            "ruble": "5449016a4bdc2d6f028b456f",
            "dollar": "5696686a4bdc2da3298b456a",
            "eur": "569668774bdc2da2298b4568"
        };
        // cache offers that use currency instead of barter from trader
        for (const itemId of Object.keys(itemsDump)) {
            const customPrice = this.config.realistic_price.custom_price[itemId];
            if (customPrice !== undefined) {
                cache[itemId] = [[{ count: customPrice.price, _tpl: currencyMap[customPrice.currency] }]];
            }
            else if (itemsDump[itemId] > 0) {
                cache[itemId] = [[{ count: itemsDump[itemId], _tpl: "5449016a4bdc2d6f028b456f" }]];
            }
        }
        return cache;
    }
}
exports.AIOTrader = AIOTrader;
//# sourceMappingURL=aio_trader.js.map