-- ============================================
-- DYNAMIC SHOP SYSTEM (OFFICIAL)
-- ============================================

local QBCore = Caserio.QBCore

-- ============================================
-- ADMIN MANAGEMENT (Get/Add/Edit/Delete)
-- ============================================

-- Get all shop items
QBCore.Functions.CreateCallback('caserio_shop:getShopItems', function(source, cb)
    local items = MySQL.query.await('SELECT * FROM shop_items ORDER BY created_at ASC')
    cb(items or {})
end)

-- Add new item (Admin only)
RegisterNetEvent('caserio_shop:addItem', function(data)
    local src = source
    if not QBCore.Functions.HasPermission(src, 'admin') then 
        TriggerClientEvent('QBCore:Notify', src, 'No tienes permisos.', 'error')
        return 
    end

    if not data.model or not data.price or not data.label then return end
    
    local itemId = data.model .. '_' .. math.random(100, 999)
    
    MySQL.insert.await([[
        INSERT INTO shop_items (item_id, type, label, price, model, category, item_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], {
        itemId, 
        data.type, 
        data.label, 
        data.price, 
        data.model, 
        data.category or 'general',
        data.item_data and json.encode(data.item_data) or nil
    })
    
    TriggerClientEvent('QBCore:Notify', src, 'Item agregado correctamente.', 'success')
    TriggerClientEvent('caserio_shop:refresh', -1)
end)

-- Edit item (Admin only)
RegisterNetEvent('caserio_shop:editItem', function(data)
    local src = source
    if not QBCore.Functions.HasPermission(src, 'admin') then return end

    MySQL.update.await([[
        UPDATE shop_items 
        SET label = ?, price = ?, model = ?, category = ?, item_data = ?
        WHERE item_id = ?
    ]], {
        data.label,
        data.price,
        data.model,
        data.category,
        data.item_data and json.encode(data.item_data) or nil,
        data.item_id
    })
    
    TriggerClientEvent('QBCore:Notify', src, 'Item actualizado.', 'success')
    TriggerClientEvent('caserio_shop:refresh', -1)
end)

-- Delete item (Admin only)
RegisterNetEvent('caserio_shop:deleteItem', function(itemId)
    local src = source
    if not QBCore.Functions.HasPermission(src, 'admin') then return end

    MySQL.update.await('DELETE FROM shop_items WHERE item_id = ?', {itemId})
    
    TriggerClientEvent('QBCore:Notify', src, 'Item eliminado.', 'success')
    TriggerClientEvent('caserio_shop:refresh', -1)
end)

-- ============================================
-- PURCHASING LOGIC
-- ============================================

-- Buy Vehicle
RegisterNetEvent('caserio_marketplace:buyVehicle', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local vehicleId = data.vehicleId
    local plate = data.plate and data.plate:upper() or nil
    
    -- DB Lookup
    local vehicleConfig = MySQL.single.await('SELECT * FROM shop_items WHERE item_id = ? AND type = ?', {vehicleId, 'vehicle'})
    
    if not vehicleConfig then
        TriggerClientEvent('QBCore:Notify', src, 'Vehículo no encontrado.', 'error')
        return
    end
    
    local price = vehicleConfig.price
    local model = vehicleConfig.model
    local citizenid = Player.PlayerData.citizenid
    
    -- Validate Plate
    local valid, errMsg = Caserio.Functions.ValidatePlate(plate)
    if not valid then
        TriggerClientEvent('QBCore:Notify', src, errMsg, 'error')
        return
    end
    
    plate = plate:upper()
    if not Caserio.Functions.IsPlateAvailable(plate) then
        TriggerClientEvent('QBCore:Notify', src, 'Esa patente ya está en uso.', 'error')
        return
    end
    
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
        return
    end
    
    -- Transaction
    local txnId = Caserio.Functions.CreateTransaction(citizenid, 'buy_vehicle', {
        model = model,
        plate = plate,
        price = price
    }, price)
    
    if not Player.Functions.RemoveMoney('coins', price, "Compra Vehículo: " .. model) then
        Caserio.Functions.FailTransaction(txnId, "Error al quitar coins")
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    local hash = GetHashKey(model)
    local license = QBCore.Functions.GetIdentifier(src, 'license')
    
    -- Default Mods/Status
    local defaultMods = json.encode({ modEngine = -1, modBrakes = -1, modTransmission = -1, modSuspension = -1, modArmor = -1, modTurbo = false, modXenon = false, windowTint = -1, plateIndex = 0, color1 = 0, color2 = 0, pearlescentColor = 0, wheelColor = 0, wheels = 0, neonEnabled = {false, false, false, false}, neonColor = {255, 255, 255}, tyreSmokeColor = {255, 255, 255}, extras = {} })
    local defaultStatus = json.encode({ fuel = 100, body = 100, engine = 100, radiator = 100, axle = 100, brakes = 100, clutch = 100 })
    
    local insertResult = MySQL.insert.await([[
        INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, garage, state, fuel, engine, body, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 100, 1000.0, 1000.0, ?)
    ]], {license, citizenid, model, hash, defaultMods, plate, Config.DefaultGarage, defaultStatus})
    
    if insertResult then
        Caserio.Functions.CompleteTransaction(txnId)
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste un ' .. vehicleConfig.label .. '! Patente: ' .. plate, 'success')
        Caserio.Functions.UpdateClientUI(Player)
        print('[Caserio] Vehículo vendido: ' .. model .. ' a ' .. citizenid .. ' - Patente: ' .. plate)
    else
        Player.Functions.AddMoney('coins', price, "Rollback Compra Vehículo")
        Caserio.Functions.FailTransaction(txnId, "Error al insertar vehículo en BD")
        TriggerClientEvent('QBCore:Notify', src, 'Error al registrar vehículo. Coins devueltos.', 'error')
    end
end)

-- Buy Weapon
RegisterNetEvent('caserio_marketplace:buyWeapon', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local weaponId = data.weaponId
    
    local weaponConfig = MySQL.single.await('SELECT * FROM shop_items WHERE item_id = ? AND type = ?', {weaponId, 'weapon'})
    
    if weaponConfig and weaponConfig.item_data then
        local itemData = json.decode(weaponConfig.item_data)
        if itemData then
            if itemData.tint then weaponConfig.tint = itemData.tint end
            if itemData.attachments then weaponConfig.attachments = itemData.attachments end
        end
    end
    
    if not weaponConfig then
        TriggerClientEvent('QBCore:Notify', src, 'Arma no encontrada.', 'error')
        return
    end
    
    local price = weaponConfig.price
    local item = weaponConfig.model -- In DB 'model' column holds the spawn name (e.g. weapon_pistol)
    local citizenid = Player.PlayerData.citizenid
    
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
        return
    end
    
    local txnId = Caserio.Functions.CreateTransaction(citizenid, 'buy_weapon', {
        item = item,
        tint = weaponConfig.tint,
        attachments = weaponConfig.attachments,
        price = price
    }, price)
    
    if not Player.Functions.RemoveMoney('coins', price, "Compra Arma: " .. item) then
        Caserio.Functions.FailTransaction(txnId, "Error al quitar coins")
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    local weaponMeta = { serie = QBCore.Shared.RandomStr(8):upper(), quality = 100 }
    if weaponConfig.tint then weaponMeta.tint = weaponConfig.tint end
    if weaponConfig.attachments then
        weaponMeta.attachments = {}
        for _, att in ipairs(weaponConfig.attachments) do
            table.insert(weaponMeta.attachments, { component = att })
        end
    end
    
    local success = Player.Functions.AddItem(item, 1, false, weaponMeta)
    
    if success then
        Caserio.Functions.CompleteTransaction(txnId)
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], 'add')
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. weaponConfig.label .. '!', 'success')
        Caserio.Functions.UpdateClientUI(Player)
        print('[Caserio] Arma vendida: ' .. item .. ' a ' .. citizenid)
    else
        Player.Functions.AddMoney('coins', price, "Rollback Compra Arma")
        Caserio.Functions.FailTransaction(txnId, "Error al agregar arma al inventario")
        TriggerClientEvent('QBCore:Notify', src, 'Error al entregar arma. Coins devueltos.', 'error')
    end
end)

-- Buy Generic Item
RegisterNetEvent('caserio_marketplace:buyItem', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local price = tonumber(data.price)
    local label = data.label

    if not Player or not price then return end

    if Player.Functions.RemoveMoney('coins', price, "Shop Purchase: " .. label) then
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. label .. '!', 'success')
        Caserio.Functions.UpdateClientUI(Player)
        print('[Caserio] Item comprado: ' .. label)
    else
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
    end
end)
