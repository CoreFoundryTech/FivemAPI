# Guía de Integración con Teléfono (Phone Integration)

Para añadir el icono de **Caserio Marketplace** en el teléfono de los jugadores, sigue las instrucciones según tu script de teléfono.

## Opción A: qb-phone

1. Abre `qb-phone/config.lua`.
2. Busca la tabla `Config.Applications`.
3. Añade la siguiente entrada:

```lua
['caseriomarket'] = {
    app = 'caseriomarket',
    color = '#2563eb', -- Azul vibrante
    icon = 'fas fa-shopping-cart', -- O 'fas fa-store'
    tooltipText = 'Marketplace',
    job = false, -- Disponible para todos
    blockedjobs = {},
    slot = 14, -- Asegúrate que el slot esté libre
    alert = nil,
},
```

4. Abre `qb-phone/client/main.lua` (o donde se manejen los eventos de apps).
5. Busca dónde se manejan los eventos de las aplicaciones y añade:

```lua
EL ESTILO DE QB-PHONE VARÍA, PERO GENERALMENTE NECESITAS ESTO EN TU config.lua o client.lua:

-- Si tu qb-phone soporta eventos directos en config:
event = "caserio_marketplace:client:open",

-- O si necesitas registrarlo manualmente en el loop de eventos del teléfono:
if app == "caseriomarket" then
    TriggerEvent('caserio_marketplace:client:open')
    DoPhoneAnimation('cellphone_text_out') -- Cerrar teléfono
    SetNuiFocus(false, false) -- Asegurar foco perdido del teléfono
end
```

## Opción B: qs-smartphone (Quasar)

1. Ve a `qs-smartphone/config/config_apps.lua` (o similar).
2. Añade la aplicación al final de la lista:

```lua
['caseriomarket'] = {
    name = 'caseriomarket',
    label = 'Marketplace',
    icon = 'img/apps/marketplace.png', -- Necesitarás subir un icono png
    event = 'caserio_marketplace:client:open', -- El evento que creamos
    shouldClose = true, -- IMPORTANTE: Cierra el teléfono al abrir
    job = false,
    blocked = false
},
```

## Opción C: Evento Universal

Si usas otro sistema, simplemente llama a este evento de cliente:

```lua
TriggerEvent('caserio_marketplace:client:open')
```
