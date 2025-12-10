-- ============================================
-- P2P MARKETPLACE (PLAYERS)
-- ============================================

local QBCore = Caserio.QBCore

-- Obtener listings activos
RegisterNetEvent('caserio_marketplace:getActiveListings', function()
    local src = source
    local listings = MySQL.query.await([[
        SELECT * FROM caserio_listings WHERE status = 'ACTIVE' ORDER BY created_at DESC
    ]])
    TriggerClientEvent('caserio_marketplace:receiveListings', src, listings or {})
end)

-- Obtener mis listings
RegisterNetEvent('caserio_marketplace:getMyListings', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local citizenid = Player.PlayerData.citizenid
    local listings = MySQL.query.await([[
        SELECT * FROM caserio_listings WHERE seller_citizenid = ? ORDER BY created_at DESC
    ]], {citizenid})
    
    TriggerClientEvent('caserio_marketplace:receiveMyListings', src, listings or {})
end)

-- Obtener mis vehículos disponibles para vender
RegisterNetEvent('caserio_marketplace:getMyVehicles', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local citizenid = Player.PlayerData.citizenid
    local vehicles = MySQL.query.await([[
        SELECT id, vehicle, plate, mods, state FROM player_vehicles 
        WHERE citizenid = ? AND state != 2
    ]], {citizenid})
    
    TriggerClientEvent('caserio_marketplace:receiveMyVehicles', src, vehicles or {})
end)

-- Crear listing de vehículo
RegisterNetEvent('caserio_marketplace:createVehicleListing', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local vehicleId = tonumber(data.vehicleId)
    local price = tonumber(data.price)
    
    if not vehicleId or not price or price < 1 then
        TriggerClientEvent('QBCore:Notify', src, 'Datos inválidos.', 'error')
        return
    end
    
    local citizenid = Player.PlayerData.citizenid
    local sellerName = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
    
    local vehicle = MySQL.query.await([[
        SELECT * FROM player_vehicles WHERE id = ? AND citizenid = ? AND state = 1
    ]], {vehicleId, citizenid})
    
    if not vehicle or #vehicle == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Vehículo no disponible.', 'error')
        return
    end
    
    local veh = vehicle[1]
    
    MySQL.insert.await([[
        INSERT INTO caserio_listings (seller_citizenid, seller_name, type, item_data, price)
        VALUES (?, ?, 'vehicle', ?, ?)
    ]], {citizenid, sellerName, json.encode({
        vehicle_id = veh.id,
        model = veh.vehicle,
        plate = veh.plate,
        mods = veh.mods
    }), price})
    
    MySQL.update.await('UPDATE player_vehicles SET state = 2 WHERE id = ?', {vehicleId})
    
    TriggerClientEvent('QBCore:Notify', src, 'Vehículo publicado por ' .. price .. ' coins.', 'success')
    print('[Caserio] Listing creado: ' .. veh.vehicle .. ' (' .. veh.plate .. ') por ' .. price .. ' coins')
end)

-- Cancelar listing
RegisterNetEvent('caserio_marketplace:cancelListing', function(listingId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local citizenid = Player.PlayerData.citizenid
    
    local listing = MySQL.query.await([[
        SELECT * FROM caserio_listings WHERE id = ? AND seller_citizenid = ? AND status = 'ACTIVE'
    ]], {listingId, citizenid})
    
    if not listing or #listing == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Listing no encontrado.', 'error')
        return
    end
    
    local item = listing[1]
    local itemData = json.decode(item.item_data)
    
    MySQL.update.await('UPDATE caserio_listings SET status = ? WHERE id = ?', {'CANCELLED', listingId})
    
    if item.type == 'vehicle' and itemData.vehicle_id then
        MySQL.update.await('UPDATE player_vehicles SET state = 1 WHERE id = ?', {itemData.vehicle_id})
    end
    
    if item.type == 'weapon' and itemData.item then
        local metadata = {}
        if itemData.tint then metadata.tint = itemData.tint end
        if itemData.attachments then metadata.attachments = itemData.attachments end
        
        Player.Functions.AddItem(itemData.item, 1, false, metadata)
    end
    
    TriggerClientEvent('QBCore:Notify', src, 'Publicación cancelada.', 'success')
end)

-- Obtener mis armas disponibles para vender
RegisterNetEvent('caserio_marketplace:getMyWeapons', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local weapons = {}
    
    for slot, item in pairs(Player.PlayerData.items) do
        if item and item.name and string.find(item.name, 'weapon_') then
            table.insert(weapons, {
                slot = slot,
                item = item.name,
                label = item.label or item.name,
                tint = item.info and item.info.tint or nil,
                attachments = item.info and item.info.attachments or nil,
                amount = item.amount or 1
            })
        end
    end
    
    TriggerClientEvent('caserio_marketplace:receiveMyWeapons', src, weapons)
end)

-- Crear listing de arma
RegisterNetEvent('caserio_marketplace:createWeaponListing', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local weaponSlot = tonumber(data.weaponSlot)
    local price = tonumber(data.price)
    
    if not weaponSlot or not price or price < 1 then
        TriggerClientEvent('QBCore:Notify', src, 'Datos inválidos.', 'error')
        return
    end
    
    local citizenid = Player.PlayerData.citizenid
    local sellerName = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
    
    local weapon = Player.PlayerData.items[weaponSlot]
    
    if not weapon or not string.find(weapon.name, 'weapon_') then
        TriggerClientEvent('QBCore:Notify', src, 'Arma no encontrada.', 'error')
        return
    end
    
    MySQL.insert.await([[
        INSERT INTO caserio_listings (seller_citizenid, seller_name, type, item_data, price)
        VALUES (?, ?, 'weapon', ?, ?)
    ]], {citizenid, sellerName, json.encode({
        item = weapon.name,
        label = weapon.label or weapon.name,
        tint = weapon.info and weapon.info.tint or nil,
        attachments = weapon.info and weapon.info.attachments or nil
    }), price})
    
    Player.Functions.RemoveItem(weapon.name, 1, weaponSlot)
    
    TriggerClientEvent('QBCore:Notify', src, 'Arma publicada por ' .. price .. ' coins.', 'success')
    print('[Caserio] Listing arma creado: ' .. weapon.name .. ' por ' .. price .. ' coins')
end)

-- Comprar listing (USE GLOBAL UTILS)
RegisterNetEvent('caserio_marketplace:buyListing', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local listingId = data.listingId
    local customPlate = data.customPlate
    
    local buyerCitizenid = Player.PlayerData.citizenid
    local buyerLicense = QBCore.Functions.GetIdentifier(src, 'license')
    
    local listing = MySQL.query.await([[
        SELECT * FROM caserio_listings WHERE id = ? AND status = 'ACTIVE'
    ]], {listingId})
    
    if not listing or #listing == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Este item ya no está disponible.', 'error')
        return
    end
    
    local item = listing[1]
    local price = item.price
    local sellerCitizenid = item.seller_citizenid
    local itemData = json.decode(item.item_data)
    
    if sellerCitizenid == buyerCitizenid then
        TriggerClientEvent('QBCore:Notify', src, 'No puedes comprar tu propia publicación.', 'error')
        return
    end
    
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes coins.', 'error')
        return
    end
    
    -- Transaction
    local txnId = Caserio.Functions.CreateTransaction(buyerCitizenid, item.type == 'vehicle' and 'buy_vehicle' or 'buy_weapon', {
        listing_id = listingId,
        from = sellerCitizenid,
        item = itemData.model or itemData.item,
        price = price
    }, price)
    
    Caserio.Functions.SendPaymentStatus(src, 'processing', {txnId = txnId, amount = price, message = 'Procesando compra...'})
    
    local itemName = itemData.model or itemData.label or itemData.item
    if not Player.Functions.RemoveMoney('coins', price, 'Compra P2P: ' .. itemName) then
        Caserio.Functions.FailTransaction(txnId, 'Error al quitar coins')
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    local commission = math.floor(price * 0.05)
    local sellerAmount = price - commission
    
    local Seller = QBCore.Functions.GetPlayerByCitizenId(sellerCitizenid)
    if Seller then
        Seller.Functions.AddMoney('coins', sellerAmount, 'Venta P2P: ' .. itemName)
        TriggerClientEvent('QBCore:Notify', Seller.PlayerData.source, '¡Vendiste tu ' .. itemName .. ' por ' .. sellerAmount .. ' coins!', 'success')
        Caserio.Functions.UpdateClientUI(Seller)
    else
        Caserio.Functions.AddPendingCoins(sellerCitizenid, sellerAmount)
    end
    
    if item.type == 'vehicle' and itemData.vehicle_id then
        local finalPlate = itemData.plate
        
        if customPlate and customPlate ~= '' then
            customPlate = customPlate:upper()
            if #customPlate > 8 then customPlate = customPlate:sub(1, 8) end
            
            if customPlate:match('^[A-Z0-9]+$') then
                local plateExists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {customPlate})
                if not plateExists then
                    finalPlate = customPlate
                else
                    TriggerClientEvent('QBCore:Notify', src, 'Patente ocupada, se usará la original: ' .. finalPlate, 'warning')
                end
            end
        end
        
        MySQL.update.await([[
            UPDATE player_vehicles SET citizenid = ?, license = ?, state = 1, plate = ? WHERE id = ?
        ]], {buyerCitizenid, buyerLicense, finalPlate, itemData.vehicle_id})
        
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. itemData.model .. ' (Patente: ' .. finalPlate .. ')!', 'success')
        
    elseif item.type == 'weapon' and itemData.item then
        local metadata = {}
        if itemData.tint then metadata.tint = itemData.tint end
        if itemData.attachments then metadata.attachments = itemData.attachments end
        
        Player.Functions.AddItem(itemData.item, 1, false, metadata)
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. itemData.label .. '!', 'success')
    end
    
    MySQL.update.await([[
        UPDATE caserio_listings SET status = 'SOLD', sold_at = NOW(), buyer_citizenid = ? WHERE id = ?
    ]], {buyerCitizenid, listingId})
    
    Caserio.Functions.CompleteTransaction(txnId)
    
    Caserio.Functions.SendPaymentStatus(src, 'completed', {txnId = txnId, amount = price, message = '¡Compra completada!'})
    Caserio.Functions.UpdateClientUI(Player)
    
    print('[Caserio] P2P Venta: ' .. itemName .. ' de ' .. sellerCitizenid .. ' a ' .. buyerCitizenid .. ' por ' .. price .. ' (Comisión: ' .. commission .. ')')
end)
