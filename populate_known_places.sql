INSERT INTO user_places (name, description, type, rating, best_time, entry_fee, timings, highlights, is_known, image_url)
VALUES 
(
  'Fort Kochi', 
  'Historic neighborhood with colonial architecture, Chinese fishing nets, and art galleries. A blend of Portuguese, Dutch, and British influences.',
  'Historical',
  4.5,
  'October to March',
  'Free',
  'All day',
  ARRAY['Chinese Fishing Nets', 'Art Galleries', 'Colonial Buildings', 'Street Art'],
  true,
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1000'
),
(
  'Marine Drive',
  'A beautiful promenade along the backwaters offering stunning views of the sunset and boat rides. Perfect for evening walks and photography.',
  'Scenic',
  4.3,
  'Evening',
  'Free',
  '24 hours',
  ARRAY['Sunset Views', 'Boat Rides', 'Shopping Complex', 'Food Stalls'],
  true,
  'https://images.unsplash.com/photo-1622307849202-a720473918a5?q=80&w=1000'
),
(
  'Hill Palace Museum',
  'Largest archaeological museum in Kerala with royal collections of the Kochi royal family and heritage buildings spread across 54 acres.',
  'Museum',
  4.2,
  '9 AM - 5 PM',
  '₹30 for adults',
  '9:00 AM - 5:00 PM',
  ARRAY['Royal Collections', 'Archaeological Park', 'Heritage Museum', 'Deer Park'],
  true,
  'https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2023/12/26/d28373b98357a9f73357778b8895b6c3_1703598767675.jpg'
),
(
  'Mattancherry Palace',
  'Also known as Dutch Palace, features Kerala murals depicting Hindu temple art and portraits of Kochi''s kings from the 16th century.',
  'Historical',
  4.4,
  '9 AM - 5 PM',
  '₹5 for Indians',
  '10:00 AM - 5:00 PM',
  ARRAY['Kerala Murals', 'Royal Portraits', 'Coronation Hall', 'Dutch Architecture'],
  true,
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mattancherry_Palace_front_view.jpg/1200px-Mattancherry_Palace_front_view.jpg'
),
(
  'Jewish Synagogue',
  'Built in 1568, it''s the oldest active synagogue in Commonwealth nations with hand-painted Chinese tiles and Belgian chandeliers.',
  'Historical',
  4.4,
  '10 AM - 12 PM, 3 PM - 5 PM',
  'Free',
  '10:00 AM - 5:00 PM',
  ARRAY['Chinese Tiles', 'Gold Crowns', 'Ancient Scrolls', 'Clock Tower'],
  true,
  ''
),
(
  'Cherai Beach',
  'A beautiful beach that combines sea and backwaters, ideal for swimming, dolphin spotting, and watching spectacular sunsets.',
  'Beach',
  4.3,
  'November to February',
  'Free',
  'All day',
  ARRAY['Dolphin Spotting', 'Backwaters', 'Clean Sands', 'Water Sports'],
  true,
  'https://www.keralatourism.org/images/destination/large/cherai_beach_ernakulam20131105154336_313_1.jpg'
)
ON CONFLICT DO NOTHING;
