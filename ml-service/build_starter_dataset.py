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
    ("laptops", "Apple MacBook Pro M3 14 inch 16GB 512GB", 170000),
    ("laptops", "Apple MacBook Pro M2 13 inch 8GB 512GB", 115000),
    ("laptops", "Apple MacBook Air M2 8GB 256GB", 85000),
    ("laptops", "Apple MacBook Air M1 8GB 256GB", 65000),
    ("laptops", "Dell XPS 13 i7 16GB 512GB SSD", 105000),
    ("laptops", "Dell Inspiron i5 8GB 512GB SSD", 52000),
    ("laptops", "HP Pavilion i5 8GB 512GB SSD", 48000),
    ("laptops", "HP 15s Ryzen 5 8GB 512GB SSD", 42000),
    ("laptops", "Lenovo ThinkPad T14 i5 16GB 512GB SSD", 72000),
    ("laptops", "Lenovo IdeaPad Slim 3 i3 8GB 256GB SSD", 33000),
    ("laptops", "Asus Vivobook i5 8GB 512GB SSD", 45000),
    ("laptops", "Acer Aspire 7 Ryzen 5 GTX 1650 8GB 512GB", 56000),
    ("laptops", "MSI Gaming Laptop i7 RTX 3050 16GB 512GB", 85000),
    ("laptops", "Normal HP laptop i3 4GB 256GB SSD", 26000),
    ("phones", "Apple iPhone 15 Pro 128GB", 120000),
    ("phones", "Apple iPhone 14 Pro 128GB", 105000),
    ("phones", "Apple iPhone 13 128GB", 60000),
    ("phones", "Samsung Galaxy S24 Ultra 256GB", 120000),
    ("phones", "Samsung Galaxy S23 128GB", 70000),
    ("phones", "OnePlus 12 256GB", 65000),
    ("phones", "Redmi Note 13 Pro 128GB", 28000),
    ("cameras", "Canon EOS 1500D DSLR kit lens", 45000),
    ("cameras", "Sony Alpha A6400 mirrorless body", 85000),
    ("cameras", "Nikon D5600 DSLR kit lens", 52000),
    ("bikes", "Royal Enfield Classic 350", 210000),
    ("bikes", "Honda Activa scooter", 85000),
    ("bikes", "Hero Splendor commuter bike", 75000),
    ("furniture", "Ikea study table wooden desk", 12000),
    ("furniture", "Office chair ergonomic mesh", 9000),
    ("furniture", "Queen size bed with storage", 28000),
    ("games", "Sony PlayStation 5 disc edition", 55000),
    ("games", "Xbox Series S console", 35000),
    ("games", "Nintendo Switch OLED console", 33000),
    ("appliances", "LG front load washing machine 7kg", 38000),
    ("appliances", "Samsung double door refrigerator 253L", 36000),
    ("appliances", "Whirlpool microwave oven 25L", 12000),
    ("books", "Engineering textbook set latest edition", 4500),
    ("books", "JEE preparation books full set", 7000),
    ("fitness", "Treadmill motorized foldable home gym", 45000),
    ("fitness", "Dumbbell set adjustable 20kg", 8000),
    ("accessories", "Apple AirPods Pro 2nd generation", 25000),
    ("accessories", "Logitech MX Master wireless mouse", 9000),
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
    return f"{base} Fully usable item with normal wear depending on condition."


def main():
    rows = []
    for category, title, new_price in PRODUCTS:
        for condition, factor in CONDITION_FACTORS.items():
            price = round(new_price * factor / 100) * 100
            description = description_for(category, title, condition)
            rows.append(
                {
                    "category": category,
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
