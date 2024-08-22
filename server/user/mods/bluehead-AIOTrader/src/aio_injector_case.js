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
exports.AIOInjectorCase = void 0;
// New item settings
const itemJson = __importStar(require("../db/aio_case.json"));
class AIOInjectorCase {
    logger;
    static item_id = "bluehead_aio_injector_case";
    constructor(container) {
        this.logger = container.resolve("WinstonLogger");
        this.addItemToDB(container);
        this.writeLocale(container);
        this.modifyContainerFilter(container);
    }
    modifyContainerFilter(container) {
        let database_server = container.resolve("DatabaseServer");
        const items = database_server.getTables().templates.items;
        const container_paraent_id = "5448bf274bdc2dfc2f8b456a";
        for (const id in items) {
            if (items[id]._parent == container_paraent_id) {
                try {
                    items[id]._props.Grids[0]._props.filters[0].Filter.push(AIOInjectorCase.item_id);
                }
                catch (e) {
                    this.logger.warning(`modifyContainerFilter faild on ${id}:${items[id]._props.Name}`);
                    continue;
                }
            }
        }
    }
    writeLocale(container) {
        let database_server = container.resolve("DatabaseServer");
        let locales = database_server.getTables().locales.global;
        for (const lang in locales) {
            locales[lang][`${AIOInjectorCase.item_id} Name`] = "bluehead's All In One Case";
            locales[lang][`${AIOInjectorCase.item_id} ShortName`] = "";
            locales[lang][`${AIOInjectorCase.item_id} Description`] = `bluehead's All In One Case`;
        }
    }
    addItemToDB(container) {
        let database_server = container.resolve("DatabaseServer");
        let items = database_server.getTables().templates.items;
        const jsonUtil = container.resolve("JsonUtil");
        items[AIOInjectorCase.item_id] = jsonUtil.deserialize(jsonUtil.serialize(itemJson));
    }
    ;
}
exports.AIOInjectorCase = AIOInjectorCase;
//# sourceMappingURL=aio_injector_case.js.map