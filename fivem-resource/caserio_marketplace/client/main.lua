local QBCore = exports['qb-core']:GetCoreObject()
local isMenuOpen = false

local function toggleNuiFrame(shouldShow)
    isMenuOpen = shouldShow
    SetNuiFocus(shouldShow, shouldShow)
    SendNUIMessage({
        action = 'setVisible',
        data = shouldShow
    })
end

RegisterCommand('openshop', function()
    print('[Caserio] /openshop executed. Triggering server event...')
    -- Request authoritative data from server
    TriggerServerEvent('caserio_marketplace:requestOpenShop')
end)

RegisterNetEvent('caserio_marketplace:openShopUI', function(data)
    -- Update UI with server data
    SendNUIMessage({
        action = 'updatePlayerData',
        data = {
            name = data.name,
            money = data.money,
            coins = data.coins
        }
    })
    
    toggleNuiFrame(true)
end)

RegisterNUICallback('hideFrame', function(_, cb)
    toggleNuiFrame(false)
    cb({})
end)

-- Get store URL for package
RegisterNUICallback('getStoreUrl', function(data, cb)
    local url = Config.StoreUrl
    local pkgId = data.packageId

    if pkgId and Config.CoinPackages[pkgId] and Config.CoinPackages[pkgId].tebex_package_id then
        url = Config.StoreUrl .. "package/" .. Config.CoinPackages[pkgId].tebex_package_id
    end

    cb({ url = url })
end)

-- User initiated purchase - can be used for tracking
RegisterNUICallback('purchaseInitiated', function(data, cb)
    -- Optional: Log to server for analytics
    TriggerServerEvent('caserio_marketplace:purchaseInitiated', data.packageId, data.amount, data.price)
    cb({})
end)

-- Legacy openStore - kept for compatibility
RegisterNUICallback('openStore', function(data, cb)
    local url = Config.StoreUrl
    local pkgId = data.packageId

    if pkgId and Config.CoinPackages[pkgId] and Config.CoinPackages[pkgId].tebex_package_id then
        url = Config.StoreUrl .. "package/" .. Config.CoinPackages[pkgId].tebex_package_id
    end

    cb({ url = url })
end)

RegisterNUICallback('exchangeMoney', function(data, cb)
    TriggerServerEvent('caserio_marketplace:exchangeMoney', data.amount)
    cb({})
end)

RegisterNUICallback('buyItem', function(data, cb)
    TriggerServerEvent('caserio_marketplace:buyItem', data)
    cb({})
end)

RegisterNUICallback('buyVehicle', function(data, cb)
    TriggerServerEvent('caserio_marketplace:buyVehicle', {
        vehicleId = data.vehicleId,
        plate = data.plate
    })
    cb({})
end)

RegisterNUICallback('buyWeapon', function(data, cb)
    TriggerServerEvent('caserio_marketplace:buyWeapon', {
        weaponId = data.weaponId
    })
    cb({})
end)

-- Server triggers this when Tebex confirms payment
RegisterNetEvent('caserio_marketplace:purchaseConfirmed', function()
    SendNUIMessage({ action = 'purchaseConfirmed' })
    -- Also refresh player data
    TriggerEvent('caserio_marketplace:updateData')
end)

RegisterNetEvent('caserio_marketplace:updateData', function(data)
    if isMenuOpen then
        -- Server sends authoritative data
        local money = data and data.money or 0
        local coins = data and data.coins or 0
        local name = data and data.name or "Player"

        SendNUIMessage({
            action = 'updatePlayerData',
            data = {
                name = name,
                money = money,
                coins = coins
            }
        })
    end
end)

-- ============================================
-- PAYMENT STATUS (Toast notifications)
-- ============================================

RegisterNetEvent('caserio_marketplace:paymentStatus', function(data)
    SendNUIMessage({
        action = 'paymentStatus',
        data = data
    })
end)

-- ============================================
-- P2P MARKETPLACE CALLBACKS
-- ============================================

RegisterNUICallback('getActiveListings', function(_, cb)
    TriggerServerEvent('caserio_marketplace:getActiveListings')
    cb({})
end)

RegisterNUICallback('getMyListings', function(_, cb)
    TriggerServerEvent('caserio_marketplace:getMyListings')
    cb({})
end)

RegisterNUICallback('getMyVehicles', function(_, cb)
    TriggerServerEvent('caserio_marketplace:getMyVehicles')
    cb({})
end)

RegisterNUICallback('getMyWeapons', function(_, cb)
    TriggerServerEvent('caserio_marketplace:getMyWeapons')
    cb({})
end)

RegisterNUICallback('createVehicleListing', function(data, cb)
    TriggerServerEvent('caserio_marketplace:createVehicleListing', {
        vehicleId = data.vehicleId,
        price = data.price
    })
    cb({})
end)

RegisterNUICallback('createWeaponListing', function(data, cb)
    TriggerServerEvent('caserio_marketplace:createWeaponListing', {
        weaponSlot = data.weaponSlot,
        price = data.price
    })
    cb({})
end)

RegisterNUICallback('cancelListing', function(data, cb)
    TriggerServerEvent('caserio_marketplace:cancelListing', data.listingId)
    cb({})
end)

RegisterNUICallback('buyListing', function(data, cb)
    TriggerServerEvent('caserio_marketplace:buyListing', {
        listingId = data.listingId,
        customPlate = data.customPlate
    })
    cb({})
end)

-- Server sends listings data
RegisterNetEvent('caserio_marketplace:receiveListings', function(listings)
    SendNUIMessage({
        action = 'receiveListings',
        data = listings
    })
end)

RegisterNetEvent('caserio_marketplace:receiveMyListings', function(listings)
    SendNUIMessage({
        action = 'receiveMyListings',
        data = listings
    })
end)

RegisterNetEvent('caserio_marketplace:receiveMyVehicles', function(vehicles)
    SendNUIMessage({
        action = 'receiveMyVehicles',
        data = vehicles
    })
end)

RegisterNetEvent('caserio_marketplace:receiveMyWeapons', function(weapons)
    SendNUIMessage({
        action = 'receiveMyWeapons',
        data = weapons
    })
end)

-- ============================================
-- DYNAMIC SHOP CALLBACKS
-- ============================================

RegisterNUICallback('getShopItems', function(_, cb)
    QBCore.Functions.TriggerCallback('caserio_shop:getShopItems', function(items)
        cb(items)
    end)
end)

RegisterNUICallback('addShopItem', function(data, cb)
    TriggerServerEvent('caserio_shop:addItem', data)
    cb({})
end)

RegisterNUICallback('editShopItem', function(data, cb)
    TriggerServerEvent('caserio_shop:editItem', data)
    cb({})
end)

RegisterNUICallback('deleteShopItem', function(data, cb)
    TriggerServerEvent('caserio_shop:deleteItem', data.itemId)
    cb({})
end)

RegisterNetEvent('caserio_shop:refresh', function()
    SendNUIMessage({
        action = 'shopItemsUpdated'
    })
end)

