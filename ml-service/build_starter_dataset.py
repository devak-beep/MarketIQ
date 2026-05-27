from pathlib import Path
import csv

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"

CONDITION_FACTORS = {
    "NEW": 1.0,
    "LIKE_NEW": 0.78,
    "GOOD": 0.58,
    "FAIR": 0.38,
    "POOR": 0.18,
}

PRODUCTS = [
    ("phones", "mobile-phones", "Realme C55 64GB", 11000),
    ("phones", "mobile-phones", "Realme C53 64GB", 10000),
    ("phones", "mobile-phones", "Realme Narzo N53 64GB", 11000),
    ("phones", "mobile-phones", "Realme Narzo 60 128GB", 18000),
    ("phones", "mobile-phones", "Realme Narzo 70 Pro 128GB", 22000),
    ("phones", "mobile-phones", "Realme 12 Pro 5G 128GB", 26000),
    ("phones", "mobile-phones", "Realme GT 6T 256GB", 33000),
    ("phones", "mobile-phones", "Redmi A3 64GB", 8000),
    ("phones", "mobile-phones", "Redmi 13C 128GB", 11000),
    ("phones", "mobile-phones", "Redmi Note 12 128GB", 17000),
    ("phones", "mobile-phones", "Redmi Note 13 Pro 128GB", 28000),
    ("phones", "mobile-phones", "Poco M6 Pro 128GB", 14000),
    ("phones", "mobile-phones", "Poco X6 Pro 256GB", 27000),
    ("phones", "mobile-phones", "Vivo Y21 64GB", 13000),
    ("phones", "mobile-phones", "Vivo T3 5G 128GB", 20000),
    ("phones", "mobile-phones", "Vivo V30 5G 128GB", 33000),
    ("phones", "mobile-phones", "Vivo V40 5G 256GB", 36000),
    ("phones", "mobile-phones", "Oppo A78 128GB", 18000),
    ("phones", "mobile-phones", "Oppo F25 Pro 128GB", 24000),
    ("phones", "mobile-phones", "Oppo Reno 13 5G 128GB", 38000),
    ("phones", "mobile-phones", "Oppo Reno 14 5G 256GB", 40000),
    ("phones", "mobile-phones", "OnePlus Nord CE 3 Lite 128GB", 20000),
    ("phones", "mobile-phones", "OnePlus Nord CE 4 128GB", 25000),
    ("phones", "mobile-phones", "OnePlus 11R 256GB", 40000),
    ("phones", "mobile-phones", "OnePlus 12 256GB", 65000),
    ("phones", "mobile-phones", "Samsung Galaxy M14 128GB", 14000),
    ("phones", "mobile-phones", "Samsung Galaxy A15 128GB", 18000),
    ("phones", "mobile-phones", "Samsung Galaxy A35 128GB", 30000),
    ("phones", "mobile-phones", "Samsung Galaxy S21 FE 128GB", 35000),
    ("phones", "mobile-phones", "Samsung Galaxy S23 128GB", 70000),
    ("phones", "mobile-phones", "Samsung Galaxy S24 Ultra 256GB", 120000),
    ("phones", "mobile-phones", "Apple iPhone SE 2022 64GB", 43000),
    ("phones", "mobile-phones", "Apple iPhone 11 64GB", 43000),
    ("phones", "mobile-phones", "Apple iPhone 12 64GB", 55000),
    ("phones", "mobile-phones", "Apple iPhone 13 128GB", 60000),
    ("phones", "mobile-phones", "Apple iPhone 14 128GB", 70000),
    ("phones", "mobile-phones", "Apple iPhone 14 Pro 128GB", 105000),
    ("phones", "mobile-phones", "Apple iPhone 15 128GB", 80000),
    ("phones", "mobile-phones", "Apple iPhone 15 Pro 128GB", 120000),
    ("laptops", "laptops", "Apple MacBook Pro M3 14 inch 16GB 512GB", 170000),
    ("laptops", "laptops", "Apple MacBook Pro M2 13 inch 8GB 512GB", 115000),
    ("laptops", "laptops", "Apple MacBook Air M2 8GB 256GB", 85000),
    ("laptops", "laptops", "Apple MacBook Air M1 8GB 256GB", 65000),
    ("laptops", "laptops", "Apple MacBook Air Intel i5 8GB 128GB", 55000),
    ("laptops", "laptops", "Dell XPS 13 i7 16GB 512GB SSD", 105000),
    ("laptops", "laptops", "Dell Latitude i5 8GB 256GB SSD", 45000),
    ("laptops", "laptops", "Dell Inspiron i5 8GB 512GB SSD", 52000),
    ("laptops", "laptops", "Dell Inspiron i3 4GB 256GB SSD", 32000),
    ("laptops", "laptops", "HP Pavilion i5 8GB 512GB SSD", 48000),
    ("laptops", "laptops", "HP 15s Ryzen 5 8GB 512GB SSD", 42000),
    ("laptops", "laptops", "HP Chromebook 4GB 64GB", 22000),
    ("laptops", "laptops", "Lenovo ThinkPad T14 i5 16GB 512GB SSD", 72000),
    ("laptops", "laptops", "Lenovo IdeaPad Slim 3 i3 8GB 256GB SSD", 33000),
    ("laptops", "laptops", "Lenovo V15 Celeron 4GB 128GB", 24000),
    ("laptops", "laptops", "Asus Vivobook i5 8GB 512GB SSD", 45000),
    ("laptops", "laptops", "Asus Vivobook i3 4GB 256GB SSD", 30000),
    ("laptops", "laptops", "Acer Aspire 7 Ryzen 5 GTX 1650 8GB 512GB", 56000),
    ("laptops", "laptops", "Acer Aspire 3 i3 8GB 256GB SSD", 30000),
    ("laptops", "laptops", "MSI Gaming Laptop i7 RTX 3050 16GB 512GB", 85000),
    ("laptops", "laptops", "Normal HP laptop i3 4GB 256GB SSD", 26000),
    ("tablets", "tablets", "Apple iPad Pro M2 11 inch 128GB WiFi", 82000),
    ("tablets", "tablets", "Apple iPad Air 5th Gen 64GB WiFi", 60000),
    ("tablets", "tablets", "Apple iPad 9th Gen 64GB WiFi", 32000),
    ("tablets", "tablets", "Samsung Galaxy Tab S9 128GB", 73000),
    ("tablets", "tablets", "Samsung Galaxy Tab S7 FE 64GB", 42000),
    ("tablets", "tablets", "Samsung Galaxy Tab A9 64GB", 18000),
    ("tablets", "tablets", "Lenovo Tab M10 64GB", 16000),
    ("tablets", "tablets", "Realme Pad Mini 32GB", 12000),
    ("cameras", "cameras", "Canon EOS 1500D DSLR kit lens", 45000),
    ("cameras", "cameras", "Canon EOS 200D II DSLR kit lens", 65000),
    ("cameras", "cameras", "Canon EOS R50 mirrorless kit lens", 78000),
    ("cameras", "cameras", "Canon EOS R6 Mark II body", 240000),
    ("cameras", "cameras", "Sony ZV-E10 mirrorless kit lens", 70000),
    ("cameras", "cameras", "Sony Alpha A6400 mirrorless body", 85000),
    ("cameras", "cameras", "Sony Alpha A7 III full frame body", 150000),
    ("cameras", "cameras", "Nikon D5600 DSLR kit lens", 52000),
    ("cameras", "cameras", "Nikon Z50 mirrorless kit lens", 85000),
    ("cameras", "cameras", "GoPro Hero 11 action camera", 45000),
    ("cameras", "cameras", "DJI Osmo Action 4 camera", 38000),
    ("accessories", "audio-headphones", "boAt Rockerz 450 Bluetooth headphones", 1800),
    ("accessories", "audio-headphones", "JBL Tune 760NC headphones", 6500),
    ("accessories", "audio-headphones", "Sony WH-CH720N headphones", 10000),
    ("accessories", "audio-headphones", "Sony WH-1000XM5 headphones", 30000),
    ("accessories", "audio-headphones", "Apple AirPods 2nd generation", 13000),
    ("accessories", "audio-headphones", "Apple AirPods Pro 2nd generation", 25000),
    ("accessories", "audio-headphones", "Samsung Galaxy Buds2 Pro", 18000),
    ("accessories", "audio-headphones", "Bose QuietComfort Ultra headphones", 36000),
    ("appliances", "tv-home-theatre", "Mi 32 inch HD Smart TV", 15000),
    ("appliances", "tv-home-theatre", "Samsung 43 inch 4K Smart TV", 36000),
    ("appliances", "tv-home-theatre", "Sony Bravia 55 inch 4K TV", 75000),
    ("appliances", "tv-home-theatre", "LG 55 inch OLED TV", 130000),
    ("appliances", "tv-home-theatre", "Sony HT-S20R home theatre", 20000),
    ("appliances", "tv-home-theatre", "JBL Cinema SB271 soundbar", 16000),
    ("games", "video-games-consoles", "Sony PlayStation 4 Slim 1TB", 30000),
    ("bikes", "motorcycles", "Royal Enfield Classic 350", 210000),
    ("bikes", "scooters", "Honda Activa scooter", 85000),
    ("bikes", "motorcycles", "Hero Splendor commuter bike", 75000),
    ("furniture", "furniture", "Ikea study table wooden desk", 12000),
    ("furniture", "furniture", "Office chair ergonomic mesh", 9000),
    ("furniture", "furniture", "Queen size bed with storage", 28000),
    ("games", "video-games-consoles", "Sony PlayStation 5 disc edition", 55000),
    ("games", "video-games-consoles", "Sony PlayStation 5 digital edition", 45000),
    ("games", "video-games-consoles", "Xbox Series X console", 55000),
    ("games", "video-games-consoles", "Xbox Series S console", 35000),
    ("games", "video-games-consoles", "Nintendo Switch OLED console", 33000),
    ("games", "video-games-consoles", "Nintendo Switch Lite console", 22000),
    ("appliances", "washing-machines", "LG front load washing machine 7kg", 38000),
    ("appliances", "refrigerators", "Samsung double door refrigerator 253L", 36000),
    ("appliances", "kitchen-appliances", "Whirlpool microwave oven 25L", 12000),
    ("books", "textbooks", "Engineering textbook set latest edition", 4500),
    ("books", "textbooks", "JEE preparation books full set", 7000),
    ("fitness", "gym-equipment", "Treadmill motorized foldable home gym", 45000),
    ("fitness", "gym-equipment", "Dumbbell set adjustable 20kg", 8000),
    ("accessories", "accessories", "Apple Magic Keyboard", 12000),
    ("accessories", "accessories", "Apple Pencil 2nd generation", 12000),
    ("accessories", "accessories", "Logitech MX Master wireless mouse", 9000),
    ("accessories", "accessories", "Logitech K380 Bluetooth keyboard", 3500),
    ("accessories", "accessories", "Samsung 1TB external SSD", 9000),
    ("accessories", "accessories", "SanDisk 128GB memory card", 1200),
]


def description_for(category, title, condition):
    base = f"{title}. {condition.lower().replace('_', ' ')} condition."
    if category == "laptops":
        return (
            f"{base} Battery backup checked, original charger included, "
            "working display keyboard trackpad and ports."
        )
    if category == "phones":
        return f"{base} Original phone, clean display, battery health checked."
    if category == "tablets":
        return f"{base} Display and touch working, charger included, battery backup checked."
    if category == "cameras":
        return f"{base} Lens and sensor clean, autofocus working, includes battery and charger."
    if category == "accessories":
        return f"{base} Original accessory, tested working, includes cable or case if available."
    if category == "appliances":
        return f"{base} Tested working, remote or accessories included where applicable."
    if category == "games":
        return f"{base} Console tested, controller and power cable included."
    return f"{base} Fully usable item with normal wear depending on condition."


def main():
    rows = []
    for category, subcategory, title, new_price in PRODUCTS:
        for condition, factor in CONDITION_FACTORS.items():
            price = round(new_price * factor / 100) * 100
            description = description_for(category, title, condition)
            rows.append(
                {
                    "category": category,
                    "subcategory": subcategory,
                    "condition": condition,
                    "title": title,
                    "description": description,
                    "description_length": len(description),
                    "price": int(price),
                }
            )

    with DATASET_PATH.open("w", newline="") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=[
                "category",
                "subcategory",
                "condition",
                "title",
                "description",
                "description_length",
                "price",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {DATASET_PATH}")


if __name__ == "__main__":
    main()
