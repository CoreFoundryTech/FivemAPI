local QBCore = exports['qb-core']:GetCoreObject()

-- Archivo para guardar coins pendientes (jugadores offline)
local PENDING_FILE = GetResourcePath(GetCurrentResourceName()) .. '/pending_coins.json'

-- ============================================
-- UTILIDADES PARA COINS PENDIENTES (OFFLINE)
-- ============================================

local function LoadPendingCoins()
    local file = io.open(PENDING_FILE, 'r')
    if file then
        local content = file:read('*a')
        file:close()
        if content and content ~= '' then
            return json.decode(content) or {}
        end
    end
    return {}
end

local function SavePendingCoins(pending)
    local file = io.open(PENDING_FILE, 'w')
    if file then
        file:write(json.encode(pending))
        file:close()
    end
end

local function AddPendingCoins(identifier, amount)
    local pending = LoadPendingCoins()
    pending[identifier] = (pending[identifier] or 0) + amount
    SavePendingCoins(pending)
    print('[Caserio] Coins pendientes guardados: ' .. amount .. ' para ' .. identifier)
end

local function DeliverPendingCoins(playerId, identifier)
    local pending = LoadPendingCoins()
    
    for savedId, amount in pairs(pending) do
        if string.find(identifier, savedId) or string.find(savedId, identifier) then
            local Player = QBCore.Functions.GetPlayer(playerId)
            if Player then
                Player.Functions.AddMoney('coins', amount, "Tebex Purchase (Pendiente)")
                TriggerClientEvent('QBCore:Notify', playerId, '¡Recibiste ' .. amount .. ' Coins de tu compra pendiente!', 'success')
                TriggerClientEvent('caserio_marketplace:purchaseConfirmed', playerId)
                print('[Caserio] ✓ Coins pendientes entregados: ' .. amount)
                
                pending[savedId] = nil
                SavePendingCoins(pending)
            end
            return
        end
    end
end

-- ============================================
-- FUNCIONES DE TRANSACCIONES (AUDITORIA)
-- ============================================

local function GenerateUUID()
    local template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return string.gsub(template, '[xy]', function(c)
        local v = (c == 'x') and math.random(0, 0xf) or math.random(8, 0xb)
        return string.format('%x', v)
    end)
end

local function CreateTransaction(citizenid, txnType, itemData, price)
    local txnId = GenerateUUID()
    
    MySQL.insert.await([[
        INSERT INTO caserio_transactions (txn_id, citizenid, type, item_data, price, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
    ]], {txnId, citizenid, txnType, json.encode(itemData), price})
    
    print('[Caserio] TXN Creada: ' .. txnId .. ' (' .. txnType .. ')')
    return txnId
end

local function CompleteTransaction(txnId)
    MySQL.update.await([[
        UPDATE caserio_transactions SET status = 'COMPLETED', completed_at = NOW() WHERE txn_id = ?
    ]], {txnId})
    print('[Caserio] TXN Completada: ' .. txnId)
end

local function FailTransaction(txnId, errorMsg)
    MySQL.update.await([[
        UPDATE caserio_transactions SET status = 'FAILED', error_message = ? WHERE txn_id = ?
    ]], {errorMsg, txnId})
    print('[Caserio] TXN Fallida: ' .. txnId .. ' - ' .. errorMsg)
end

-- ============================================
-- HELPERS
-- ============================================

local function UpdateClientUI(Player)
    if not Player then return end
    local src = Player.PlayerData.source
    
    TriggerClientEvent('caserio_marketplace:updateData', src, {
        name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        money = Player.Functions.GetMoney('cash'),
        coins = Player.Functions.GetMoney('coins')
    })
end

local function ValidatePlate(plate)
    if not plate or #plate == 0 or #plate > 8 then
        return false, "La patente debe tener entre 1 y 8 caracteres"
    end
    if not string.match(plate, "^[A-Za-z0-9]+$") then
        return false, "La patente solo puede tener letras y números"
    end
    return true, nil
end

local function IsPlateAvailable(plate)
    local exists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {plate:upper()})
    return not exists
end

-- ============================================
-- EVENTOS DE UI
-- ============================================

RegisterNetEvent('caserio_marketplace:requestOpenShop', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        TriggerClientEvent('caserio_marketplace:openShopUI', src, {
            name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
            money = Player.Functions.GetMoney('cash'),
            coins = Player.Functions.GetMoney('coins')
        })
    end
end)

-- ============================================
-- COMANDO ADMIN / TEBEX: addcoins
-- ============================================

RegisterCommand('addcoins', function(source, args, rawCommand)
    local src = source
    local identifier = args[1]
    local amount = tonumber(args[2])
    
    print('[Caserio] addcoins - ID: ' .. tostring(identifier) .. ', Cantidad: ' .. tostring(amount))

    if src ~= 0 then
        if not QBCore.Functions.HasPermission(src, 'admin') then return end
    end

    if not identifier or not amount then
        print('[Caserio] Uso: addcoins [identifier] [cantidad]')
        return
    end

    -- Buscar jugador online
    local targetPlayer = QBCore.Functions.GetPlayerByCitizenId(identifier) or QBCore.Functions.GetPlayer(tonumber(identifier))
    
    if not targetPlayer then
        local players = QBCore.Functions.GetQBPlayers()
        for _, player in pairs(players) do
            if player then
                local allIdentifiers = GetPlayerIdentifiers(player.PlayerData.source)
                for _, id in ipairs(allIdentifiers) do
                    if string.find(id, identifier) or 
                       string.find(id, 'fivem:' .. identifier) or
                       string.find(identifier, id) then
                        targetPlayer = player
                        print('[Caserio] ✓ Jugador encontrado por identifier: ' .. id)
                        break
                    end
                end
                if targetPlayer then break end
            end
        end
    end

    if targetPlayer then
        local citizenid = targetPlayer.PlayerData.citizenid
        
        -- Crear transacción de auditoría
        local txnId = CreateTransaction(citizenid, 'tebex_coins', {coins = amount}, 0)
        
        targetPlayer.Functions.AddMoney('coins', amount, "Tebex/Admin AddCoins")
        
        CompleteTransaction(txnId)
        
        TriggerClientEvent('QBCore:Notify', targetPlayer.PlayerData.source, '¡Recibiste ' .. amount .. ' Ca$erio Coins!', 'success')
        TriggerClientEvent('caserio_marketplace:purchaseConfirmed', targetPlayer.PlayerData.source)
        UpdateClientUI(targetPlayer)
        print('[Caserio] ✓ ' .. amount .. ' coins añadidos a jugador online')
    else
        AddPendingCoins(identifier, amount)
        print('[Caserio] Jugador offline. Guardado como pendiente.')
    end
end)

-- ============================================
-- PLAYER LOADED: Entregar pendientes
-- ============================================

RegisterNetEvent('QBCore:Server:OnPlayerLoaded', function()
    local src = source
    Wait(2000)
    
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        local steamHex = QBCore.Functions.GetIdentifier(src, 'steam') or ''
        local license = QBCore.Functions.GetIdentifier(src, 'license') or ''
        local citizenid = Player.PlayerData.citizenid
        
        DeliverPendingCoins(src, steamHex)
        DeliverPendingCoins(src, license)
        DeliverPendingCoins(src, citizenid)
    end
end)

-- ============================================
-- EXCHANGE: Cash -> Coins
-- ============================================

RegisterNetEvent('caserio_marketplace:exchangeMoney', function(amountGameMoney)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local amount = tonumber(amountGameMoney)

    if not Player or not amount then return end

    if Player.Functions.RemoveMoney('cash', amount, "Exchange to Coins") then
        local coinsToReceive = math.floor(amount / Config.ExchangeRate)
        
        if coinsToReceive > 0 then
            Player.Functions.AddMoney('coins', coinsToReceive, "Exchange from Cash")
            TriggerClientEvent('QBCore:Notify', src, 'Intercambio exitoso: ' .. coinsToReceive .. ' Coins.', 'success')
            UpdateClientUI(Player)
        else
            Player.Functions.AddMoney('cash', amount, "Exchange Revert")
            TriggerClientEvent('QBCore:Notify', src, 'Cantidad insuficiente.', 'error')
        end
    else
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficiente dinero en efectivo.', 'error')
    end
end)

-- ============================================
-- COMPRA DE VEHÍCULO (CON PATENTE PERSONALIZADA)
-- ============================================

RegisterNetEvent('caserio_marketplace:buyVehicle', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    
    if not Player then return end
    
    local vehicleId = data.vehicleId
    local plate = data.plate and data.plate:upper() or nil
    
    -- Buscar vehículo en config
    local vehicleConfig = nil
    for _, v in ipairs(Config.ShopItems.vehicles) do
        if v.id == vehicleId then
            vehicleConfig = v
            break
        end
    end
    
    if not vehicleConfig then
        TriggerClientEvent('QBCore:Notify', src, 'Vehículo no encontrado.', 'error')
        return
    end
    
    local price = vehicleConfig.price
    local model = vehicleConfig.model
    local citizenid = Player.PlayerData.citizenid
    
    -- Validar patente
    local valid, errMsg = ValidatePlate(plate)
    if not valid then
        TriggerClientEvent('QBCore:Notify', src, errMsg, 'error')
        return
    end
    
    plate = plate:upper()
    
    -- Verificar patente disponible
    if not IsPlateAvailable(plate) then
        TriggerClientEvent('QBCore:Notify', src, 'Esa patente ya está en uso.', 'error')
        return
    end
    
    -- Verificar coins
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
        return
    end
    
    -- Crear transacción
    local txnId = CreateTransaction(citizenid, 'buy_vehicle', {
        model = model,
        plate = plate,
        price = price
    }, price)
    
    -- Quitar coins
    if not Player.Functions.RemoveMoney('coins', price, "Compra Vehículo: " .. model) then
        FailTransaction(txnId, "Error al quitar coins")
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    -- Insertar vehículo
    local hash = GetHashKey(model)
    local license = QBCore.Functions.GetIdentifier(src, 'license')
    
    -- Mods por defecto (vehículo sin modificaciones)
    local defaultMods = json.encode({
        modEngine = -1,
        modBrakes = -1,
        modTransmission = -1,
        modSuspension = -1,
        modArmor = -1,
        modTurbo = false,
        modXenon = false,
        windowTint = -1,
        plateIndex = 0,
        color1 = 0,
        color2 = 0,
        pearlescentColor = 0,
        wheelColor = 0,
        wheels = 0,
        neonEnabled = {false, false, false, false},
        neonColor = {255, 255, 255},
        tyreSmokeColor = {255, 255, 255},
        extras = {}
    })
    
    -- Status por defecto
    local defaultStatus = json.encode({
        fuel = 100,
        body = 100,
        engine = 100,
        radiator = 100,
        axle = 100,
        brakes = 100,
        clutch = 100
    })
    
    local insertResult = MySQL.insert.await([[
        INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, garage, state, fuel, engine, body, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 100, 1000.0, 1000.0, ?)
    ]], {license, citizenid, model, hash, defaultMods, plate, Config.DefaultGarage, defaultStatus})
    
    if insertResult then
        CompleteTransaction(txnId)
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste un ' .. vehicleConfig.label .. '! Patente: ' .. plate, 'success')
        UpdateClientUI(Player)
        print('[Caserio] Vehículo vendido: ' .. model .. ' a ' .. citizenid .. ' - Patente: ' .. plate)
    else
        -- Rollback: devolver coins
        Player.Functions.AddMoney('coins', price, "Rollback Compra Vehículo")
        FailTransaction(txnId, "Error al insertar vehículo en BD")
        TriggerClientEvent('QBCore:Notify', src, 'Error al registrar vehículo. Coins devueltos.', 'error')
    end
end)

-- ============================================
-- COMPRA DE ARMA (CON/SIN SKIN)
-- ============================================

RegisterNetEvent('caserio_marketplace:buyWeapon', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    
    if not Player then return end
    
    local weaponId = data.weaponId
    
    -- Buscar arma en config
    local weaponConfig = nil
    for _, w in ipairs(Config.ShopItems.weapons) do
        if w.id == weaponId then
            weaponConfig = w
            break
        end
    end
    
    if not weaponConfig then
        TriggerClientEvent('QBCore:Notify', src, 'Arma no encontrada.', 'error')
        return
    end
    
    local price = weaponConfig.price
    local item = weaponConfig.item
    local citizenid = Player.PlayerData.citizenid
    
    -- Verificar coins
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
        return
    end
    
    -- Crear transacción
    local txnId = CreateTransaction(citizenid, 'buy_weapon', {
        item = item,
        tint = weaponConfig.tint,
        attachments = weaponConfig.attachments,
        price = price
    }, price)
    
    -- Quitar coins
    if not Player.Functions.RemoveMoney('coins', price, "Compra Arma: " .. item) then
        FailTransaction(txnId, "Error al quitar coins")
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    -- Preparar metadata del arma
    local weaponMeta = {
        serie = QBCore.Shared.RandomStr(8):upper(),
        quality = 100
    }
    
    if weaponConfig.tint then
        weaponMeta.tint = weaponConfig.tint
    end
    
    if weaponConfig.attachments then
        weaponMeta.attachments = {}
        for _, att in ipairs(weaponConfig.attachments) do
            table.insert(weaponMeta.attachments, { component = att })
        end
    end
    
    -- Agregar arma al inventario
    local success = Player.Functions.AddItem(item, 1, false, weaponMeta)
    
    if success then
        CompleteTransaction(txnId)
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], 'add')
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. weaponConfig.label .. '!', 'success')
        UpdateClientUI(Player)
        print('[Caserio] Arma vendida: ' .. item .. ' a ' .. citizenid)
    else
        -- Rollback
        Player.Functions.AddMoney('coins', price, "Rollback Compra Arma")
        FailTransaction(txnId, "Error al agregar arma al inventario")
        TriggerClientEvent('QBCore:Notify', src, 'Error al entregar arma. Coins devueltos.', 'error')
    end
end)

-- ============================================
-- COMPRA GENÉRICA (Legacy/Otros items)
-- ============================================

RegisterNetEvent('caserio_marketplace:buyItem', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local price = tonumber(data.price)
    local label = data.label

    if not Player or not price then return end

    if Player.Functions.RemoveMoney('coins', price, "Shop Purchase: " .. label) then
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. label .. '!', 'success')
        UpdateClientUI(Player)
        print('[Caserio] Item comprado: ' .. label)
    else
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes Coins.', 'error')
    end
end)

-- ============================================
-- RECUPERACIÓN DE TRANSACCIONES PENDIENTES
-- ============================================

CreateThread(function()
    Wait(5000) -- Esperar a que cargue todo
    
    local pendingTxns = MySQL.query.await([[
        SELECT * FROM caserio_transactions WHERE status = 'PENDING'
    ]])
    
    if pendingTxns and #pendingTxns > 0 then
        print('[Caserio] Encontradas ' .. #pendingTxns .. ' transacciones pendientes. Recuperando...')
        
        for _, txn in ipairs(pendingTxns) do
            local itemData = json.decode(txn.item_data)
            
            if txn.type == 'buy_vehicle' then
                -- Verificar si el vehículo existe
                local exists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {itemData.plate})
                if exists then
                    CompleteTransaction(txn.txn_id)
                    print('[Caserio] TXN Recuperada (vehículo existe): ' .. txn.txn_id)
                else
                    -- Reembolsar
                    local Player = QBCore.Functions.GetPlayerByCitizenId(txn.citizenid)
                    if Player then
                        Player.Functions.AddMoney('coins', txn.price, "Reembolso TXN Fallida")
                        FailTransaction(txn.txn_id, "Vehículo no encontrado - Reembolsado")
                        print('[Caserio] TXN Reembolsada: ' .. txn.txn_id)
                    end
                end
                
            elseif txn.type == 'tebex_coins' then
                -- Verificar si el jugador tiene los coins
                local Player = QBCore.Functions.GetPlayerByCitizenId(txn.citizenid)
                if Player then
                    CompleteTransaction(txn.txn_id)
                    print('[Caserio] TXN Tebex marcada como completada: ' .. txn.txn_id)
                end
            end
        end
    end
end)

-- ============================================
-- TRACKING / DEBUG
-- ============================================

RegisterNetEvent('caserio_marketplace:purchaseInitiated', function(packageId, amount, price)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        print('[Caserio] Compra iniciada por ' .. Player.PlayerData.charinfo.firstname .. ': ' .. packageId)
    end
end)

RegisterCommand('myid', function(source, args, rawCommand)
    local src = source
    if src == 0 then return end
    
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        print('=== TUS IDENTIFIERS ===')
        print('Server ID: ' .. src)
        print('Steam: ' .. (QBCore.Functions.GetIdentifier(src, 'steam') or 'N/A'))
        print('License: ' .. (QBCore.Functions.GetIdentifier(src, 'license') or 'N/A'))
        print('CitizenID: ' .. Player.PlayerData.citizenid)
        print('Coins: ' .. Player.Functions.GetMoney('coins'))
        print('========================')
    end
end)

-- ============================================
-- PAYMENT STATUS NOTIFICATIONS
-- ============================================

local function SendPaymentStatus(src, status, data)
    TriggerClientEvent('caserio_marketplace:paymentStatus', src, {
        status = status,
        txnId = data.txnId,
        amount = data.amount,
        message = data.message
    })
end

-- ============================================
-- P2P MARKETPLACE - LISTINGS
-- ============================================

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
    
    -- Todos los vehículos excepto los que están en venta (state != 2)
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
    
    -- Verificar que el vehículo es del jugador y está disponible
    local vehicle = MySQL.query.await([[
        SELECT * FROM player_vehicles WHERE id = ? AND citizenid = ? AND state = 1
    ]], {vehicleId, citizenid})
    
    if not vehicle or #vehicle == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Vehículo no disponible.', 'error')
        return
    end
    
    local veh = vehicle[1]
    
    -- Crear listing
    MySQL.insert.await([[
        INSERT INTO caserio_listings (seller_citizenid, seller_name, type, item_data, price)
        VALUES (?, ?, 'vehicle', ?, ?)
    ]], {citizenid, sellerName, json.encode({
        vehicle_id = veh.id,
        model = veh.vehicle,
        plate = veh.plate,
        mods = veh.mods
    }), price})
    
    -- Bloquear vehículo (state = 2 = en venta)
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
    
    -- Verificar que es el dueño del listing
    local listing = MySQL.query.await([[
        SELECT * FROM caserio_listings WHERE id = ? AND seller_citizenid = ? AND status = 'ACTIVE'
    ]], {listingId, citizenid})
    
    if not listing or #listing == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Listing no encontrado.', 'error')
        return
    end
    
    local item = listing[1]
    local itemData = json.decode(item.item_data)
    
    -- Cancelar listing
    MySQL.update.await('UPDATE caserio_listings SET status = ? WHERE id = ?', {'CANCELLED', listingId})
    
    -- Si es vehículo, desbloquear (state = 1)
    if item.type == 'vehicle' and itemData.vehicle_id then
        MySQL.update.await('UPDATE player_vehicles SET state = 1 WHERE id = ?', {itemData.vehicle_id})
    end
    
    -- Si es arma, devolver al inventario
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
    
    -- Obtener ítems del inventario que sean armas
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
    
    -- Obtener arma del inventario
    local weapon = Player.PlayerData.items[weaponSlot]
    
    if not weapon or not string.find(weapon.name, 'weapon_') then
        TriggerClientEvent('QBCore:Notify', src, 'Arma no encontrada.', 'error')
        return
    end
    
    -- Crear listing
    MySQL.insert.await([[
        INSERT INTO caserio_listings (seller_citizenid, seller_name, type, item_data, price)
        VALUES (?, ?, 'weapon', ?, ?)
    ]], {citizenid, sellerName, json.encode({
        item = weapon.name,
        label = weapon.label or weapon.name,
        tint = weapon.info and weapon.info.tint or nil,
        attachments = weapon.info and weapon.info.attachments or nil
    }), price})
    
    -- Quitar arma del inventario
    Player.Functions.RemoveItem(weapon.name, 1, weaponSlot)
    
    TriggerClientEvent('QBCore:Notify', src, 'Arma publicada por ' .. price .. ' coins.', 'success')
    print('[Caserio] Listing arma creado: ' .. weapon.name .. ' por ' .. price .. ' coins')
end)

-- Comprar listing
RegisterNetEvent('caserio_marketplace:buyListing', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local listingId = data.listingId
    local customPlate = data.customPlate -- Opcional para vehículos
    
    local buyerCitizenid = Player.PlayerData.citizenid
    local buyerLicense = QBCore.Functions.GetIdentifier(src, 'license')
    
    -- Obtener listing
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
    
    -- No puedes comprar tu propio listing
    if sellerCitizenid == buyerCitizenid then
        TriggerClientEvent('QBCore:Notify', src, 'No puedes comprar tu propia publicación.', 'error')
        return
    end
    
    -- Verificar coins
    if Player.Functions.GetMoney('coins') < price then
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficientes coins.', 'error')
        return
    end
    
    -- Crear transacción de auditoría
    local txnId = CreateTransaction(buyerCitizenid, item.type == 'vehicle' and 'buy_vehicle' or 'buy_weapon', {
        listing_id = listingId,
        from = sellerCitizenid,
        item = itemData.model or itemData.item,
        price = price
    }, price)
    
    SendPaymentStatus(src, 'processing', {txnId = txnId, amount = price, message = 'Procesando compra...'})
    
    -- Quitar coins al comprador
    local itemName = itemData.model or itemData.label or itemData.item
    if not Player.Functions.RemoveMoney('coins', price, 'Compra P2P: ' .. itemName) then
        FailTransaction(txnId, 'Error al quitar coins')
        TriggerClientEvent('QBCore:Notify', src, 'Error al procesar pago.', 'error')
        return
    end
    
    -- Calcular comisión (5%)
    local commission = math.floor(price * 0.05)
    local sellerAmount = price - commission
    
    -- Dar coins al vendedor (menos comisión)
    local Seller = QBCore.Functions.GetPlayerByCitizenId(sellerCitizenid)
    if Seller then
        Seller.Functions.AddMoney('coins', sellerAmount, 'Venta P2P: ' .. itemName)
        TriggerClientEvent('QBCore:Notify', Seller.PlayerData.source, '¡Vendiste tu ' .. itemName .. ' por ' .. sellerAmount .. ' coins!', 'success')
    else
        -- Vendedor offline, guardar como pendiente
        AddPendingCoins(sellerCitizenid, sellerAmount)
    end
    
    -- Transferir item según tipo
    if item.type == 'vehicle' and itemData.vehicle_id then
        -- Si hay patente personalizada, validar
        local finalPlate = itemData.plate
        
        if customPlate and customPlate ~= '' then
            customPlate = customPlate:upper()
            
            -- Validar longitud y caracteres
            if #customPlate > 8 then
                customPlate = customPlate:sub(1, 8)
            end
            
            if customPlate:match('^[A-Z0-9]+$') then
                -- Verificar disponibilidad
                local plateExists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {customPlate})
                
                if not plateExists then
                    finalPlate = customPlate
                else
                    TriggerClientEvent('QBCore:Notify', src, 'Patente ocupada, se usará la original: ' .. finalPlate, 'warning')
                end
            end
        end
        
        -- Transferir vehículo
        MySQL.update.await([[
            UPDATE player_vehicles SET citizenid = ?, license = ?, state = 1, plate = ? WHERE id = ?
        ]], {buyerCitizenid, buyerLicense, finalPlate, itemData.vehicle_id})
        
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. itemData.model .. ' (Patente: ' .. finalPlate .. ')!', 'success')
        
    elseif item.type == 'weapon' and itemData.item then
        -- Transferir arma al inventario
        local metadata = {}
        if itemData.tint then metadata.tint = itemData.tint end
        if itemData.attachments then metadata.attachments = itemData.attachments end
        
        Player.Functions.AddItem(itemData.item, 1, false, metadata)
        TriggerClientEvent('QBCore:Notify', src, '¡Compraste ' .. itemData.label .. '!', 'success')
    end
    
    -- Marcar listing como vendido
    MySQL.update.await([[
        UPDATE caserio_listings SET status = 'SOLD', sold_at = NOW(), buyer_citizenid = ? WHERE id = ?
    ]], {buyerCitizenid, listingId})
    
    CompleteTransaction(txnId)
    
    SendPaymentStatus(src, 'completed', {txnId = txnId, amount = price, message = '¡Compra completada!'})
    UpdateClientUI(Player)
    
    print('[Caserio] P2P Venta: ' .. itemName .. ' de ' .. sellerCitizenid .. ' a ' .. buyerCitizenid .. ' por ' .. price .. ' (Comisión: ' .. commission .. ')')
end)
