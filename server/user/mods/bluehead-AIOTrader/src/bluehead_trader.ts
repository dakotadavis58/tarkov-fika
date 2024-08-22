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
import { IProcessBuyTradeRequestData } from "@spt/models/eft/trade/IProcessBuyTradeRequestData";
import { Traders } from "@spt/models/enums/Traders";
import { HashUtil } from "@spt/utils/HashUtil";

import { TraderHelper } from "./traderHelpers";
import { AIOInjectorCase } from "./aio_injector_case";
// New trader settings
import * as baseJson from "../db/bluehead_trader.json";

class BlueheadTrader implements IPreSptLoadMod, IPostDBLoadMod {
    mod: string
    logger: ILogger
    traderHelper: TraderHelper;
    hashUtil: HashUtil;

    /* must be static */
    static trader_id = baseJson._id;
    static spec_radio_transmitter_id = "62e910aaf957f2915e0a5e36";

    static keycase_assort_id = AIOInjectorCase.item_id + "114";
    static ammocase_assort_id = AIOInjectorCase.item_id + "115";
    static encoded_trasmitter_assort_id = BlueheadTrader.spec_radio_transmitter_id + "115";

    // keycase_assort_id: string;
    // ammocase_assort_id: string;
    // encoded_trasmitter_assort_id: string;

    static aio_templates = {
        "keys": [],
        "ammo": []
    };

    static encoded_transmitter_template = [
        {
            "_id": BlueheadTrader.encoded_trasmitter_assort_id,
            "_tpl": BlueheadTrader.spec_radio_transmitter_id,
            "parentId": "5fe49444ae6628187a2e78b8",
            "slotId": "hideout",
            "upd": {
                "RecodableComponent": {
                    "IsEncoded": true
                },
                "StackObjectsCount": 1,
                "SpawnedInSession": true
            }
        }
    ];

    constructor(container: DependencyContainer) {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.mod = "AIOTrader.BlueheadTrader";
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
    public postDBLoad(container: DependencyContainer): void {
        this.logger.debug(`[${this.mod}] postDb Loading... `);

        // Resolve SPT classes we'll use
        const databaseServer: DatabaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        // Get a reference to the database tables
        const tables = databaseServer.getTables();

        // Add new trader to the trader dictionary in DatabaseServer
        this.addTraderToDb(baseJson, tables, jsonUtil, container);

        this.traderHelper.addTraderToLocales(baseJson, tables, "Bluehead", baseJson.nickname, baseJson.surname, baseJson.location, "This is the cat shop");

        databaseServer.getTables().templates.items[BlueheadTrader.spec_radio_transmitter_id]._props.IsUnremovable = false;

        // aio key case
        BlueheadTrader.generate_all_belongs2parents_template(container, ["5c99f98d86f7745c314214b3", "5c164d2286f774194c5e69fa"], "keys", 1);
        // aio ammo case
        BlueheadTrader.generate_all_belongs2parents_template(container, ["5485a8684bdc2da71d8b4567"], "ammo", 99999);

        this.logger.debug(`[${this.mod}] postDb Loaded`);
    }

    /**
     * Add our new trader to the database
     * @param traderDetailsToAdd trader details
     * @param tables database
     * @param jsonUtil json utility class
     */
    private addTraderToDb(traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil, container: DependencyContainer): void {
        // Add trader to trader table, key is the traders id
        Traders[traderDetailsToAdd._id] = traderDetailsToAdd._id
        tables.traders[traderDetailsToAdd._id] = {
            suits: [],
            assort: this.createAssortTable(tables, jsonUtil, container), // assorts are the 'offers' trader sells, can be a single item (e.g. carton of milk) or multiple items as a collection (e.g. a gun)
            base: jsonUtil.deserialize(jsonUtil.serialize(traderDetailsToAdd)) as ITraderBase,
            questassort: {
                started: {},
                success: {},
                fail: {}
            } // Empty object as trader has no assorts unlocked by quests
        };
    }

    /**
     * Create assorts for trader and add milk and a gun to it
     * @returns ITraderAssort
     */
    private createAssortTable(tables: IDatabaseTables, jsonUtil: JsonUtil, container: DependencyContainer): ITraderAssort {

        // Create a blank assort object, ready to have items added
        const assortTable: ITraderAssort = {
            nextResupply: 3600,
            items: [],
            barter_scheme: {},
            loyal_level_items: {}
        }

        assortTable.items.push({
            _id: BlueheadTrader.keycase_assort_id,
            _tpl: AIOInjectorCase.item_id,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: true,
                StackObjectsCount: 99999
            },
        });

        assortTable.items.push({
            _id: BlueheadTrader.ammocase_assort_id,
            _tpl: AIOInjectorCase.item_id,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: true,
                StackObjectsCount: 99999
            },
        });

        assortTable.items.push({
            _id: BlueheadTrader.encoded_trasmitter_assort_id,
            _tpl: BlueheadTrader.spec_radio_transmitter_id,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                "RecodableComponent": {
                    "IsEncoded": true
                },
                UnlimitedCount: true,
                StackObjectsCount: 99999
            },
        });

        assortTable.barter_scheme[BlueheadTrader.keycase_assort_id] = [[{ count: 114514, _tpl: "5449016a4bdc2d6f028b456f" }]]
        assortTable.loyal_level_items[BlueheadTrader.keycase_assort_id] = 1;
        assortTable.barter_scheme[BlueheadTrader.ammocase_assort_id] = [[{ count: 1919, _tpl: "5449016a4bdc2d6f028b456f" }]]
        assortTable.loyal_level_items[BlueheadTrader.ammocase_assort_id] = 1;
        assortTable.barter_scheme[BlueheadTrader.encoded_trasmitter_assort_id] = [[{ count: 810, _tpl: "5449016a4bdc2d6f028b456f" }]]
        assortTable.loyal_level_items[BlueheadTrader.encoded_trasmitter_assort_id] = 1;
        return assortTable;
    }

    static generate_all_belongs2parents_template(container: DependencyContainer, parents: Array<string>, templateName, objectCount) {
        let count = 0;
        let database_server: DatabaseServer = container.resolve("DatabaseServer");
        let logger = container.resolve<ILogger>("WinstonLogger");

        const case_uuid = AIOInjectorCase.item_id + templateName;

        BlueheadTrader.aio_templates[templateName].push({
            "_id": case_uuid,
            "_tpl": AIOInjectorCase.item_id,
            "parentId": "5fe49444ae6628187a2e78b8",
            "slotId": "hideout",
            "upd": {
                "StackObjectsCount": 1,
                "Tag": {
                    "Color": 0,
                    "Name": templateName
                }
            }
        });

        const items = database_server.getTables().templates.items;
        for (const id in items) {
            let base = items[id];

            if (!parents.includes(base._parent)) {
                continue
            }

            let assort = {
                _id: id + templateName,
                _tpl: base._id,
                parentId: case_uuid,
                slotId: "main",
                upd: { StackObjectsCount: objectCount }
            };

            if (id === "64d4b23dc1b37504b41ac2b6") {// Rusted bloody key
                assort.parentId = "hideout";
                assort.slotId = "hideout";
            }

            BlueheadTrader.aio_templates[templateName].push(assort);
            count++;
        }


        logger.info(`BlueheadTrader: Total num of ${templateName} ${count}`);
    }

    static get_rewards_message(buyData: IProcessBuyTradeRequestData) {
        if (buyData.item_id == BlueheadTrader.keycase_assort_id) {
            return BlueheadTrader.aio_templates.keys;
        } else if (buyData.item_id == BlueheadTrader.ammocase_assort_id) {
            return BlueheadTrader.aio_templates.ammo;
        } else if (buyData.item_id == BlueheadTrader.encoded_trasmitter_assort_id) {
            return BlueheadTrader.encoded_transmitter_template;
        }

        return [];
    }
}


export { BlueheadTrader };
