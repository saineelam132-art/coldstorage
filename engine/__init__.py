"""ColdTrust Twin - physics engine.

Every engineering number shown on the website comes from a function in this
package. Each module is small and holds one topic:

    config.py        - loads config/design.json and data/crops.json
    psychro.py       - moist-air properties (enthalpy, density) from T and RH
    loads.py         - wall, door infiltration, product, internal and total loads
    r290.py          - R290 vapour-compression cycle using CoolProp
    pv.py            - sun position, panel irradiance and PV power
    pcm.py           - PCM "battery" (lumped energy balance)
    pcm_slab.py      - PCM wall slab, 1-D enthalpy method, explicit FTCS scheme
    shelf_life.py    - Q10 shelf-life model and chilling-injury warning
    physics_check.py - flags a sensor whose reading disagrees with physics
    report.py        - prints every formula with numbers plugged in
"""
