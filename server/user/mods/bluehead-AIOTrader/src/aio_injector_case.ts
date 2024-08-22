import { DependencyContainer } from "tsyringe";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ILogger } from "@spt/models/spt/utils/ILogger";

// New item settings
import * as itemJson from "../db/aio_case.json";

class AIOInjectorCase {
    logger: ILogger;

    static item_id = "bluehead_aio_injector_case";

    constructor(container: DependencyContainer) {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.addItemToDB(container);
        this.writeLocale(container);
        this.modifyContainerFilter(container);
    }

    private modifyContainerFilter(container: DependencyContainer) {
        let database_server: DatabaseServer = container.resolve("DatabaseServer");
        const items = database_server.getTables().templates.items;
        const container_paraent_id = "5448bf274bdc2dfc2f8b456a";

        for (const id in items) {
            if (items[id]._parent == container_paraent_id) {
                try {
                    items[id]._props.Grids[0]._props.filters[0].Filter.push(AIOInjectorCase.item_id);
                } catch (e) {
                    this.logger.warning(`modifyContainerFilter faild on ${id}:${items[id]._props.Name}`)
                    continue
                }
            }
        }
    }

    private writeLocale(container: DependencyContainer) {
        let database_server: DatabaseServer = container.resolve("DatabaseServer");
        let locales = database_server.getTables().locales.global;
        for (const lang in locales) {
            locales[lang][`${AIOInjectorCase.item_id} Name`] = "bluehead's All In One Case";
            locales[lang][`${AIOInjectorCase.item_id} ShortName`] = "";
            locales[lang][`${AIOInjectorCase.item_id} Description`] = `bluehead's All In One Case`;
        }
    }

    private addItemToDB(container: DependencyContainer) {
        let database_server: DatabaseServer = container.resolve("DatabaseServer");
        let items = database_server.getTables().templates.items;
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");
        items[AIOInjectorCase.item_id] = jsonUtil.deserialize(jsonUtil.serialize(itemJson));
    };

}


export { AIOInjectorCase };