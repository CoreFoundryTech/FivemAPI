-- ============================================
-- COINS ECONOMY SYSTEM
-- ============================================

local QBCore = Caserio.QBCore
local PENDING_FILE = GetResourcePath(GetCurrentResourceName()) .. '/pending_coins.json'

-- Helpers (Local)
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

-- Exported Helper: Add Pending Coins (Used by P2P Marketplace)
function Caserio.Functions.AddPendingCoins(identifier, amount)
    local pending = LoadPendingCoins()
    pending[identifier] = (pending[identifier] or 0) + amount
    SavePendingCoins(pending)
    print('[Caserio] Coins pendientes guardados: ' .. amount .. ' para ' .. identifier)
end

-- Helper: Deliver Coins
local function DeliverPendingCoins(playerId, identifier)
    local pending = LoadPendingCoins()
    
    for savedId, amount in pairs(pending) do
        if string.find(identifier, savedId) or string.find(savedId, identifier) then
            local Player = QBCore.Functions.GetPlayer(playerId)
            if Player then
                Player.Functions.AddMoney('coins', amount, "Tebex/Offline Payment")
                TriggerClientEvent('QBCore:Notify', playerId, '¡Recibiste ' .. amount .. ' Coins pendientes!', 'success')
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
-- COMMANDS
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

    -- Find online player
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
        
        -- Audit Transaction
        local txnId = Caserio.Functions.CreateTransaction(citizenid, 'tebex_coins', {coins = amount}, 0)
        
        targetPlayer.Functions.AddMoney('coins', amount, "Tebex/Admin AddCoins")
        
        Caserio.Functions.CompleteTransaction(txnId)
        
        TriggerClientEvent('QBCore:Notify', targetPlayer.PlayerData.source, '¡Recibiste ' .. amount .. ' Ca$erio Coins!', 'success')
        TriggerClientEvent('caserio_marketplace:purchaseConfirmed', targetPlayer.PlayerData.source)
        Caserio.Functions.UpdateClientUI(targetPlayer)
        print('[Caserio] ✓ ' .. amount .. ' coins añadidos a jugador online')
    else
        Caserio.Functions.AddPendingCoins(identifier, amount)
        print('[Caserio] Jugador offline. Guardado como pendiente.')
    end
end)

-- ============================================
-- EVENTS
-- ============================================

-- On Join: Deliver Pending Coins
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

-- Exchange Cash -> Coins
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
            Caserio.Functions.UpdateClientUI(Player)
        else
            Player.Functions.AddMoney('cash', amount, "Exchange Revert")
            TriggerClientEvent('QBCore:Notify', src, 'Cantidad insuficiente.', 'error')
        end
    else
        TriggerClientEvent('QBCore:Notify', src, 'No tienes suficiente dinero en efectivo.', 'error')
    end
end)

-- Purchase Initiated Tracking
RegisterNetEvent('caserio_marketplace:purchaseInitiated', function(packageId, amount, price)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        print('[Caserio] Compra iniciada por ' .. Player.PlayerData.charinfo.firstname .. ': ' .. packageId)
    end
end)
