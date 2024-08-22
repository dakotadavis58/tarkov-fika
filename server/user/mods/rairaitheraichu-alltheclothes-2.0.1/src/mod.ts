import { container, DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { VFS } from "@spt/utils/VFS";
import { ICustomizationItem } from "@spt/models/eft/common/tables/ICustomizationItem";
import * as scavSuitLocale from "../db/locale.json";
import path from "path";
import { jsonc } from "jsonc";


class AllTheClothes implements IPostDBLoadMod  
{
    private config;
    private container: DependencyContainer;
    private serverDatabase = container.resolve<DatabaseServer>("DatabaseServer");
    private logger = container.resolve<ILogger>("WinstonLogger");

    private traderFixPlugin;

    private IsPluginLoaded(): boolean
    {
        const fs = require('fs');
        const pluginName = "traderservicesfix.dll";

        // Fails if there's no ./BepInEx/plugins/ folder
        try
        {
            // The recursive property returns the relative path, so we're going to split it and take the last element only
            const pluginList = fs.readdirSync("./BepInEx/plugins", { recursive: true })
                .map(plugin => plugin.split('\\')
                    .slice(-1)[0]
                    .toLowerCase());

            return pluginList.includes(pluginName);
        }
        catch { return false; }
    }

    public postDBLoad(container: DependencyContainer): void 
    {
        this.container = container;

        const vfs = container.resolve<VFS>("VFS");
        this.config = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));

        // Checking if we need to bother checking for the TraderServicesFix.dll plugin
        // Checking the config option, and checking if Fence is going to be used at all
        if (this.config.SkipTraderFixPluginCheck || this.config.UseRagmanInsteadOfFence)
        {
            this.traderFixPlugin = true;
        }
        else 
        {
            this.traderFixPlugin = this.IsPluginLoaded();
        }

        // Warn the user that the server doesn't find the TraderServicesFix.dll, and suggest the config option (if this is intentional)
        if (!this.traderFixPlugin)
        {
            this.logger.error(`Plugin "TraderServicesFix.dll not found! Clothing will be added to Ragman instead, regardless of settings.\n
            If you're running the server from outside the game folder, set "SkipTraderFixPluginCheck" to "true" in the config!`);
        }

        // Set Ragman's clothes to free
        if (this.config.AllPMCClothesFree) this.unlockVanillaClothing();

        // Allow scav/usec/bear clothes/heads/voices to be used, as necessary
        this.unlockFactionalCustomization();

        // Create entries in the customization db, as necessary
        this.generateHands();
        this.generateHeads();
        this.createClothing();
        this.generateKits();

        // Push all kits to the trader(s)
        this.generateTraderAssort();

        // Add localization to the db
        this.createLocalization();

        // Debug info, commented out
        /*
        const fs = require('fs');
        fs.writeFileSync(`customization.json`, JSON.stringify(this.serverDatabase.getTables().templates.customization));
        fs.writeFileSync(`fence.json`, JSON.stringify(this.serverDatabase.getTables().traders["579dc571d53a0658a154fbec"].suits));
        fs.writeFileSync(`ragman.json`, JSON.stringify(this.serverDatabase.getTables().traders["5ac3b934156ae10c4430e83c"].suits));
        */
    }

    private unlockFactionalCustomization(): void
    {
        // USEC + BEAR unification
        // (this is for clothing, voices, heads)
        // Lots of this function depend on the config settings...
        // Adding USEC + BEAR to Savage-only sides
        // Allowing the unlocking/equipping of the opposite faction's clothing
        const customizationDb = this.serverDatabase.getTables().templates.customization;
        const characterDb = this.serverDatabase.getTables().templates.character;

        for (let entry in customizationDb)   
        {
            let parent = customizationDb[entry]._parent;

            // Clothing
            if (parent === "5cd944ca1388ce03a44dc2a4"       // kits
                || parent === "5cd944d01388ce000a659df9")    // lower suite
            {
                if (customizationDb[entry]._props.Side.includes("Savage")
                    && this.config.UnlockScavClothing === true)
                {
                    customizationDb[entry]._props.Side = ["Usec", "Bear", "Savage"];

                    if (!characterDb.includes(entry)) 
                    {
                        characterDb.push(entry);
                    }
                    continue;
                }
                else if ((customizationDb[entry]._props.Side.includes("Bear")
                    || customizationDb[entry]._props.Side.includes("Usec"))
                    && this.config.UnlockFactionalClothing === true)
                {
                    customizationDb[entry]._props.Side = ["Usec", "Bear", "Savage"];

                    if (!characterDb.includes(entry)) 
                    {
                        characterDb.push(entry);
                    }
                    continue;
                }
            }

            // Heads
            if (customizationDb[entry]._id === "5d5f8ba486f77431254e7fd2") 
            {
                continue;    // The "empty" head, we're skipping this now
            }

            if (customizationDb[entry]._parent === "5cc085e214c02e000c6bea67")
            {
                if (this.config.UnlockFactionalHeads === true)
                {
                    customizationDb[entry]._props.Side = ["Usec", "Bear", "Savage"];

                    if (!characterDb.includes(entry)) 
                    {
                        characterDb.push(entry);
                    }
                    continue;
                }
            }

            // Voices
            if (customizationDb[entry]._parent === "5fc100cf95572123ae738483")
            {
                if (this.config.UnlockFactionalVoices === true)
                {
                    if (entry == "5fc100cf95572123ae738483") continue;

                    customizationDb[entry]._props.Side = ["Usec", "Bear", "Savage"];

                    if (!characterDb.includes(entry)) 
                    {
                        characterDb.push(entry);
                    }
                    continue;
                }
            }
        }
    }



    private unlockVanillaClothing(): void
    {
        // Iterate over ragman's suit offers, set cost/requirements to 0
        const ragmanSuits = this.serverDatabase.getTables().traders["5ac3b934156ae10c4430e83c"].suits;
        for (let suitOffer in ragmanSuits) 
        {
            ragmanSuits[suitOffer].requirements =
            {
                loyaltyLevel: 0,
                profileLevel: 0,
                standing: 0,
                skillRequirements: [],
                questRequirements: [],
                itemRequirements: []
            };
        }
    }

    private createClothing(): void
    {
        // Create the upper/lower body entries in customization.json for new entries

        const customizationDb = this.serverDatabase.getTables().templates.customization;
        const characterDb = this.serverDatabase.getTables().templates.character;

        for (var clothing in this.config.customEntries)   
        {
            const clothingDetails = this.config.customEntries[clothing];
            customizationDb[clothingDetails._id] = clothingDetails as ICustomizationItem;

            characterDb.push(clothingDetails._id);
        }

    }

    private generateHeads(): void
    {
        if (this.config.UnlockScavHeads !== true) return;

        const customizationDb = this.serverDatabase.getTables().templates.customization;
        const characterDb = this.serverDatabase.getTables().templates.character;

        for (let head in this.config.heads) 
        {
            customizationDb[this.config.heads[head]._id] = this.config.heads[head] as ICustomizationItem;
            characterDb.push(this.config.heads[head]._id);
        }

        // BRING BACK THE CIG SCAV
        // <3
        customizationDb["5d28afe786f774292668618d"]._props.Prefab.path =
            "assets/content/characters/character/prefabs/wild_head_3.bundle";
    }

    private generateHands(): void
    {
        // Create the hand entries in customization.json for new entries
        const customizationDb = this.serverDatabase.getTables().templates.customization;
        for (const handEntry in this.config.hands)
        {
            let newHand =
            {
                "_id": this.config.hands[handEntry].id as string,
                "_name": handEntry as string,
                "_parent": "5cc086a314c02e000c6bea69",
                "_type": "Item",
                "_props": {
                    "Name": "DefaultBearHands",
                    "ShortName": "DefaultBearHands",
                    "Description": "DefaultBearHands",
                    "Side": [
                        "Bear",
                        "Usec",
                        "Savage"
                    ],
                    "BodyPart": "Hands",
                    "Prefab": {
                        "path": this.config.hands[handEntry].bundle as string,
                        "rcid": ""
                    },
                    "WatchPrefab": {
                        "path": "",
                        "rcid": ""
                    },
                    "IntegratedArmorVest": false,
                    "WatchPosition": {
                        "x": 0,
                        "y": 0,
                        "z": 0
                    },
                    "WatchRotation": {
                        "x": 0,
                        "y": 0,
                        "z": 0
                    }
                }
            };
            customizationDb[newHand._id] = newHand as ICustomizationItem;
        }
    }

    private generateKits(): void
    {
        // Create the suite/kits for uppers in customization.json
        const customizationDb = this.serverDatabase.getTables().templates.customization;
        const suiteDetails = this.config.needKit;

        for (var kit in suiteDetails.tops)   
        {
            // Create a kit entry.
            let newKit =
            {
                _id: suiteDetails.tops[kit].id,
                _name: kit + "_kit",
                _parent: "5cd944ca1388ce03a44dc2a4",
                _type: "Item",
                _props:
                {
                    Name: kit,
                    ShortName: kit,
                    Description: kit,
                    Side: ["Usec", "Bear", "Savage"],
                    AvailableAsDefault: false,
                    Body: suiteDetails.tops[kit].body,
                    Hands: suiteDetails.tops[kit].hands
                },
                _proto: "5cde9ec17d6c8b04723cf479"
            };
            customizationDb[newKit._id] = newKit as ICustomizationItem;
        }

        for (var suite in suiteDetails.lowers)   
        {
            // Create a kit entry.
            let newKit =
            {
                _id: suiteDetails.lowers[suite].id,
                _name: suite + "_suite",
                _parent: "5cd944d01388ce000a659df9",
                _type: "Item",
                _props:
                {
                    Name: suite,
                    ShortName: suite,
                    Description: suite,
                    Side: ["Usec", "Bear", "Savage"],
                    AvailableAsDefault: false,
                    Feet: suiteDetails.lowers[suite].feet
                }
            };
            customizationDb[newKit._id] = newKit as ICustomizationItem;
        }
    }

    private generateTraderAssort(): void
    {
        // Add kits to the appropriate traders
        const traderDb = this.serverDatabase.getTables().traders;

        for (const tradeEntry in this.config.needTrade)
        {
            if (!this.config.needTrade[tradeEntry].availability) continue;

            let traderId = "";

            // Checking all the possible cases where we would want to push the clothing to Ragman's offers instead
            if (this.config.UseRagmanInsteadOfFence
                || this.config.needTrade[tradeEntry].ragman
                || !this.traderFixPlugin)
            {
                traderId = "5ac3b934156ae10c4430e83c";   // Ragman
            }
            else
            {
                traderId = "579dc571d53a0658a154fbec"; // Fence
            }

            let newTraderOffer =
                [{
                    _id: this.config.needTrade[tradeEntry].suiteTradeID,
                    tid: traderId,
                    suiteId: this.config.needTrade[tradeEntry].kitToSell,
                    isActive: true,
                    requirements:
                    {
                        loyaltyLevel: this.config.AllScavClothesFree ? 0 : this.config.needTrade[tradeEntry].tradeRequirements.loyaltyLevel,
                        profileLevel: this.config.AllScavClothesFree ? 0 : this.config.needTrade[tradeEntry].tradeRequirements.profileLevel,
                        standing: this.config.AllScavClothesFree ? 0 : this.config.needTrade[tradeEntry].tradeRequirements.standing,
                        skillRequirements: this.config.AllScavClothesFree ? [] : this.config.needTrade[tradeEntry].tradeRequirements.skillRequirements,
                        questRequirements: this.config.AllScavClothesFree ? [] : this.config.needTrade[tradeEntry].tradeRequirements.questRequirements,
                        itemRequirements: this.config.AllScavClothesFree ? [] : this.config.needTrade[tradeEntry].tradeRequirements.itemRequirements
                    }
                }];

            if (traderDb[newTraderOffer[0].tid].suits)
            {
                let traderSuits = traderDb[newTraderOffer[0].tid].suits;
                traderSuits.push(...newTraderOffer);
                traderDb[newTraderOffer[0].tid].suits = traderSuits;
            }
            else
            {
                traderDb[newTraderOffer[0].tid].suits = newTraderOffer;
            }
        }

        // If Fence has any clothing offers, set him as a customization seller (this doesn't seem to really matter much anymore though)
        if (traderDb["579dc571d53a0658a154fbec"].suits)
        {
            traderDb["579dc571d53a0658a154fbec"].base.customization_seller = true;
        }
    }

    private createLocalization(): void
    {
        // Append the localization file contents to the locale dbs
        const localeDb = this.serverDatabase.getTables().locales.global;

        for (const localeID in localeDb)
        {
            if (localeID in scavSuitLocale)
            {
                var modLocale = scavSuitLocale[localeID];
            }
            else
            {
                var modLocale = scavSuitLocale["en"];   // Defalt back to en for nonexistent lang keys.
            }

            // Delete existing undefined keys for head models (new rogue bosses, sanitar).
            const localeEntryTypes = ["Name", "ShortName", "Description"];
            for (let entryType in localeEntryTypes)
            {
                delete localeDb[localeID][`6287b0d239d8207cb27d66c7 ${localeEntryTypes[entryType]}`];
                delete localeDb[localeID][`628b57d800f171376e7b2634 ${localeEntryTypes[entryType]}`];
                delete localeDb[localeID][`628b57d800f171376e7b2634 ${localeEntryTypes[entryType]}`];
                delete localeDb[localeID][`5fc615710b735e7b024c76ed ${localeEntryTypes[entryType]}`];
                delete localeDb[localeID][`62875ad50828252c7a28b95c ${localeEntryTypes[entryType]}`];
            }

            for (let template in modLocale)
            {
                localeDb[localeID][`${template} Name`] = modLocale[template].Name;
                localeDb[localeID][`${template} ShortName`] = modLocale[template].ShortName;
                localeDb[localeID][`${template} Description`] = modLocale[template].Description;
            }
        }
    }




}

module.exports = { mod: new AllTheClothes() };