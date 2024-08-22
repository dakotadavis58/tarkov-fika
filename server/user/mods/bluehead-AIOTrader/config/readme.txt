# Config Notes
	enable: toggle the whole mod
	enable_aio_trader: toggle the aio trader
	enable_bluehead_trader: toggle the bluehead trader
	enable_aio_injector_case: toggle the aio injector case
	
	realistic_price.enable: toggle the realistic_price
	realistic_price.custom_price: force aio to sell specific items at the price you specify
	realistic_price.hide_no_price_item: let aiotrader not sell items without realistic price

# Compatibility Notes

when you encounter compatibility issues with other mods, please try the following steps,

if you dont need aio_key_case
    set enable_bluehead_trader to fasle
    set enable_aio_injector_case to fasle
    restart the server and client

if you need aio_key_case
    set enable_bluehead_trader to true
    set enable_aio_injector_case to true

    buy case from the bluehead_trader

    set enable_bluehead_trader to false
    restart the server and client

The above steps should maximize the compatibility of this mod, but it is not guaranteed to be compatible with all mods, please leave a comment if you still have problems