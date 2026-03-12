-- Backfill: re-tag articles with improved neighborhood detection
-- Uses tiered matching: city names first, then landmarks, then streets

UPDATE public.articles
SET neighborhood_guess = CASE
  -- Tier 1: City names (multi-word first)
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mporter\s*ranch\M' THEN 'Porter Ranch'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mgranada\s*hills\M' THEN 'Granada Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mcanoga\s*park\M' THEN 'Canoga Park'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mnorth\s*hills\M' THEN 'North Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mmission\s*hills\M' THEN 'Mission Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mlake\s*balboa\M' THEN 'Lake Balboa'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mvan\s*nuys\M' THEN 'Van Nuys'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\msherman\s*oaks\M' THEN 'Sherman Oaks'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mwoodland\s*hills\M' THEN 'Woodland Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mwest\s*hills\M' THEN 'West Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\msun\s*valley\M' THEN 'Sun Valley'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mpanorama\s*city\M' THEN 'Panorama City'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mstudio\s*city\M' THEN 'Studio City'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mnorthridge\M' THEN 'Northridge'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mchatsworth\M' THEN 'Chatsworth'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mreseda\M' THEN 'Reseda'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mwinnetka\M' THEN 'Winnetka'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mencino\M' THEN 'Encino'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mtarzana\M' THEN 'Tarzana'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mpacoima\M' THEN 'Pacoima'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\marleta\M' THEN 'Arleta'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\msylmar\M' THEN 'Sylmar'
  -- Tier 2: Landmarks
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '\mcsun\M' THEN 'Northridge'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'cal\s*state\s*northridge' THEN 'Northridge'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'devonshire\s+division' THEN 'Northridge'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'topanga\s+canyon' THEN 'Chatsworth'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'balboa\s+park' THEN 'Van Nuys'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'van\s+nuys\s+airport' THEN 'Van Nuys'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'sepulveda\s+basin' THEN 'Encino'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'stoney\s+point' THEN 'Chatsworth'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'granada\s+hills\s+charter' THEN 'Granada Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'cleveland\s+high' THEN 'Granada Hills'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'porter\s+ranch\s+town\s+center' THEN 'Porter Ranch'
  -- Tier 3: Streets/Freeways
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '118\s*(freeway|fwy)' THEN 'Chatsworth'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '405\s*(freeway|fwy)' THEN 'Van Nuys'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* '101\s*(freeway|fwy)' THEN 'Encino'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'reseda\s+(blvd|boulevard)' THEN 'Reseda'
  WHEN lower(title || ' ' || coalesce(summary, '')) ~* 'balboa\s+(blvd|boulevard)' THEN 'Van Nuys'
  ELSE neighborhood_guess
END
WHERE neighborhood_guess IN ('San Fernando Valley', 'Unknown')
   OR neighborhood_guess IS NULL;