-- ============================================
-- SHARED UTILITIES
-- ============================================

-- Generate UUID
function Caserio.Functions.GenerateUUID()
    local template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return string.gsub(template, '[xy]', function(c)
        local v = (c == 'x') and math.random(0, 0xf) or math.random(8, 0xb)
        return string.format('%x', v)
    end)
end

-- Validate Plate Format
function Caserio.Functions.ValidatePlate(plate)
    if not plate or #plate == 0 or #plate > 8 then
        return false, "La patente debe tener entre 1 y 8 caracteres"
    end
    if not string.match(plate, "^[A-Za-z0-9]+$") then
        return false, "La patente solo puede tener letras y números"
    end
    return true, nil
end

-- Check if plate is available in DB
function Caserio.Functions.IsPlateAvailable(plate)
    local exists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {plate:upper()})
    return not exists
end

-- Update Client UI with fresh data
function Caserio.Functions.UpdateClientUI(Player)
    if not Player then return end
    local src = Player.PlayerData.source
    
    local isAdmin = Caserio.QBCore.Functions.HasPermission(src, 'admin')
    
    TriggerClientEvent('caserio_marketplace:updateData', src, {
        name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        money = Player.Functions.GetMoney('cash'),
        coins = Player.Functions.GetMoney('coins'),
        isAdmin = isAdmin
    })
end

-- Send Payment Status Toast to Client
function Caserio.Functions.SendPaymentStatus(src, status, data)
    TriggerClientEvent('caserio_marketplace:paymentStatus', src, {
        status = status,
        txnId = data.txnId,
        amount = data.amount,
        message = data.message
    })
end

-- Request Open Shop Event (Moved here as it's a general utility event)
RegisterNetEvent('caserio_marketplace:requestOpenShop', function()
    local src = source
    print('[Caserio] Server received requestOpenShop from ID: ' .. src)
    
    if not Caserio or not Caserio.QBCore then
        print('[Caserio] CRITICAL ERROR: Caserio.QBCore not initialized!')
        return
    end

    local Player = Caserio.QBCore.Functions.GetPlayer(src)
    if Player then
        local group = Caserio.QBCore.Functions.GetPermission(src)
        print('[Caserio] Player Group detected: ' .. tostring(group))

        local isAdmin = Caserio.QBCore.Functions.HasPermission(src, 'admin') or Caserio.QBCore.Functions.HasPermission(src, 'god')
        print('[Caserio] Player found. IsAdmin (admin/god): ' .. tostring(isAdmin) .. '. Opening UI...')
        
        TriggerClientEvent('caserio_marketplace:openShopUI', src, {
            name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
            money = Player.Functions.GetMoney('cash'),
            coins = Player.Functions.GetMoney('coins'),
            isAdmin = isAdmin
        })
    else
        print('[Caserio] ERROR: Player not found for source ' .. src)
    end
end)
