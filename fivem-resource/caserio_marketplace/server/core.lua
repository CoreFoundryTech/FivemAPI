local QBCore = exports['qb-core']:GetCoreObject()

-- Global Namespace for the resource
Caserio = {}
Caserio.Functions = {}
Caserio.Config = Config -- Access config globally via namespace if needed

-- Export QBCore so other files don't need to redefine it
Caserio.QBCore = QBCore

print('[Caserio] Core initialized. Namespace established.')
