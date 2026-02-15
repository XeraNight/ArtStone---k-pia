-- Insert default Slovak regions into the regions table
INSERT INTO regions (name) VALUES
  ('Bratislavský kraj'),
  ('Trnavský kraj'),
  ('Nitriansky kraj'),
  ('Trenčiansky kraj'),
  ('Žilinský kraj'),
  ('Banskobystrický kraj'),
  ('Prešovský kraj'),
  ('Košický kraj')
ON CONFLICT DO NOTHING;
