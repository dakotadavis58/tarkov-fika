# All The Clothes v2.0.1
Author: RaiRaiTheRaichu
Original Authors: JustNU, Senko, Ereshkigal, Baliston

### ---BUILT FOR SPT VERSION 3.9.5---

### ---NOTICE---

This mod now requires the TraderServicesFix mod. BSG has changed how the trader services menu works, and a mod is now required to enable them.
All The Clothes will check for the plugin on server start, and if it is not found, it will automatically place all clothing to Ragman instead.
If you are not running the server from your game client folder (using a dedicated server, using Fika on another PC, etc) you can disable this check in the config. Just be aware the TraderServicesFix and this mod's BepInEx folder must be installed on your client(s).


Inspired and built upon SellScavSuits, this mod adds all Scav/Raider/Boss etc clothing to unlock from Fence. You can navigate to the Services tab at the top of Fence's trade screen to view all the new clothing! 

Furthermore, check out the mod's config.json for more options! You can remove all the unlock requirements (some clothing requires quests, skills, items, and levels!), change them to whatever you'd like, and toggle some new features that allow you to fully customize your character further than ever before!

You can:
- Choose scav and boss voices for your PMC!
- Choose scav and boss faces for your PMC! (Only available at profile creation - see "Swapping Heads" to change head models on existing profiles.)
- Choose any faction voice for your PMC! Play as a USEC with a Bear voice (including the new English Bear voices!) or vice versa!
- Choose any faction clothing for your PMC! Dress in your favorite Bear clothing as a USEC, or dress up as a USEC as a Bear!
- Disable the unlock requirements for all these new Scav/Boss clothes! Wear whatever you want right at the start for maximum roleplay!
- Come up with your own unlocks and rebalance them however you'd like!

If you'd like to rename some of the new clothing/head/voices, the localization can be found within "./db/locale.json".
Remember, you can change your voice at any time in the game's Settings, in the Audio tab.

Feel free to leave a comment or contact me using Discord if you have any suggestions or have any issues!

## ---INSTALL INFO---

How to install:
Drag and drop the included `user` and `BepInEx` folders from this zip into your SPT folder, allow it to merge with your existing folders.

If you're updating from an older version, please be sure to delete the old mod from your folder.

## ---CHANGELOGS---

#### v1.1.0 Changelog: 
- Added first person arms/hands to every clothing! Now you can see the proper hands for all clothing.
- Added Killa's pants to Ragman.
- Added config option to make all default clothing (clothes already on Ragman) free as well.
- Added config option to use Ragman for all new clothing instead of Fence.
- Added custom language file support.
- Added Russian language support (thanks Sk1p36!)
- Tagilla's/Shturman's head is no longer packaged with his top.
- Tagilla's head can now be selected at character creation on its own.
- Minor change to the version in the package.json, compatible with version 3.2.3 of SPT.

#### v1.1.1 Changelog:
- Fixed issue with Big Pipe and Sanitar tops causing loading issues.
- Fixed issue with Overview tab breaking if you updated from v1.0.0.
- Tying in to the previous change, clothing you previously unlocked in v1.0.0 are now carried over, assuming you haven't already repurchased them.
- Minor change to the version in the package.json, compatible with version 3.2.4 of SPT.

#### v1.1.2 Changelog:
- Fixed issue where the save sanitizing feature would crash the server upon loading a newly created profile.
- Fixed issue where some SCAV clothing had the incorrect first person hand meshes.
- Minor refactors to the save sanitizing feature for compatibility with version 3.3.0 of SPT.
- Minor change to the version in the package.json, compatible with version 3.3.0 of SPT.

#### v1.2.0 Changelog: 
- Major refactor to localization to comply with new standards as of client version 20765.
- Minor change to the version in the package.json, compatible with version 3.4.0 of SPT.

#### v1.3.0 Changelog: 
- Added new clothing with the EFT 0.12.13 patch - "Victory" clothing set and "Zryachiy" clothing set.
- Added hand mesh for Zryachiy's ghillie suit.
- Minor refactors to handle clothing/heads/voices not being added to the player customization list.
- Minor change to the version in the package.json, compatible with version 3.5.0 of SPT.

#### v1.4.0 Changelog
- Added new clothing with the EFT 0.13.5 Patch - Kaban's clothing* and new Scav Feldparka
- Added hand mesh for Kaban's clothing
- Added playable head model for Kaban*
- Added two new voices for the Bloodhound characters
- Slight localization changes
- Russian translation now up to date (thanks JustNU!)
- Refactored the config to jsonc - comments are now being used for additional clarity
- Minor change to the version in the package.json, compatible with version 3.7.0 of SPT and above.

* Clipping issues currently exist for Kaban due to his larger model. These issues will be rectified in a later patch, optional variants that better fit the standard playermodel will be included.

#### v1.5.0 Changelog
- Minor code refactor
- Added all new clothing for the EFT 0.14.0 Patch - Kollontay's clothing* and new Scav leather jackets
- Added hand meshes for the new clothing
- Added playable head model for Kollontay*
- Added new voices for Kollontay, Kaban, and Shturman
- New custom-made "Hood Down" variant of Shturman's Parka by me, no more clipping with headgear or certain heads
- Removed "Empty" head for player, this hasn't been needed for awhile after Shturman and Tagilla had custom top meshes
- Russian translation up to date once more (thanks JustNU!)
- Minor change to the version in the package.json, compatible with version 3.8.0 of SPT and above.

* Clipping issues currently exist for Kollontay due to his larger model. These issues will be rectified in a later patch, optional variants that better fit the standard playermodel will be included.

#### v2.0.0 Changelog
- Complete mod rewrite! Everything is refactored, so check out the new config.jsonc file for options
- Added new cultist jacket (replacing the old one, you can re-enable it in the config)
- Added six new tops/bottoms, three for each PMC faction, to Ragman by default
- Minor material improvements to custom-built bundles
- First pass of bundle compression, file size has been reduced substantially
- Minor change to the version in the package.json, compatible with version 3.9.0 of SPT and above

#### v2.0.1 Changelog
- Hotfix for missing custom head entries + Cig Scav head mesh


## ---SWAPPING HEADS---

Make sure your server is shut down!

Open your profile's .json located within `user/profiles` with any text editor (preferably Notepad ++).

Look for a line starting with `"Head": `, which should be near the top, right below `"Customization": {`.

Swap the ID for the head for any of the following, and save your profile:

`"5cc084dd14c02e000b0550a3"` for: Bear - Vasilyev
`"5fdb7571e4ed5b5ea251e529"` for: Bear - Volkov
`"60a6aaad42fd2735e4589978"` for: Bear - Gavrilov
`"619f94f5b90286142b59d45f"` for: Bear - Kolesnikov
`"62a9e7d15ea3b87d6f642a28"` for: Bear - Danilov

`"5cde96047d6c8b20b577f016"` for: USEC - Taylor
`"5fdb5950f5264a66150d1c6e"` for: USEC - Foreman
`"5fdb4139e4ed5b5ea251e4ed"` for: USEC - Hudson
`"60a6aa8fd559ae040d0d951f"` for: USEC - Mullen
`"62a9e7d15ea3b87d6f642a28"` for: USEC - Grant

`"5fc614290b735e7b024c76e5"` for: SCAV - Drozd
`"5f68c4a7c174a17c0f4c8945"` for: SCAV - Kot
`"5fc614390b735e7b024c76e6"` for: SCAV - Misha
`"5f68c4c217d579077152a252"` for: SCAV - Mozg
`"5fc614130b735e7b024c76e4"` for: SCAV - Sanya
`"5cc2e4d014c02e000d0115f8"` for: SCAV - Samogon
`"5fc613e10b735e7b024c76e3"` for: SCAV - Seva
`"5fc6144b0b735e7b024c76e7"` for: SCAV - Stasik
`"5cde9ff17d6c8b0474535daa"` for: SCAV - Tankist
`"5fc613c80b735e7b024c76e2"` for: SCAV - Yarik
`"5d28afe786f774292668618d"` for: Cig Scav
`"5d28b01486f77429242fc898"` for: Reshala
`"5e99767c86f7741ac7399393"` for: Sanitar
`"5d28b03e86f7747f7e69ab8a"` for: Killa
`"5d5e805d86f77439eb4c2d0e"` for: Glukhar
`"6287b0d239d8207cb27d66c7"` for: Big Pipe
`"628b57d800f171376e7b2634"` for: Birdeye
`"62875ad50828252c7a28b95c"` for: Knight
`"5fb5297a0359a84b77066e56"` for: Cultist Warrior 1
`"5fb52a537b5d1342ee24bd57"` for: Cultist Warrior 2
`"5fb52a3a1c69e5198e234118"` for: Cultist Priest
`"66a25a47f878d663dbe9c302"` for: Tagilla
`"636129784aa74b8fe30ab418"` for: Zryachiy
`"64809e3077c11aeac5078e3c"` for: Kaban
`"654b5ed58558fd71f97254f4"` for: Kollontay


## ---CONTACT---

@RaiRaiTheRaichu - Discord
user/6798-rairaitheraichu - on sp-tarkov.com 

## ---LICENSE---

NCSA Open Source License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
Neither the names of the Authors, nor the names of its contributors may be used to endorse or promote products derived from this Software without specific prior written permission.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.