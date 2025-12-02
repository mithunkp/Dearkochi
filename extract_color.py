from PIL import Image
from collections import Counter

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        img = img.resize((50, 50))
        
        pixels = list(img.getdata())
        # Filter out transparent and white/near-white pixels
        valid_pixels = [
            p for p in pixels 
            if p[3] > 0 and not (p[0] > 240 and p[1] > 240 and p[2] > 240)
        ]
        
        if not valid_pixels:
            return None
            
        counts = Counter(valid_pixels)
        most_common = counts.most_common(1)[0][0]
        
        return "#{:02x}{:02x}{:02x}".format(most_common[0], most_common[1], most_common[2])
    except Exception as e:
        print(f"Error: {e}")
        return None

color = get_dominant_color("public/8809a487-1eb5-48c2-b3d5-7ec2a6f96ead.png")
if color:
    print(f"Dominant Color: {color}")
else:
    print("No dominant color found")
