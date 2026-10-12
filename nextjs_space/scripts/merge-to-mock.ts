import fs from "fs";
import path from "path";

async function main() {
  const mockDbPath = path.resolve(process.cwd(), "firebase-mock.json");
  if (!fs.existsSync(mockDbPath)) {
    console.error("❌ local firebase-mock.json file not found!");
    process.exit(1);
  }

  console.log("🌱 Reading firebase-mock.json...");
  const data = JSON.parse(fs.readFileSync(mockDbPath, "utf8"));

  // The 100 mobile products we defined earlier (matching the schema for mock db)
  // We can import them or define them here. Let's list the same 100 products.
  const mobileModels = [
    // --- APPLE (10 models) ---
    {
      name: "Apple iPhone 15 Pro Max",
      brand: "Apple",
      price: 144900,
      originalPrice: 159900,
      image: "https://m.media-amazon.com/images/I/61+PdZLA6NL.jpg",
      description: "6.7-inch Super Retina XDR display, A17 Pro chip, 48MP Pro camera system, titanium design. The most advanced iPhone ever.",
      specs: { Display: "6.7-inch OLED", Processor: "A17 Pro", RAM: "8GB", Storage: "256GB", Battery: "4422mAh", Camera: "48MP Triple" }
    },
    {
      name: "Apple iPhone 15 Pro",
      brand: "Apple",
      price: 124900,
      originalPrice: 134900,
      image: "https://m.media-amazon.com/images/I/61+PdZLA6NL.jpg",
      description: "6.1-inch Super Retina XDR display, A17 Pro chip, Action button, Pro camera system with 3x Telephoto.",
      specs: { Display: "6.1-inch OLED", Processor: "A17 Pro", RAM: "8GB", Storage: "128GB", Battery: "3274mAh", Camera: "48MP Triple" }
    },
    {
      name: "Apple iPhone 15 Plus",
      brand: "Apple",
      price: 84900,
      originalPrice: 89900,
      image: "https://m.media-amazon.com/images/I/71d7rfSl0wL._SX679_.jpg",
      description: "6.7-inch Super Retina XDR display, Dynamic Island, A16 Bionic chip, and dual-camera system with 48MP Main.",
      specs: { Display: "6.7-inch OLED", Processor: "A16 Bionic", RAM: "6GB", Storage: "128GB", Battery: "4383mAh", Camera: "48MP Dual" }
    },
    {
      name: "Apple iPhone 15",
      brand: "Apple",
      price: 74900,
      originalPrice: 79900,
      image: "https://m.media-amazon.com/images/I/71v2jKBZFtL._SX679_.jpg",
      description: "6.1-inch display, Dynamic Island, A16 Bionic, 48MP Main camera, USB-C connector, and color-infused glass design.",
      specs: { Display: "6.1-inch OLED", Processor: "A16 Bionic", RAM: "6GB", Storage: "128GB", Battery: "3349mAh", Camera: "48MP Dual" }
    },
    {
      name: "Apple iPhone 14 Pro Max",
      brand: "Apple",
      price: 119900,
      originalPrice: 139900,
      image: "https://m.media-amazon.com/images/I/610pghkO81L._SX679_.jpg",
      description: "6.7-inch Always-On display, Dynamic Island, A16 Bionic chip, and 48MP Main camera for mind-blowing detail.",
      specs: { Display: "6.7-inch OLED", Processor: "A16 Bionic", RAM: "6GB", Storage: "128GB", Battery: "4323mAh", Camera: "48MP Triple" }
    },
    {
      name: "Apple iPhone 14 Pro",
      brand: "Apple",
      price: 109900,
      originalPrice: 129900,
      image: "https://m.media-amazon.com/images/I/61HHS0HrjpL._SX679_.jpg",
      description: "6.1-inch Super Retina XDR display with ProMotion, Dynamic Island, A16 Bionic, and 48MP camera.",
      specs: { Display: "6.1-inch OLED", Processor: "A16 Bionic", RAM: "6GB", Storage: "128GB", Battery: "3200mAh", Camera: "48MP Triple" }
    },
    {
      name: "Apple iPhone 14 Plus",
      brand: "Apple",
      price: 69900,
      originalPrice: 79900,
      image: "https://m.media-amazon.com/images/I/61BGE6iu4AL._SX679_.jpg",
      description: "6.7-inch Super Retina XDR display, advanced dual-camera system, A15 Bionic chip, and industry-leading battery life.",
      specs: { Display: "6.7-inch OLED", Processor: "A15 Bionic", RAM: "6GB", Storage: "128GB", Battery: "4325mAh", Camera: "12MP Dual" }
    },
    {
      name: "Apple iPhone 14",
      brand: "Apple",
      price: 59900,
      originalPrice: 69900,
      image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SX679_.jpg",
      description: "6.1-inch display, A15 Bionic chip, crash detection, advanced camera system for better low-light photos.",
      specs: { Display: "6.1-inch OLED", Processor: "A15 Bionic", RAM: "6GB", Storage: "128GB", Battery: "3279mAh", Camera: "12MP Dual" }
    },
    {
      name: "Apple iPhone 13",
      brand: "Apple",
      price: 49900,
      originalPrice: 59900,
      image: "https://m.media-amazon.com/images/I/71GLMJ7TQiL._SX679_.jpg",
      description: "6.1-inch Super Retina XDR display, A15 Bionic chip, dual-camera system with Sensor-shift OIS.",
      specs: { Display: "6.1-inch OLED", Processor: "A15 Bionic", RAM: "4GB", Storage: "128GB", Battery: "3227mAh", Camera: "12MP Dual" }
    },
    {
      name: "Apple iPhone SE (2022)",
      brand: "Apple",
      price: 39900,
      originalPrice: 43900,
      image: "https://m.media-amazon.com/images/I/61A3V06OclL._SX679_.jpg",
      description: "4.7-inch Retina HD display, A15 Bionic chip, 12MP Wide camera, 5G connectivity, and Home button with Touch ID.",
      specs: { Display: "4.7-inch Retina LCD", Processor: "A15 Bionic", RAM: "4GB", Storage: "64GB", Battery: "2018mAh", Camera: "12MP Single" }
    },

    // --- SAMSUNG (15 models) ---
    {
      name: "Samsung Galaxy S24 Ultra",
      brand: "Samsung",
      price: 129999,
      originalPrice: 139999,
      image: "https://m.media-amazon.com/images/I/71RVuS5r5tL._SX679_.jpg",
      description: "Galaxy AI is here. 6.8-inch Dynamic AMOLED 2X, Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, titanium chassis.",
      specs: { Display: "6.8-inch AMOLED", Processor: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Battery: "5000mAh", Camera: "200MP Quad" }
    },
    {
      name: "Samsung Galaxy S24+",
      brand: "Samsung",
      price: 99999,
      originalPrice: 109999,
      image: "https://m.media-amazon.com/images/I/719n6Jv2E+L._SX679_.jpg",
      description: "6.7-inch QHD+ display, Exynos 2400 / Snapdragon 8 Gen 3, Galaxy AI features, 4900mAh battery, 50MP triple camera.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Exynos 2400", RAM: "12GB", Storage: "256GB", Battery: "4900mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy S24",
      brand: "Samsung",
      price: 79999,
      originalPrice: 84999,
      image: "https://m.media-amazon.com/images/I/71R12H++G2L._SX679_.jpg",
      description: "Compact flagship. 6.2-inch FHD+ 120Hz display, Exynos 2400, Galaxy AI, 4000mAh battery, and 50MP camera.",
      specs: { Display: "6.2-inch AMOLED", Processor: "Exynos 2400", RAM: "8GB", Storage: "128GB", Battery: "4000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy S23 Ultra",
      brand: "Samsung",
      price: 104999,
      originalPrice: 124999,
      image: "https://m.media-amazon.com/images/I/61VfL-3v7FL._SX679_.jpg",
      description: "Ultimate camera flagship of 2023. 200MP camera, Snapdragon 8 Gen 2, 6.8-inch AMOLED, and S Pen.",
      specs: { Display: "6.8-inch AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "12GB", Storage: "256GB", Battery: "5000mAh", Camera: "200MP Quad" }
    },
    {
      name: "Samsung Galaxy S23 FE",
      brand: "Samsung",
      price: 49999,
      originalPrice: 59999,
      image: "https://m.media-amazon.com/images/I/71e1kQ154FL._SX679_.jpg",
      description: "Flagship experience at a great price. 6.4-inch display, Exynos 2200, 50MP triple camera, and IP68 rating.",
      specs: { Display: "6.4-inch AMOLED", Processor: "Exynos 2200", RAM: "8GB", Storage: "128GB", Battery: "4500mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy Z Fold 5",
      brand: "Samsung",
      price: 154999,
      originalPrice: 164999,
      image: "https://m.media-amazon.com/images/I/7162y5D4oOL._SX679_.jpg",
      description: "Unfold a massive screen. 7.6-inch main screen, Snapdragon 8 Gen 2, multi-window multitasking, and S Pen support.",
      specs: { Display: "7.6-inch Foldable AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "12GB", Storage: "256GB", Battery: "4400mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy Z Flip 5",
      brand: "Samsung",
      price: 99999,
      originalPrice: 102999,
      image: "https://m.media-amazon.com/images/I/61b7f2zB6qL._SX679_.jpg",
      description: "Compact fold. Flex Window 3.4-inch cover screen, 6.7-inch main AMOLED, Snapdragon 8 Gen 2, hands-free camera.",
      specs: { Display: "6.7-inch Foldable AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "8GB", Storage: "256GB", Battery: "3700mAh", Camera: "12MP Dual" }
    },
    {
      name: "Samsung Galaxy A55 5G",
      brand: "Samsung",
      price: 39999,
      originalPrice: 42999,
      image: "https://m.media-amazon.com/images/I/71x4xS-gNFL._SX679_.jpg",
      description: "Premium mid-range. Glass back, metal frame, 6.6-inch FHD+ 120Hz display, Exynos 1480, 50MP camera, Knox Vault.",
      specs: { Display: "6.6-inch AMOLED", Processor: "Exynos 1480", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy A35 5G",
      brand: "Samsung",
      price: 30999,
      originalPrice: 33999,
      image: "https://m.media-amazon.com/images/I/71T-+b-w55L._SX679_.jpg",
      description: "6.6-inch FHD+ Super AMOLED 120Hz screen, Exynos 1380 processor, 50MP camera with OIS, and IP67 rating.",
      specs: { Display: "6.6-inch AMOLED", Processor: "Exynos 1380", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy A15 5G",
      brand: "Samsung",
      price: 17999,
      originalPrice: 19999,
      image: "https://m.media-amazon.com/images/I/81734uO4QIL._SX679_.jpg",
      description: "6.5-inch Super AMOLED display, Dimensity 6100+ processor, 50MP triple camera, 5000mAh battery.",
      specs: { Display: "6.5-inch AMOLED", Processor: "Dimensity 6100+", RAM: "6GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy M55 5G",
      brand: "Samsung",
      price: 26999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/81Sc2c3A3yL._SX679_.jpg",
      description: "6.7-inch AMOLED 120Hz display, Snapdragon 7 Gen 1, 50MP front camera, 45W super fast charging.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Snapdragon 7 Gen 1", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy M34 5G",
      brand: "Samsung",
      price: 15999,
      originalPrice: 24499,
      image: "https://m.media-amazon.com/images/I/81xU-tXhDYL._SX679_.jpg",
      description: "Monster battery. 6000mAh battery, 50MP No Shake OIS camera, Exynos 1280, 120Hz AMOLED display.",
      specs: { Display: "6.5-inch AMOLED", Processor: "Exynos 1280", RAM: "6GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy M15 5G",
      brand: "Samsung",
      price: 12999,
      originalPrice: 15999,
      image: "https://m.media-amazon.com/images/I/814-Fw-5gGL._SX679_.jpg",
      description: "6000mAh battery, MediaTek Dimensity 6100+, 90Hz Super AMOLED display, 50MP triple camera.",
      specs: { Display: "6.5-inch AMOLED", Processor: "Dimensity 6100+", RAM: "4GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy F55 5G",
      brand: "Samsung",
      price: 27999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/8118V6G+2KL._SX679_.jpg",
      description: "Elegant vegan leather back design, Snapdragon 7 Gen 1, 120Hz Super AMOLED+, 45W fast charging.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Snapdragon 7 Gen 1", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Samsung Galaxy F15 5G",
      brand: "Samsung",
      price: 11999,
      originalPrice: 14999,
      image: "https://m.media-amazon.com/images/I/81SStm3G-fL._SX679_.jpg",
      description: "Segment best 6000mAh battery, 90Hz AMOLED display, 4 Gen Android OS updates, MediaTek Dimensity 6100+.",
      specs: { Display: "6.5-inch AMOLED", Processor: "Dimensity 6100+", RAM: "4GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Triple" }
    },

    // --- ONEPLUS (10 models) ---
    {
      name: "OnePlus 12",
      brand: "OnePlus",
      price: 64999,
      originalPrice: 69999,
      image: "https://m.media-amazon.com/images/I/61JS76UdPoL._SX679_.jpg",
      description: "Smooth Beyond Belief. Snapdragon 8 Gen 3, 4th Gen Hasselblad camera, 2K 120Hz display, 100W charging.",
      specs: { Display: "6.82-inch LTPO AMOLED", Processor: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Battery: "5400mAh", Camera: "50MP Hasselblad" }
    },
    {
      name: "OnePlus 12R",
      brand: "OnePlus",
      price: 39999,
      originalPrice: 42999,
      image: "https://m.media-amazon.com/images/I/717Qo4MH97L._SX679_.jpg",
      description: "Performance powerhouse. Snapdragon 8 Gen 2, 1.5K LTPO AMOLED, 5500mAh battery (largest ever in OnePlus), 100W SUPERVOOC.",
      specs: { Display: "6.78-inch AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5500mAh", Camera: "50MP Triple" }
    },
    {
      name: "OnePlus Open",
      brand: "OnePlus",
      price: 139999,
      originalPrice: 149999,
      image: "https://m.media-amazon.com/images/I/715u2y-P2eL._SX679_.jpg",
      description: "OnePlus's first foldable. 7.82-inch Flexi-fluid AMOLED, Snapdragon 8 Gen 2, Hasselblad cameras, lightweight design.",
      specs: { Display: "7.82-inch Foldable AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "16GB", Storage: "512GB", Battery: "4805mAh", Camera: "48MP Hasselblad" }
    },
    {
      name: "OnePlus Nord CE 4 5G",
      brand: "OnePlus",
      price: 24999,
      originalPrice: 26999,
      image: "https://m.media-amazon.com/images/I/61S4hJ1K5wL._SX679_.jpg",
      description: "Snapdragon 7 Gen 3, 100W SUPERVOOC charging, 5500mAh battery, 50MP Sony LYT-600 camera with OIS.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Snapdragon 7 Gen 3", RAM: "8GB", Storage: "128GB", Battery: "5500mAh", Camera: "50MP Dual" }
    },
    {
      name: "OnePlus Nord CE 4 Lite 5G",
      brand: "OnePlus",
      price: 19999,
      originalPrice: 21999,
      image: "https://m.media-amazon.com/images/I/61699B5HCHL._SX679_.jpg",
      description: "80W SUPERVOOC, 5110mAh battery, 120Hz AMOLED display, 50MP Sony LYT-600 camera, dual stereo speakers.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Snapdragon 695", RAM: "8GB", Storage: "128GB", Battery: "5110mAh", Camera: "50MP Dual" }
    },
    {
      name: "OnePlus 11 5G",
      brand: "OnePlus",
      price: 51999,
      originalPrice: 56999,
      image: "https://m.media-amazon.com/images/I/61amb0yGQyL._SX679_.jpg",
      description: "Snapdragon 8 Gen 2, 3rd Gen Hasselblad Camera, 2K 120Hz fluid AMOLED display, 100W SUPERVOOC.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Hasselblad" }
    },
    {
      name: "OnePlus 11R 5G",
      brand: "OnePlus",
      price: 32999,
      originalPrice: 39999,
      image: "https://m.media-amazon.com/images/I/61u9zN1oeeL._SX679_.jpg",
      description: "Snapdragon 8+ Gen 1, 120Hz Super Fluid AMOLED, 100W SUPERVOOC, 50MP Sony IMX890 camera.",
      specs: { Display: "6.74-inch AMOLED", Processor: "Snapdragon 8+ Gen 1", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "OnePlus Nord 3 5G",
      brand: "OnePlus",
      price: 27999,
      originalPrice: 33999,
      image: "https://m.media-amazon.com/images/I/617r5+t-tXL._SX679_.jpg",
      description: "MediaTek Dimensity 9000 flagship processor, 50MP Sony IMX890 camera, 80W SUPERVOOC charging.",
      specs: { Display: "6.74-inch AMOLED", Processor: "Dimensity 9000", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "OnePlus Nord CE 3 5G",
      brand: "OnePlus",
      price: 22999,
      originalPrice: 26999,
      image: "https://m.media-amazon.com/images/I/61VeqTzLcuL._SX679_.jpg",
      description: "Snapdragon 782G, 50MP IMX890 OIS camera, 80W charging, 120Hz fluid AMOLED screen.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Snapdragon 782G", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "OnePlus Nord CE 3 Lite 5G",
      brand: "OnePlus",
      price: 16999,
      originalPrice: 19999,
      image: "https://m.media-amazon.com/images/I/61fZ+Y43CIL._SX679_.jpg",
      description: "108MP camera, 67W SUPERVOOC fast charging, Snapdragon 695 5G, and large 120Hz display.",
      specs: { Display: "6.72-inch LCD", Processor: "Snapdragon 695", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "108MP Triple" }
    },

    // --- GOOGLE (8 models) ---
    {
      name: "Google Pixel 8 Pro",
      brand: "Google",
      price: 99999,
      originalPrice: 106999,
      image: "https://m.media-amazon.com/images/I/51M3fA7c1+L._SX679_.jpg",
      description: "The all-pro phone engineered by Google. Tensor G3, advanced AI features, Pro camera system, thermometer.",
      specs: { Display: "6.7-inch LTPO OLED", Processor: "Google Tensor G3", RAM: "12GB", Storage: "128GB", Battery: "5050mAh", Camera: "48MP Triple" }
    },
    {
      name: "Google Pixel 8",
      brand: "Google",
      price: 64999,
      originalPrice: 75999,
      image: "https://m.media-amazon.com/images/I/51U63Hq8wHL._SX679_.jpg",
      description: "Pixel-perfect AI. Tensor G3, 120Hz Actua display, Best Take, Magic Eraser, and 7 years of OS updates.",
      specs: { Display: "6.2-inch OLED", Processor: "Google Tensor G3", RAM: "8GB", Storage: "128GB", Battery: "4575mAh", Camera: "50MP Dual" }
    },
    {
      name: "Google Pixel 8a",
      brand: "Google",
      price: 49999,
      originalPrice: 52999,
      image: "https://m.media-amazon.com/images/I/71Yy8+cW1NL._SX679_.jpg",
      description: "AI powerhouse at a lower price. Tensor G3, 120Hz display, Gemini assistant integration, Pixel camera magic.",
      specs: { Display: "6.1-inch OLED", Processor: "Google Tensor G3", RAM: "8GB", Storage: "128GB", Battery: "4492mAh", Camera: "64MP Dual" }
    },
    {
      name: "Google Pixel 7 Pro",
      brand: "Google",
      price: 66999,
      originalPrice: 84999,
      image: "https://m.media-amazon.com/images/I/71vFKBpKinL._SX679_.jpg",
      description: "Google's 2022 flagship. Tensor G2, 5x optical zoom camera, macro focus, high-refresh display.",
      specs: { Display: "6.7-inch OLED", Processor: "Google Tensor G2", RAM: "12GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Google Pixel 7",
      brand: "Google",
      price: 44999,
      originalPrice: 59999,
      image: "https://m.media-amazon.com/images/I/51d6S9b9WNL._SX679_.jpg",
      description: "Super fast, secure, and helpful. Google Tensor G2, 90Hz display, cinematic blur video.",
      specs: { Display: "6.3-inch OLED", Processor: "Google Tensor G2", RAM: "8GB", Storage: "128GB", Battery: "4355mAh", Camera: "50MP Dual" }
    },
    {
      name: "Google Pixel 7a",
      brand: "Google",
      price: 35999,
      originalPrice: 43999,
      image: "https://m.media-amazon.com/images/I/51H0f-X7xIL._SX679_.jpg",
      description: "Google Tensor G2, 64MP camera, 90Hz fluid display, wireless charging support, and Pixel security.",
      specs: { Display: "6.1-inch OLED", Processor: "Google Tensor G2", RAM: "8GB", Storage: "128GB", Battery: "4385mAh", Camera: "64MP Dual" }
    },
    {
      name: "Google Pixel 6a",
      brand: "Google",
      price: 26999,
      originalPrice: 43999,
      image: "https://m.media-amazon.com/images/I/617MDeY48KL._SX679_.jpg",
      description: "Compact Pixel. Powered by Google Tensor, excellent point-and-shoot camera, adaptive battery.",
      specs: { Display: "6.1-inch OLED", Processor: "Google Tensor", RAM: "6GB", Storage: "128GB", Battery: "4410mAh", Camera: "12MP Dual" }
    },
    {
      name: "Google Pixel Fold",
      brand: "Google",
      price: 144999,
      originalPrice: 159999,
      image: "https://m.media-amazon.com/images/I/71e-S7F5J1L._SX679_.jpg",
      description: "Google's first foldable. Thin design, Google Tensor G2, splitscreen multitasking, professional cameras.",
      specs: { Display: "7.6-inch Foldable OLED", Processor: "Google Tensor G2", RAM: "12GB", Storage: "256GB", Battery: "4821mAh", Camera: "48MP Triple" }
    },

    // --- XIAOMI / REDMI / POCO (12 models) ---
    {
      name: "Xiaomi 14",
      brand: "Xiaomi",
      price: 69999,
      originalPrice: 79999,
      image: "https://m.media-amazon.com/images/I/71c6hNpepAL._SX679_.jpg",
      description: "Compact lens flagship. Leica Summilux lens, Snapdragon 8 Gen 3, 120Hz LTPO AMOLED, 90W HyperCharge.",
      specs: { Display: "6.36-inch OLED", Processor: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "512GB", Battery: "4610mAh", Camera: "50MP Leica Triple" }
    },
    {
      name: "Xiaomi 14 Ultra",
      brand: "Xiaomi",
      price: 99999,
      originalPrice: 119999,
      image: "https://m.media-amazon.com/images/I/71Yy8+cW1NL._SX679_.jpg",
      description: "Ultimate photography flagship. Leica quad camera with 1-inch main sensor, Snapdragon 8 Gen 3.",
      specs: { Display: "6.73-inch OLED", Processor: "Snapdragon 8 Gen 3", RAM: "16GB", Storage: "512GB", Battery: "5000mAh", Camera: "50MP Leica Quad" }
    },
    {
      name: "Xiaomi Redmi Note 13 Pro+ 5G",
      brand: "Xiaomi",
      price: 31999,
      originalPrice: 35999,
      image: "https://m.media-amazon.com/images/I/71d1ytkCtqL._SX679_.jpg",
      description: "Curved AMOLED 120Hz display, 200MP camera with OIS, MediaTek Dimensity 7200 Ultra, 120W HyperCharge.",
      specs: { Display: "6.67-inch Curved OLED", Processor: "Dimensity 7200 Ultra", RAM: "8GB", Storage: "256GB", Battery: "5000mAh", Camera: "200MP Triple" }
    },
    {
      name: "Xiaomi Redmi Note 13 Pro 5G",
      brand: "Xiaomi",
      price: 25999,
      originalPrice: 28999,
      image: "https://m.media-amazon.com/images/I/71c6hNpepAL._SX679_.jpg",
      description: "200MP camera, Snapdragon 7s Gen 2, 1.5K 120Hz AMOLED, 67W turbo charging.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Snapdragon 7s Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5100mAh", Camera: "200MP Triple" }
    },
    {
      name: "Xiaomi Redmi Note 13 5G",
      brand: "Xiaomi",
      price: 16999,
      originalPrice: 19999,
      image: "https://m.media-amazon.com/images/I/71d1ytkCtqL._SX679_.jpg",
      description: "Super slim 5G phone. 108MP camera, 120Hz AMOLED display, MediaTek Dimensity 6080.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 6080", RAM: "6GB", Storage: "128GB", Battery: "5000mAh", Camera: "108MP Triple" }
    },
    {
      name: "POCO X6 Pro 5G",
      brand: "POCO",
      price: 25999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/715J6s9871L._SX679_.jpg",
      description: "Speed Beast. Dimensity 8300 Ultra, 1.5K 120Hz OLED, 64MP triple camera with OIS, wild performance.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 8300 Ultra", RAM: "8GB", Storage: "256GB", Battery: "5000mAh", Camera: "64MP Triple" }
    },
    {
      name: "POCO F6 5G",
      brand: "POCO",
      price: 29999,
      originalPrice: 33999,
      image: "https://m.media-amazon.com/images/I/715J6s9871L._SX679_.jpg",
      description: "Snapdragon 8s Gen 3 flagship-grade processor, LPDDR5X + UFS 4.0, 90W fast charging, 120Hz flow AMOLED.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Snapdragon 8s Gen 3", RAM: "8GB", Storage: "256GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "POCO M6 Pro 5G",
      brand: "POCO",
      price: 9999,
      originalPrice: 14999,
      image: "https://m.media-amazon.com/images/I/71c6hNpepAL._SX679_.jpg",
      description: "Snapdragon 4 Gen 2 budget king, 90Hz display, glass back design, 5000mAh battery.",
      specs: { Display: "6.79-inch LCD", Processor: "Snapdragon 4 Gen 2", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Xiaomi Redmi 13C 5G",
      brand: "Xiaomi",
      price: 10499,
      originalPrice: 13999,
      image: "https://m.media-amazon.com/images/I/71d1ytkCtqL._SX679_.jpg",
      description: "Super affordable 5G. Dimensity 6100+ processor, 50MP AI dual camera, 90Hz high refresh screen.",
      specs: { Display: "6.74-inch LCD", Processor: "Dimensity 6100+", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Xiaomi Redmi 12 5G",
      brand: "Xiaomi",
      price: 11999,
      originalPrice: 15999,
      image: "https://m.media-amazon.com/images/I/71c6hNpepAL._SX679_.jpg",
      description: "Snapdragon 4 Gen 2, crystal glass design, 50MP camera, large screen with 90Hz refresh rate.",
      specs: { Display: "6.79-inch LCD", Processor: "Snapdragon 4 Gen 2", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Xiaomi 13 Pro",
      brand: "Xiaomi",
      price: 79999,
      originalPrice: 89999,
      image: "https://m.media-amazon.com/images/I/71c6hNpepAL._SX679_.jpg",
      description: "Leica professional optics, 1-inch IMX989 sensor, Snapdragon 8 Gen 2, 120W HyperCharge.",
      specs: { Display: "6.73-inch OLED", Processor: "Snapdragon 8 Gen 2", RAM: "12GB", Storage: "256GB", Battery: "4820mAh", Camera: "50MP Leica Triple" }
    },
    {
      name: "POCO X6 5G",
      brand: "POCO",
      price: 19999,
      originalPrice: 22999,
      image: "https://m.media-amazon.com/images/I/715J6s9871L._SX679_.jpg",
      description: "Snapdragon 7s Gen 2 processor, 120Hz CrystalRes Flow AMOLED, 64MP OIS camera, 67W turbo charging.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Snapdragon 7s Gen 2", RAM: "8GB", Storage: "256GB", Battery: "5100mAh", Camera: "64MP Triple" }
    },

    // --- REALME (10 models) ---
    {
      name: "Realme GT 6 5G",
      brand: "Realme",
      price: 40999,
      originalPrice: 43999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "AI Flagship Killer. Snapdragon 8s Gen 3, 6000 nits ultra bright display, Sony LYT-808 OIS camera, 120W charging.",
      specs: { Display: "6.78-inch LTPO OLED", Processor: "Snapdragon 8s Gen 3", RAM: "12GB", Storage: "256GB", Battery: "5500mAh", Camera: "50MP Sony Triple" }
    },
    {
      name: "Realme GT 6T 5G",
      brand: "Realme",
      price: 30999,
      originalPrice: 33999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "Snapdragon 7+ Gen 3 powerhouse, 120Hz LTPO display, 5500mAh battery with 120W SUPERVOOC charging.",
      specs: { Display: "6.78-inch AMOLED", Processor: "Snapdragon 7+ Gen 3", RAM: "8GB", Storage: "128GB", Battery: "5500mAh", Camera: "50MP Dual" }
    },
    {
      name: "Realme 12 Pro+ 5G",
      brand: "Realme",
      price: 29999,
      originalPrice: 34999,
      image: "https://m.media-amazon.com/images/I/81+21r4g2pL._SX679_.jpg",
      description: "64MP Periscope Portrait Camera with 3x zoom, Snapdragon 7s Gen 2, premium luxury watch design back.",
      specs: { Display: "6.7-inch Curved AMOLED", Processor: "Snapdragon 7s Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP+64MP Triple" }
    },
    {
      name: "Realme 12 Pro 5G",
      brand: "Realme",
      price: 23999,
      originalPrice: 27999,
      image: "https://m.media-amazon.com/images/I/81+21r4g2pL._SX679_.jpg",
      description: "32MP Telephoto portrait camera, Snapdragon 6 Gen 1, 120Hz curved vision display, vegan leather back.",
      specs: { Display: "6.7-inch Curved AMOLED", Processor: "Snapdragon 6 Gen 1", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Realme 12 5G",
      brand: "Realme",
      price: 16999,
      originalPrice: 18999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "108MP 3x zoom portrait camera, MediaTek Dimensity 6100+, dynamic RAM up to 16GB, trendy watch design.",
      specs: { Display: "6.72-inch LCD", Processor: "Dimensity 6100+", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "108MP Dual" }
    },
    {
      name: "Realme 12x 5G",
      brand: "Realme",
      price: 11999,
      originalPrice: 14999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "Slimmest 120Hz 5G phone under 12K, Dimensity 6100+ processor, 50MP camera, 45W SUPERVOOC charging.",
      specs: { Display: "6.72-inch LCD", Processor: "Dimensity 6100+", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Realme Narzo 70 Pro 5G",
      brand: "Realme",
      price: 19999,
      originalPrice: 22999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "Duo-touch glass design, Sony IMX890 OIS camera, MediaTek Dimensity 7050, air gesture control.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 7050", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Triple" }
    },
    {
      name: "Realme Narzo 70x 5G",
      brand: "Realme",
      price: 12999,
      originalPrice: 14999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "45W charging, 120Hz display, MediaTek Dimensity 6100+, 50MP AI primary camera.",
      specs: { Display: "6.72-inch LCD", Processor: "Dimensity 6100+", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Realme C65 5G",
      brand: "Realme",
      price: 10499,
      originalPrice: 12999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "MediaTek Dimensity 6300 (world's first), 120Hz display, IP54 dust and water resistance, slim design.",
      specs: { Display: "6.67-inch LCD", Processor: "Dimensity 6300", RAM: "4GB", Storage: "64GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Realme GT Neo 6 SE",
      brand: "Realme",
      price: 25999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/714Mcgo-BTL._SX679_.jpg",
      description: "Snapdragon 7+ Gen 3 processor, 6000 nits ultra bright screen, 120W fast charging, dual stereo speakers.",
      specs: { Display: "6.78-inch AMOLED", Processor: "Snapdragon 7+ Gen 3", RAM: "8GB", Storage: "256GB", Battery: "5500mAh", Camera: "50MP Sony Dual" }
    },

    // --- MOTOROLA (10 models) ---
    {
      name: "Motorola Edge 50 Pro 5G",
      brand: "Motorola",
      price: 31999,
      originalPrice: 36999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "Intelligence meets art. 144Hz curved display, Snapdragon 7 Gen 3, AI-powered camera with 3x optical telephoto.",
      specs: { Display: "6.7-inch Curved pOLED", Processor: "Snapdragon 7 Gen 3", RAM: "8GB", Storage: "256GB", Battery: "4500mAh", Camera: "50MP Triple" }
    },
    {
      name: "Motorola Edge 50 Ultra 5G",
      brand: "Motorola",
      price: 54999,
      originalPrice: 59999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "Real wood & vegan leather designs, Snapdragon 8s Gen 3, 64MP periscope telephoto lens, 125W TurboPower charging.",
      specs: { Display: "6.7-inch Curved pOLED", Processor: "Snapdragon 8s Gen 3", RAM: "16GB", Storage: "512GB", Battery: "4500mAh", Camera: "50+64MP Triple" }
    },
    {
      name: "Motorola Edge 50 Fusion 5G",
      brand: "Motorola",
      price: 22999,
      originalPrice: 25999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "Snapdragon 7s Gen 2, Sony LYT-700C OIS camera, 144Hz curved display, IP68 water protection.",
      specs: { Display: "6.7-inch Curved pOLED", Processor: "Snapdragon 7s Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Moto G85 5G",
      brand: "Motorola",
      price: 17999,
      originalPrice: 19999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "First G-series with curved display. 3D curved 120Hz pOLED screen, Snapdragon 6s Gen 3, 50MP Sony LYT-600 OIS camera.",
      specs: { Display: "6.67-inch Curved pOLED", Processor: "Snapdragon 6s Gen 3", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Moto G64 5G",
      brand: "Motorola",
      price: 14999,
      originalPrice: 17999,
      image: "https://m.media-amazon.com/images/I/61MvJk1iT+L._SX679_.jpg",
      description: "MediaTek Dimensity 7025 (world's first), massive 6000mAh battery, 50MP OIS camera, 120Hz display.",
      specs: { Display: "6.5-inch LCD", Processor: "Dimensity 7025", RAM: "8GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Moto G34 5G",
      brand: "Motorola",
      price: 10999,
      originalPrice: 12999,
      image: "https://m.media-amazon.com/images/I/61MvJk1iT+L._SX679_.jpg",
      description: "Affordable speed. Snapdragon 695 processor, 120Hz display, vegan leather finish, 50MP camera.",
      specs: { Display: "6.5-inch LCD", Processor: "Snapdragon 695", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Motorola Edge 40 Neo",
      brand: "Motorola",
      price: 20999,
      originalPrice: 27999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "World's lightest IP68 phone. Dimensity 7030, 144Hz curved display, PANTONE curated color designs.",
      specs: { Display: "6.55-inch Curved pOLED", Processor: "Dimensity 7030", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Motorola Razr 40 Ultra",
      brand: "Motorola",
      price: 69999,
      originalPrice: 89999,
      image: "https://m.media-amazon.com/images/I/51r26tWkSUL._SX679_.jpg",
      description: "Foldable flip. Large 3.6-inch external display (144Hz), 6.9-inch main OLED display (165Hz), Snapdragon 8+ Gen 1.",
      specs: { Display: "6.9-inch Foldable pOLED", Processor: "Snapdragon 8+ Gen 1", RAM: "8GB", Storage: "256GB", Battery: "3800mAh", Camera: "12MP Dual" }
    },
    {
      name: "Moto G24 Power",
      brand: "Motorola",
      price: 8999,
      originalPrice: 11999,
      image: "https://m.media-amazon.com/images/I/61MvJk1iT+L._SX679_.jpg",
      description: "Massive 6000mAh battery with 30W TurboPower charger, MediaTek Helio G85, 90Hz display, 50MP camera.",
      specs: { Display: "6.56-inch LCD", Processor: "Helio G85", RAM: "4GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Motorola Edge 50 LITE 5G",
      brand: "Motorola",
      price: 19999,
      originalPrice: 22999,
      image: "https://m.media-amazon.com/images/I/71KdLNkiZtL._SX679_.jpg",
      description: "Qualcomm Snapdragon 6 Gen 1, IP68 water resistance, 68W TurboPower, 120Hz display.",
      specs: { Display: "6.6-inch pOLED", Processor: "Snapdragon 6 Gen 1", RAM: "8GB", Storage: "256GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },

    // --- NOTHING (5 models) ---
    {
      name: "Nothing Phone (2)",
      brand: "Nothing",
      price: 36999,
      originalPrice: 44999,
      image: "https://m.media-amazon.com/images/I/71v4u21hD5L._SX679_.jpg",
      description: "Unique glyph interface back design. Snapdragon 8+ Gen 1, dual 50MP Sony cameras, LTPO OLED 120Hz screen, Nothing OS.",
      specs: { Display: "6.7-inch LTPO OLED", Processor: "Snapdragon 8+ Gen 1", RAM: "12GB", Storage: "256GB", Battery: "4700mAh", Camera: "50MP Dual" }
    },
    {
      name: "Nothing Phone (2a) 5G",
      brand: "Nothing",
      price: 23999,
      originalPrice: 25999,
      image: "https://m.media-amazon.com/images/I/71v4u21hD5L._SX679_.jpg",
      description: "Co-engineered with MediaTek. Dimensity 7200 Pro, dual 50MP cameras, custom Glyph Interface, 120Hz AMOLED.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Dimensity 7200 Pro", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Nothing Phone (1)",
      brand: "Nothing",
      price: 27999,
      originalPrice: 37999,
      image: "https://m.media-amazon.com/images/I/71v4u21hD5L._SX679_.jpg",
      description: "The phone that started the transparent design revolution. Snapdragon 778G+, dual 50MP cameras, glyph lights.",
      specs: { Display: "6.55-inch OLED", Processor: "Snapdragon 778G+", RAM: "8GB", Storage: "128GB", Battery: "4500mAh", Camera: "50MP Dual" }
    },
    {
      name: "CMF Phone 1 5G",
      brand: "Nothing",
      price: 15999,
      originalPrice: 17999,
      image: "https://m.media-amazon.com/images/I/71v4u21hD5L._SX679_.jpg",
      description: "Interchangeable back cover system by CMF by Nothing. MediaTek Dimensity 7300, 120Hz Super AMOLED screen.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 7300", RAM: "6GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Sony" }
    },
    {
      name: "Nothing Phone (2a) Plus",
      brand: "Nothing",
      price: 27999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/71v4u21hD5L._SX679_.jpg",
      description: "Dimensity 7350 Pro (exclusive), 50MP front camera, new metallic texture finish, glyph lights.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Dimensity 7350 Pro", RAM: "8GB", Storage: "256GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },

    // --- VIVO & IQOO (15 models) ---
    {
      name: "Vivo V30 Pro 5G",
      brand: "Vivo",
      price: 41999,
      originalPrice: 46999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Zeiss Co-engineered cameras, Aura light portrait, MediaTek Dimensity 8200, ultra-slim 3D curved display.",
      specs: { Display: "6.78-inch Curved AMOLED", Processor: "Dimensity 8200", RAM: "12GB", Storage: "512GB", Battery: "5000mAh", Camera: "50MP Zeiss Triple" }
    },
    {
      name: "Vivo V30 5G",
      brand: "Vivo",
      price: 33999,
      originalPrice: 37999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Aura Light Portrait, Snapdragon 7 Gen 3, ultra-thin 3D curved display, 80W flash charge.",
      specs: { Display: "6.78-inch Curved AMOLED", Processor: "Snapdragon 7 Gen 3", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Vivo X100 Pro 5G",
      brand: "Vivo",
      price: 89999,
      originalPrice: 96999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Zeiss APO floating telephoto camera, 1-inch main sensor, MediaTek Dimensity 9300, V3 imaging chip.",
      specs: { Display: "6.78-inch Curved AMOLED", Processor: "Dimensity 9300", RAM: "16GB", Storage: "512GB", Battery: "5400mAh", Camera: "50MP Zeiss Triple" }
    },
    {
      name: "Vivo X100 5G",
      brand: "Vivo",
      price: 63999,
      originalPrice: 69999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Zeiss Telephoto camera, MediaTek Dimensity 9300, 120W flash charge, IP68 water resistance.",
      specs: { Display: "6.78-inch Curved AMOLED", Processor: "Dimensity 9300", RAM: "12GB", Storage: "256GB", Battery: "5000mAh", Camera: "50MP Zeiss Triple" }
    },
    {
      name: "Vivo T3 5G",
      brand: "Vivo",
      price: 19999,
      originalPrice: 22999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "MediaTek Dimensity 7200, Sony IMX882 OIS camera, 120Hz AMOLED display, dual stereo speakers.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 7200", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Vivo T3x 5G",
      brand: "Vivo",
      price: 13499,
      originalPrice: 16999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Snapdragon 6 Gen 1, 6000mAh battery with 44W fast charging, 120Hz high brightness display.",
      specs: { Display: "6.72-inch LCD", Processor: "Snapdragon 6 Gen 1", RAM: "4GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Vivo T3 Lite 5G",
      brand: "Vivo",
      price: 10499,
      originalPrice: 12499,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Affordable 5G. MediaTek Dimensity 6300, 50MP Sony AI camera, IP54 dust and water resistance.",
      specs: { Display: "6.56-inch LCD", Processor: "Dimensity 6300", RAM: "4GB", Storage: "64GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Vivo Y200 Pro 5G",
      brand: "Vivo",
      price: 24999,
      originalPrice: 29999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Slimmest 3D curved display in segment, Snapdragon 695 5G, Silk glass design, 64MP OIS camera.",
      specs: { Display: "6.78-inch Curved AMOLED", Processor: "Snapdragon 695", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "64MP Dual" }
    },
    {
      name: "Vivo Y200e 5G",
      brand: "Vivo",
      price: 19999,
      originalPrice: 23999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Eco-leather finish back panel, Snapdragon 4 Gen 2, 120Hz AMOLED, 44W flash charge.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Snapdragon 4 Gen 2", RAM: "6GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Vivo Y58 5G",
      brand: "Vivo",
      price: 18499,
      originalPrice: 21999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Watch dial camera design, 6000mAh battery, Snapdragon 4 Gen 2, 120Hz high brightness screen.",
      specs: { Display: "6.72-inch LCD", Processor: "Snapdragon 4 Gen 2", RAM: "8GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Dual" }
    },
    {
      name: "IQOO 12 5G",
      brand: "IQOO",
      price: 52999,
      originalPrice: 59999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Flagship gaming beast. Snapdragon 8 Gen 3, Q1 independent gaming chip, 50MP periscope telephoto.",
      specs: { Display: "6.78-inch AMOLED 144Hz", Processor: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Battery: "5000mAh", Camera: "50+64MP Triple" }
    },
    {
      name: "IQOO Neo 9 Pro 5G",
      brand: "IQOO",
      price: 34999,
      originalPrice: 39999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Dual-tone leather design, Snapdragon 8 Gen 2, Supercomputing chip Q1, Sony IMX920 OIS camera.",
      specs: { Display: "6.78-inch AMOLED 144Hz", Processor: "Snapdragon 8 Gen 2", RAM: "8GB", Storage: "128GB", Battery: "5160mAh", Camera: "50MP Dual" }
    },
    {
      name: "IQOO Z9 5G",
      brand: "IQOO",
      price: 19999,
      originalPrice: 24999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "MediaTek Dimensity 7200, Sony IMX882 OIS camera, 120Hz AMOLED display, ultra slim design.",
      specs: { Display: "6.67-inch AMOLED", Processor: "Dimensity 7200", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "IQOO Z9x 5G",
      brand: "IQOO",
      price: 12999,
      originalPrice: 15999,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "Snapdragon 6 Gen 1, 6000mAh battery with 44W fast charging, 120Hz high refresh screen.",
      specs: { Display: "6.72-inch LCD", Processor: "Snapdragon 6 Gen 1", RAM: "4GB", Storage: "128GB", Battery: "6000mAh", Camera: "50MP Dual" }
    },
    {
      name: "IQOO Z9 Lite 5G",
      brand: "IQOO",
      price: 9999,
      originalPrice: 12499,
      image: "https://m.media-amazon.com/images/I/71dEc4jD-9L._SX679_.jpg",
      description: "MediaTek Dimensity 6300, 50MP Sony camera, IP54 dust and water resistance, entry-level 5G king.",
      specs: { Display: "6.56-inch LCD", Processor: "Dimensity 6300", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },

    // --- OPPO (10 models) ---
    {
      name: "Oppo Reno 11 Pro 5G",
      brand: "Oppo",
      price: 37999,
      originalPrice: 44999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Portrait Expert. 32MP Telephoto portrait camera, Dimensity 8200 flagship processor, 80W SUPERVOOC.",
      specs: { Display: "6.7-inch Curved AMOLED", Processor: "Dimensity 8200", RAM: "12GB", Storage: "256GB", Battery: "4600mAh", Camera: "50+32MP Triple" }
    },
    {
      name: "Oppo Reno 11 5G",
      brand: "Oppo",
      price: 27999,
      originalPrice: 32999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "32MP Telephoto lens, MediaTek Dimensity 7050, 120Hz curved display, 67W SUPERVOOC charging.",
      specs: { Display: "6.7-inch Curved AMOLED", Processor: "Dimensity 7050", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50+32MP Triple" }
    },
    {
      name: "Oppo Find N3 Flip",
      brand: "Oppo",
      price: 94999,
      originalPrice: 99999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "First flip phone with triple camera. Hasselblad camera system, MediaTek Dimensity 9200, intuitive cover screen.",
      specs: { Display: "6.8-inch Foldable AMOLED", Processor: "Dimensity 9200", RAM: "12GB", Storage: "256GB", Battery: "4300mAh", Camera: "50MP Hasselblad Triple" }
    },
    {
      name: "Oppo F25 Pro 5G",
      brand: "Oppo",
      price: 23999,
      originalPrice: 28999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Border-less 120Hz AMOLED display, MediaTek Dimensity 7050, 64MP triple camera, IP65 waterproof rating.",
      specs: { Display: "6.7-inch AMOLED", Processor: "Dimensity 7050", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "64MP Triple" }
    },
    {
      name: "Oppo F27 Pro+ 5G",
      brand: "Oppo",
      price: 27999,
      originalPrice: 32999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Monsoon proof. IP69/IP68/IP66 super waterproof rating, military-grade shock resistance, 3D curved AMOLED display.",
      specs: { Display: "6.7-inch Curved AMOLED", Processor: "Dimensity 7050", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "64MP Dual" }
    },
    {
      name: "Oppo A79 5G",
      brand: "Oppo",
      price: 15999,
      originalPrice: 19999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Glowing feather design, Dimensity 6020 processor, 50MP AI primary camera, 33W SUPERVOOC charging.",
      specs: { Display: "6.72-inch LCD", Processor: "Dimensity 6020", RAM: "8GB", Storage: "128GB", Battery: "5000mAh", Camera: "50MP Dual" }
    },
    {
      name: "Oppo A59 5G",
      brand: "Oppo",
      price: 13999,
      originalPrice: 17999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Dimensity 6020 processor, 90Hz sunlight display, silk-satin texture back design, 5000mAh battery.",
      specs: { Display: "6.56-inch LCD", Processor: "Dimensity 6020", RAM: "4GB", Storage: "128GB", Battery: "5000mAh", Camera: "13MP Dual" }
    },
    {
      name: "Oppo A3 Pro 5G",
      brand: "Oppo",
      price: 17999,
      originalPrice: 20999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "MediaTek Dimensity 6300, 120Hz display, 5100mAh battery with 45W SUPERVOOC charging, military grade durability.",
      specs: { Display: "6.67-inch LCD", Processor: "Dimensity 6300", RAM: "8GB", Storage: "128GB", Battery: "5100mAh", Camera: "50MP Dual" }
    },
    {
      name: "Oppo A18",
      brand: "Oppo",
      price: 8999,
      originalPrice: 11999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "MediaTek Helio G85, 90Hz sunlight display, 4GB RAM + 64GB storage, 5000mAh long lasting battery.",
      specs: { Display: "6.56-inch LCD", Processor: "Helio G85", RAM: "4GB", Storage: "64GB", Battery: "5000mAh", Camera: "8MP Dual" }
    },
    {
      name: "Oppo Find N3",
      brand: "Oppo",
      price: 129999,
      originalPrice: 139999,
      image: "https://m.media-amazon.com/images/I/81xUu8S5JpL._SX679_.jpg",
      description: "Flagship folding phone, Snapdragon 8 Gen 2, custom Hassleblad cameras, ultra thin fold hinge design.",
      specs: { Display: "7.82-inch Foldable AMOLED", Processor: "Snapdragon 8 Gen 2", RAM: "16GB", Storage: "512GB", Battery: "4805mAh", Camera: "48MP Triple" }
    },
    {
      name: "Apple iPhone 13 Pro",
      brand: "Apple",
      price: 99900,
      originalPrice: 119900,
      image: "https://m.media-amazon.com/images/I/61jLiCov4VL._SX679_.jpg",
      description: "Pro camera system with Telephoto, Wide, and Ultra Wide cameras, LiDAR Scanner, 120Hz ProMotion display.",
      specs: { Display: "6.1-inch OLED", Processor: "A15 Bionic", RAM: "6GB", Storage: "128GB", Battery: "3095mAh", Camera: "12MP Triple" }
    },
    {
      name: "Samsung Galaxy S22 Ultra",
      brand: "Samsung",
      price: 69999,
      originalPrice: 109999,
      image: "https://m.media-amazon.com/images/I/71PvDfQD9dL._SX679_.jpg",
      description: "First Galaxy S with integrated S Pen. 108MP camera, 8K video, Snapdragon 8 Gen 1 processor.",
      specs: { Display: "6.8-inch AMOLED", Processor: "Snapdragon 8 Gen 1", RAM: "12GB", Storage: "256GB", Battery: "5000mAh", Camera: "108MP Quad" }
    }
  ];

  // Smartphones Category ID in mock DB
  const targetCategoryId = "5qyk0nhkpqr2np9pe1rl1x"; 

  console.log("🛠️ Merging new mobile products into local products list...");

  let addedCount = 0;
  for (const model of mobileModels) {
    const slug = model.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Check if product with this slug already exists in mock db products list
    const exists = data.products.some((p: any) => p.slug === slug);
    if (!exists) {
      const discount = Math.round(((model.originalPrice - model.price) / model.originalPrice) * 100);
      const stock = Math.floor(Math.random() * 40) + 15;
      const rating = Number((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1));
      const reviewCount = Math.floor(Math.random() * 300) + 20;

      const newProduct = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: model.name,
        slug: slug,
        description: model.description,
        price: model.price,
        originalPrice: model.originalPrice,
        discount: discount,
        stock: stock,
        brand: model.brand,
        rating: rating,
        reviewCount: reviewCount,
        image: model.image,
        featured: Math.random() > 0.7,
        trending: Math.random() > 0.6,
        specs: model.specs,
        images: [model.image],
        isActive: true,
        categoryId: targetCategoryId
      };

      data.products.push(newProduct);
      addedCount++;
    }
  }

  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Success! Merged ${addedCount} products. Total products in local DB: ${data.products.length}`);
}

main().catch((e) => {
  console.error("❌ Merge failed:", e);
});
