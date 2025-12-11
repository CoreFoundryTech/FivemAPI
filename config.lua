Config = {}

-- URL de tu tienda Tebex (o web personalizada)
Config.StoreUrl = "https://caserio-rp.tebex.io/" 

-- Tasa de cambio: Cuánto dinero del juego cuesta 1 Coin
Config.ExchangeRate = 1000 -- $1000 Dinero Juego = 1 Caserio Coin

-- Paquetes de Monedas (Real Money -> Coins)
Config.CoinPackages = {
    ['caseriomarket'] = {
        app = 'caseriomarket',
        color = '#2563eb',
        icon = 'marketplace_icon.svg',
        tooltipText = 'Marketplace',
        tooltipPos = 'bottom',
        reward_coins = 12000,
        description = "12,000 Caserio Coins (+2000 Bonus)",
        tebex_package_id = 7158766 -- ID real de Tebex
    },
    ['coins_25000'] = {
        label = "Paquete Pro",
        price = 20, -- USD
        reward_coins = 25000,
        description = "25,000 Caserio Coins (+5000 Bonus)"
    },
    ['coins_65000'] = {
        label = "Paquete Élite",
        price = 50, -- USD
        reward_coins = 65000,
        description = "65,000 Caserio Coins (+15000 Bonus)"
    }
}

-- Garage por defecto para vehículos comprados
Config.DefaultGarage = "pillboxgarage"

-- Items del Shop (Vehículos y Armas)
Config.ShopItems = {
    vehicles = {
        { id = "adder", label = "Adder", price = 50000, model = "adder", category = "supercar" },
        { id = "zentorno", label = "Zentorno", price = 45000, model = "zentorno", category = "supercar" },
        { id = "insurgent", label = "Insurgent", price = 80000, model = "insurgent", category = "military" },
        { id = "sultanrs", label = "Sultan RS", price = 25000, model = "sultanrs", category = "sports" },
    },
    weapons = {
        -- Armas básicas (sin skin)
        { id = "pistol", label = "Pistola", price = 500, item = "weapon_pistol" },
        { id = "smg", label = "SMG", price = 2000, item = "weapon_smg" },
        { id = "carbine", label = "Carabina", price = 5000, item = "weapon_carbinerifle" },
        
        -- Armas con skin/tint
        { id = "pistol_gold", label = "Pistola Dorada", price = 3000, item = "weapon_pistol", tint = 5 },
        { id = "pistol_pink", label = "Pistola Rosa", price = 2500, item = "weapon_pistol", tint = 6 },
        
        -- Armas con attachments
        { id = "smg_silenced", label = "SMG Silenciada", price = 4000, item = "weapon_smg", 
          attachments = {"COMPONENT_AT_AR_SUPP_02"} },
        { id = "carbine_tactical", label = "Carabina Táctica", price = 10000, item = "weapon_carbinerifle",
          attachments = {"COMPONENT_AT_AR_SUPP", "COMPONENT_AT_AR_FLSH", "COMPONENT_AT_SCOPE_MEDIUM"},
          tint = 1 },
    }
}
