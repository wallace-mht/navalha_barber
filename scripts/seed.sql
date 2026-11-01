-- Dados fictícios para demonstração. Rode no editor SQL do banco DEPOIS de aplicar as migrations.
-- Pode ser executado mais de uma vez.
INSERT INTO shops (name, slug) VALUES ('Barbearia Demo', 'demo')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO haircuts (shop_id, name, slug, description, duration_minutes, price_in_cents, image_url, category)
SELECT s.id, v.name, v.slug, v.description, v.duration, v.price, '', v.category
FROM shops s,
(VALUES
  ('Degradê baixo', 'degrade-baixo', 'Laterais baixas com transição suave.', 35, 4000, 'degrade'),
  ('Social clássico', 'social-classico', 'Corte curto e alinhado.', 30, 3500, 'social'),
  ('Pompadour', 'pompadour', 'Volume no topo com laterais curtas.', 50, 5000, 'moderno')
) AS v(name, slug, description, duration, price, category)
WHERE s.slug = 'demo'
AND NOT EXISTS (SELECT 1 FROM haircuts h WHERE h.shop_id = s.id AND h.slug = v.slug);

INSERT INTO queue_status (shop_id, status, estimated_minutes)
SELECT id, 'normal', 20 FROM shops WHERE slug = 'demo'
ON CONFLICT (shop_id) DO NOTHING;
