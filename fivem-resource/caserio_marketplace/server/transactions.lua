-- ============================================
-- TRANSACTION AUDIT & RECOVERY
-- ============================================

-- Create a new audit transaction
function Caserio.Functions.CreateTransaction(citizenid, txnType, itemData, price)
    local txnId = Caserio.Functions.GenerateUUID()
    
    MySQL.insert.await([[
        INSERT INTO caserio_transactions (txn_id, citizenid, type, item_data, price, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
    ]], {txnId, citizenid, txnType, json.encode(itemData), price})
    
    print('[Caserio] TXN Creada: ' .. txnId .. ' (' .. txnType .. ')')
    return txnId
end

-- Mark transaction as completed
function Caserio.Functions.CompleteTransaction(txnId)
    MySQL.update.await([[
        UPDATE caserio_transactions SET status = 'COMPLETED', completed_at = NOW() WHERE txn_id = ?
    ]], {txnId})
    print('[Caserio] TXN Completada: ' .. txnId)
end

-- Mark transaction as failed
function Caserio.Functions.FailTransaction(txnId, errorMsg)
    MySQL.update.await([[
        UPDATE caserio_transactions SET status = 'FAILED', error_message = ? WHERE txn_id = ?
    ]], {errorMsg, txnId})
    print('[Caserio] TXN Fallida: ' .. txnId .. ' - ' .. errorMsg)
end

-- Thread: Recover Pending Transactions on Server Start
CreateThread(function()
    Wait(5000) -- Wait for resources to load
    
    local pendingTxns = MySQL.query.await([[
        SELECT * FROM caserio_transactions WHERE status = 'PENDING'
    ]])
    
    if pendingTxns and #pendingTxns > 0 then
        print('[Caserio] Encontradas ' .. #pendingTxns .. ' transacciones pendientes. Recuperando...')
        
        for _, txn in ipairs(pendingTxns) do
            local itemData = json.decode(txn.item_data)
            
            if txn.type == 'buy_vehicle' then
                -- Verify if vehicle exists (meaning insert succeeded but crash happened before update)
                local exists = MySQL.scalar.await('SELECT 1 FROM player_vehicles WHERE plate = ?', {itemData.plate})
                if exists then
                    Caserio.Functions.CompleteTransaction(txn.txn_id)
                    print('[Caserio] TXN Recuperada (vehículo existe): ' .. txn.txn_id)
                else
                    -- Refund
                    local Player = Caserio.QBCore.Functions.GetPlayerByCitizenId(txn.citizenid)
                    if Player then
                        Player.Functions.AddMoney('coins', txn.price, "Reembolso TXN Fallida")
                        Caserio.Functions.FailTransaction(txn.txn_id, "Vehículo no encontrado - Reembolsado")
                        print('[Caserio] TXN Reembolsada: ' .. txn.txn_id)
                    end
                end
                
            elseif txn.type == 'tebex_coins' then
                -- Verify if player received coins
                local Player = Caserio.QBCore.Functions.GetPlayerByCitizenId(txn.citizenid)
                if Player then
                    Caserio.Functions.CompleteTransaction(txn.txn_id)
                    print('[Caserio] TXN Tebex marcada como completada: ' .. txn.txn_id)
                end
            end
        end
    end
end)
