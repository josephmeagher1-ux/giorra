-- Irish toll roads (2026 prices, tagged/untagged)
-- toll_point: approximate GPS of the toll plaza
-- corridor_line: short line segment the route must cross near the toll

INSERT INTO public.toll_roads (name, road_code, toll_point, corridor_line, price_tagged, price_untagged, direction) VALUES
('M50 eFlow', 'M50',
  ST_GeogFromText('POINT(-6.3700 53.3900)'),
  ST_GeogFromText('LINESTRING(-6.3800 53.3850, -6.3600 53.3950)'),
  2.60, 3.10, 'both'),

('M1 Gormanston', 'M1',
  ST_GeogFromText('POINT(-6.3300 53.6100)'),
  ST_GeogFromText('LINESTRING(-6.3400 53.6050, -6.3200 53.6150)'),
  1.90, 2.30, 'both'),

('M4 Kilcock', 'M4',
  ST_GeogFromText('POINT(-6.6700 53.3800)'),
  ST_GeogFromText('LINESTRING(-6.6800 53.3750, -6.6600 53.3850)'),
  3.00, 3.60, 'both'),

('M3 Dunboyne', 'M3',
  ST_GeogFromText('POINT(-6.4800 53.4300)'),
  ST_GeogFromText('LINESTRING(-6.4900 53.4250, -6.4700 53.4350)'),
  1.50, 1.90, 'both'),

('M7/M8 Portlaoise', 'M7',
  ST_GeogFromText('POINT(-7.5400 53.0200)'),
  ST_GeogFromText('LINESTRING(-7.5500 53.0150, -7.5300 53.0250)'),
  1.90, 2.30, 'both'),

('N6 Galway-Ballinasloe', 'N6',
  ST_GeogFromText('POINT(-8.2300 53.3300)'),
  ST_GeogFromText('LINESTRING(-8.2400 53.3250, -8.2200 53.3350)'),
  1.80, 2.20, 'both'),

('N8 Fermoy', 'N8',
  ST_GeogFromText('POINT(-8.2700 52.1400)'),
  ST_GeogFromText('LINESTRING(-8.2800 52.1350, -8.2600 52.1450)'),
  1.70, 2.10, 'both'),

('N18 Limerick Tunnel', 'N18',
  ST_GeogFromText('POINT(-8.6700 52.6400)'),
  ST_GeogFromText('LINESTRING(-8.6800 52.6350, -8.6600 52.6450)'),
  1.90, 2.80, 'both'),

('N25 Waterford', 'N25',
  ST_GeogFromText('POINT(-7.1100 52.2600)'),
  ST_GeogFromText('LINESTRING(-7.1200 52.2550, -7.1000 52.2650)'),
  1.40, 1.90, 'both'),

('East Link Dublin', 'EAST_LINK',
  ST_GeogFromText('POINT(-6.2200 53.3500)'),
  ST_GeogFromText('LINESTRING(-6.2300 53.3450, -6.2100 53.3550)'),
  1.54, 2.06, 'both');

-- Initial fuel prices (May 2026 averages)
INSERT INTO public.fuel_prices (fuel, price_per_litre, kwh_price, source, effective_date) VALUES
('petrol', 1.81, NULL, 'aa_ireland', '2026-05-01'),
('diesel', 1.97, NULL, 'aa_ireland', '2026-05-01'),
('hybrid_petrol', 1.81, NULL, 'aa_ireland', '2026-05-01'),
('hybrid_diesel', 1.97, NULL, 'aa_ireland', '2026-05-01'),
('electric', 0.00, 0.30, 'manual', '2026-05-01');
