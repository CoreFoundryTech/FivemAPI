fx_version 'cerulean'
game 'gta5'

author 'Caserio Dev'
description 'Caserio Marketplace & Economy System'
version '2.0.0'

shared_script 'config.lua'

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/core.lua',
    'server/utils.lua',
    'server/transactions.lua',
    'server/coins.lua',
    'server/shop.lua',
    'server/marketplace.lua'
}

client_scripts {
    'client/main.lua'
}

dependencies {
    'oxmysql',
    'qb-core'
}

ui_page 'web/dist/index.html'

files {
    'web/dist/index.html',
    'web/dist/assets/*'
}
