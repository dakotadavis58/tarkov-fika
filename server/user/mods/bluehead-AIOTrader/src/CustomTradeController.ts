
import { inject, injectable } from "tsyringe";

import { ItemHelper } from "@spt/helpers/ItemHelper";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { TradeHelper } from "@spt/helpers/TradeHelper";
import { TraderHelper } from "@spt/helpers/TraderHelper";
import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItemEventRouterResponse } from "@spt/models/eft/itemEvent/IItemEventRouterResponse";
import { IProcessBaseTradeRequestData } from "@spt/models/eft/trade/IProcessBaseTradeRequestData";
import { IProcessBuyTradeRequestData } from "@spt/models/eft/trade/IProcessBuyTradeRequestData";
import { BackendErrorCodes } from "@spt/models/enums/BackendErrorCodes";
import { MessageType } from "@spt/models/enums/MessageType";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { EventOutputHolder } from "@spt/routers/EventOutputHolder";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { DatabaseService } from "@spt/services/DatabaseService";
import { RagfairServer } from "@spt/servers/RagfairServer";
import { LocalisationService } from "@spt/services/LocalisationService";
import { MailSendService } from "@spt/services/MailSendService";
import { RagfairPriceService } from "@spt/services/RagfairPriceService";
import { HashUtil } from "@spt/utils/HashUtil";
import { HttpResponseUtil } from "@spt/utils/HttpResponseUtil";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { RandomUtil } from "@spt/utils/RandomUtil";
import { TimeUtil } from "@spt/utils/TimeUtil";
import { RagfairOfferHelper } from "@spt/helpers/RagfairOfferHelper";


import type { DialogueHelper } from "@spt/helpers/DialogueHelper";
import type { PaymentService } from "@spt/services/PaymentService";
import { TradeController } from "@spt/controllers/TradeController";

import { BlueheadTrader } from "./bluehead_trader";

@injectable()
export class CustomTradeController extends TradeController 
{
    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("DatabaseService") protected databaseService: DatabaseService,
        @inject("EventOutputHolder") protected eventOutputHolder: EventOutputHolder,
        @inject("TradeHelper") protected tradeHelper: TradeHelper,
        @inject("TimeUtil") protected timeUtil: TimeUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("ProfileHelper") protected profileHelper: ProfileHelper,
        @inject("RagfairOfferHelper") protected ragfairOfferHelper: RagfairOfferHelper,
        @inject("TraderHelper") protected traderHelper: TraderHelper,
        @inject("RagfairServer") protected ragfairServer: RagfairServer,
        @inject("HttpResponseUtil") protected httpResponse: HttpResponseUtil,
        @inject("LocalisationService") protected localisationService: LocalisationService,
        @inject("RagfairPriceService") protected ragfairPriceService: RagfairPriceService,
        @inject("MailSendService") protected mailSendService: MailSendService,
        @inject("ConfigServer") protected configServer: ConfigServer,
        @inject("JsonUtil") protected jsonUtil: JsonUtil,
        @inject("DialogueHelper") protected dialogueHelper: DialogueHelper,
        @inject("PaymentService") protected paymentService: PaymentService
    ) 
    {
        super(logger, databaseService, eventOutputHolder, tradeHelper, timeUtil, randomUtil,
            hashUtil, itemHelper, profileHelper, ragfairOfferHelper, traderHelper, ragfairServer,
            httpResponse, localisationService, ragfairPriceService, mailSendService, configServer);

        this.logger.debug("BlueheadTrader: CustomTradeController construct");
    }

    public confirmTrading(pmcData: IPmcData, body: IProcessBaseTradeRequestData, sessionID: string): IItemEventRouterResponse 
    {
        const trader_id = BlueheadTrader.trader_id;
        const output = this.eventOutputHolder.getOutput(sessionID);
        this.logger.info("BlueheadTrader: confirmTrading in");

        if (body.tid == trader_id && body.type == "buy_from_trader") 
        {
            const buyData = <IProcessBuyTradeRequestData>body;

            for (let i = 0; i < buyData.count; i++) 
            {
                this.mailSendService.sendDirectNpcMessageToPlayer(
                    sessionID,
                    trader_id,
                    MessageType.MESSAGE_WITH_ITEMS,
                    "Here's your item.",
                    BlueheadTrader.get_rewards_message(buyData),
                    86400,
                    null,
                    null)
            }


            /// Pay for purchase
            this.paymentService.payMoney(pmcData, buyData, sessionID, output);
            if (output.warnings.length > 0) 
            {
                const errorMessage = `Transaction failed: ${output.warnings[0].errmsg}`;
                this.httpResponse.appendErrorToOutput(output, errorMessage, BackendErrorCodes.UNKNOWN_TRADING_ERROR);
            }

            this.logger.debug("BlueheadTrader: customConfirmTrading return");

            return output;
        }

        return super.confirmTrading(pmcData, body, sessionID);
    }
}