# SOLUCIÓN DEFINITIVA - ICONO TELÉFONO

Si el icono NO aparece después de reiniciar `qb-phone`, usa esta solución 100% funcional:

## EN config.lua del qb-phone (donde está la app caseriomarket):

**OPCIÓN 1 - FontAwesome (MÁS FÁCIL):**
```lua
['caseriomarket'] = {
    app = 'caseriomarket',
    color = '#2563eb',
    icon = 'fas fa-shopping-cart',  -- <-- USA ESTO
    tooltipText = 'Marketplace',
    -- resto igual
}
```

**OPCIÓN 2 - Si FontAwesome no funciona, usa imagen PNG:**
1. Descarga cualquier icono de tienda en PNG (128x128 mínimo)
2. Guárdalo en: `qb-phone/html/img/` con nombre `marketplace.png`
3. Cambia el config:
```lua
icon = 'img/marketplace.png',
```

## EN main.lua del qb-phone:

Busca donde se manejan los eventos de apps. Dependiendo de tu versión, puede ser:

**Si hay un RegisterNUICallback genérico para apps:**
Asegúrate que el callback 'OpenMarketplace' esté registrado (YA LO PUSIMOS).

**Si el teléfono usa un sistema de "clickApp":**
Busca una función tipo `ClickedApp` o evento `phone:clickApp` y añade:
```lua
elseif app == 'caseriomarket' then
    TriggerEvent('caserio_marketplace:client:open')
    DoPhoneAnimation('cellphone_text_out')
```

## VERIFICACIÓN:
Después de hacer el cambio, ejecuta:
```
restart qb-phone
```

Si TODAVÍA no aparece, tu qb-phone no está leyendo Config.StoreApps. 
En ese caso, busca Config.PhoneApplications y añade la app ahí en lugar de StoreApps.
