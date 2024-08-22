"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTradeController = void 0;
const tsyringe_1 = require("/snapshot/project/node_modules/tsyringe");
const ItemHelper_1 = require("/snapshot/project/obj/helpers/ItemHelper");
const ProfileHelper_1 = require("/snapshot/project/obj/helpers/ProfileHelper");
const TradeHelper_1 = require("/snapshot/project/obj/helpers/TradeHelper");
const TraderHelper_1 = require("/snapshot/project/obj/helpers/TraderHelper");
const BackendErrorCodes_1 = require("/snapshot/project/obj/models/enums/BackendErrorCodes");
const MessageType_1 = require("/snapshot/project/obj/models/enums/MessageType");
const ILogger_1 = require("/snapshot/project/obj/models/spt/utils/ILogger");
const EventOutputHolder_1 = require("/snapshot/project/obj/routers/EventOutputHolder");
const ConfigServer_1 = require("/snapshot/project/obj/servers/ConfigServer");
const DatabaseService_1 = require("/snapshot/project/obj/services/DatabaseService");
const RagfairServer_1 = require("/snapshot/project/obj/servers/RagfairServer");
const LocalisationService_1 = require("/snapshot/project/obj/services/LocalisationService");
const MailSendService_1 = require("/snapshot/project/obj/services/MailSendService");
const RagfairPriceService_1 = require("/snapshot/project/obj/services/RagfairPriceService");
const HashUtil_1 = require("/snapshot/project/obj/utils/HashUtil");
const HttpResponseUtil_1 = require("/snapshot/project/obj/utils/HttpResponseUtil");
const JsonUtil_1 = require("/snapshot/project/obj/utils/JsonUtil");
const RandomUtil_1 = require("/snapshot/project/obj/utils/RandomUtil");
const TimeUtil_1 = require("/snapshot/project/obj/utils/TimeUtil");
const RagfairOfferHelper_1 = require("/snapshot/project/obj/helpers/RagfairOfferHelper");
const TradeController_1 = require("/snapshot/project/obj/controllers/TradeController");
const bluehead_trader_1 = require("./bluehead_trader");
let CustomTradeController = class CustomTradeController extends TradeController_1.TradeController {
    logger;
    databaseService;
    eventOutputHolder;
    tradeHelper;
    timeUtil;
    randomUtil;
    hashUtil;
    itemHelper;
    profileHelper;
    ragfairOfferHelper;
    traderHelper;
    ragfairServer;
    httpResponse;
    localisationService;
    ragfairPriceService;
    mailSendService;
    configServer;
    jsonUtil;
    dialogueHelper;
    paymentService;
    constructor(logger, databaseService, eventOutputHolder, tradeHelper, timeUtil, randomUtil, hashUtil, itemHelper, profileHelper, ragfairOfferHelper, traderHelper, ragfairServer, httpResponse, localisationService, ragfairPriceService, mailSendService, configServer, jsonUtil, dialogueHelper, paymentService) {
        super(logger, databaseService, eventOutputHolder, tradeHelper, timeUtil, randomUtil, hashUtil, itemHelper, profileHelper, ragfairOfferHelper, traderHelper, ragfairServer, httpResponse, localisationService, ragfairPriceService, mailSendService, configServer);
        this.logger = logger;
        this.databaseService = databaseService;
        this.eventOutputHolder = eventOutputHolder;
        this.tradeHelper = tradeHelper;
        this.timeUtil = timeUtil;
        this.randomUtil = randomUtil;
        this.hashUtil = hashUtil;
        this.itemHelper = itemHelper;
        this.profileHelper = profileHelper;
        this.ragfairOfferHelper = ragfairOfferHelper;
        this.traderHelper = traderHelper;
        this.ragfairServer = ragfairServer;
        this.httpResponse = httpResponse;
        this.localisationService = localisationService;
        this.ragfairPriceService = ragfairPriceService;
        this.mailSendService = mailSendService;
        this.configServer = configServer;
        this.jsonUtil = jsonUtil;
        this.dialogueHelper = dialogueHelper;
        this.paymentService = paymentService;
        this.logger.debug("BlueheadTrader: CustomTradeController construct");
    }
    confirmTrading(pmcData, body, sessionID) {
        const trader_id = bluehead_trader_1.BlueheadTrader.trader_id;
        const output = this.eventOutputHolder.getOutput(sessionID);
        this.logger.info("BlueheadTrader: confirmTrading in");
        if (body.tid == trader_id && body.type == "buy_from_trader") {
            const buyData = body;
            for (let i = 0; i < buyData.count; i++) {
                this.mailSendService.sendDirectNpcMessageToPlayer(sessionID, trader_id, MessageType_1.MessageType.MESSAGE_WITH_ITEMS, "Here's your item.", bluehead_trader_1.BlueheadTrader.get_rewards_message(buyData), 86400, null, null);
            }
            /// Pay for purchase
            this.paymentService.payMoney(pmcData, buyData, sessionID, output);
            if (output.warnings.length > 0) {
                const errorMessage = `Transaction failed: ${output.warnings[0].errmsg}`;
                this.httpResponse.appendErrorToOutput(output, errorMessage, BackendErrorCodes_1.BackendErrorCodes.UNKNOWN_TRADING_ERROR);
            }
            this.logger.debug("BlueheadTrader: customConfirmTrading return");
            return output;
        }
        return super.confirmTrading(pmcData, body, sessionID);
    }
};
exports.CustomTradeController = CustomTradeController;
exports.CustomTradeController = CustomTradeController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)("WinstonLogger")),
    __param(1, (0, tsyringe_1.inject)("DatabaseService")),
    __param(2, (0, tsyringe_1.inject)("EventOutputHolder")),
    __param(3, (0, tsyringe_1.inject)("TradeHelper")),
    __param(4, (0, tsyringe_1.inject)("TimeUtil")),
    __param(5, (0, tsyringe_1.inject)("RandomUtil")),
    __param(6, (0, tsyringe_1.inject)("HashUtil")),
    __param(7, (0, tsyringe_1.inject)("ItemHelper")),
    __param(8, (0, tsyringe_1.inject)("ProfileHelper")),
    __param(9, (0, tsyringe_1.inject)("RagfairOfferHelper")),
    __param(10, (0, tsyringe_1.inject)("TraderHelper")),
    __param(11, (0, tsyringe_1.inject)("RagfairServer")),
    __param(12, (0, tsyringe_1.inject)("HttpResponseUtil")),
    __param(13, (0, tsyringe_1.inject)("LocalisationService")),
    __param(14, (0, tsyringe_1.inject)("RagfairPriceService")),
    __param(15, (0, tsyringe_1.inject)("MailSendService")),
    __param(16, (0, tsyringe_1.inject)("ConfigServer")),
    __param(17, (0, tsyringe_1.inject)("JsonUtil")),
    __param(18, (0, tsyringe_1.inject)("DialogueHelper")),
    __param(19, (0, tsyringe_1.inject)("PaymentService")),
    __metadata("design:paramtypes", [typeof (_a = typeof ILogger_1.ILogger !== "undefined" && ILogger_1.ILogger) === "function" ? _a : Object, typeof (_b = typeof DatabaseService_1.DatabaseService !== "undefined" && DatabaseService_1.DatabaseService) === "function" ? _b : Object, typeof (_c = typeof EventOutputHolder_1.EventOutputHolder !== "undefined" && EventOutputHolder_1.EventOutputHolder) === "function" ? _c : Object, typeof (_d = typeof TradeHelper_1.TradeHelper !== "undefined" && TradeHelper_1.TradeHelper) === "function" ? _d : Object, typeof (_e = typeof TimeUtil_1.TimeUtil !== "undefined" && TimeUtil_1.TimeUtil) === "function" ? _e : Object, typeof (_f = typeof RandomUtil_1.RandomUtil !== "undefined" && RandomUtil_1.RandomUtil) === "function" ? _f : Object, typeof (_g = typeof HashUtil_1.HashUtil !== "undefined" && HashUtil_1.HashUtil) === "function" ? _g : Object, typeof (_h = typeof ItemHelper_1.ItemHelper !== "undefined" && ItemHelper_1.ItemHelper) === "function" ? _h : Object, typeof (_j = typeof ProfileHelper_1.ProfileHelper !== "undefined" && ProfileHelper_1.ProfileHelper) === "function" ? _j : Object, typeof (_k = typeof RagfairOfferHelper_1.RagfairOfferHelper !== "undefined" && RagfairOfferHelper_1.RagfairOfferHelper) === "function" ? _k : Object, typeof (_l = typeof TraderHelper_1.TraderHelper !== "undefined" && TraderHelper_1.TraderHelper) === "function" ? _l : Object, typeof (_m = typeof RagfairServer_1.RagfairServer !== "undefined" && RagfairServer_1.RagfairServer) === "function" ? _m : Object, typeof (_o = typeof HttpResponseUtil_1.HttpResponseUtil !== "undefined" && HttpResponseUtil_1.HttpResponseUtil) === "function" ? _o : Object, typeof (_p = typeof LocalisationService_1.LocalisationService !== "undefined" && LocalisationService_1.LocalisationService) === "function" ? _p : Object, typeof (_q = typeof RagfairPriceService_1.RagfairPriceService !== "undefined" && RagfairPriceService_1.RagfairPriceService) === "function" ? _q : Object, typeof (_r = typeof MailSendService_1.MailSendService !== "undefined" && MailSendService_1.MailSendService) === "function" ? _r : Object, typeof (_s = typeof ConfigServer_1.ConfigServer !== "undefined" && ConfigServer_1.ConfigServer) === "function" ? _s : Object, typeof (_t = typeof JsonUtil_1.JsonUtil !== "undefined" && JsonUtil_1.JsonUtil) === "function" ? _t : Object, Object, Object])
], CustomTradeController);
//# sourceMappingURL=CustomTradeController.js.map