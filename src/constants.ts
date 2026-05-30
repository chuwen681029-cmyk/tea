/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  // Category 1: 和風茶
  {
    id: "hachiyo_wacha",
    name: "八曜和茶",
    description: "穀麥配方，炒香蕎麥與豐富大麥揉和，甘醇滑順，極致招牌",
    price: 35,
    category: "和風茶",
    stock: 50,
    isAvailable: true,
    sugar: "40g",
    caffeine: "無",
    calories: 177,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "wacha_308",
    name: "和風308",
    description: "焙煎蕎麥與極上穀麥完美調和，清爽解渴，散發迷人焙麥香氣",
    price: 50,
    category: "和風茶",
    stock: 40,
    isAvailable: true,
    sugar: "40g",
    caffeine: "無",
    calories: 177,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "hachi_three_honey",
    name: "83蜂凝露",
    description: "嚴選百分之百純淨蜂蜜，穀麥風味底蘊，甜而不膩，芳潤清香",
    price: 55,
    category: "和風茶",
    stock: 15,
    isAvailable: true,
    sugar: "51g",
    caffeine: "無",
    calories: 240,
    tempOption: "固定冰",
    imageUrl: "https://images.unsplash.com/photo-1627754381711-20921822453c?auto=format&fit=crop&w=400&q=80"
  },

  // Category 2: 和風日式複方茶
  {
    id: "wacha_307",
    name: "和風307",
    description: "獨家307輕焙烏龍+極上穀麥方，雙重茶蘊和諧共鳴，茶韻甘澄",
    price: 50,
    category: "和風日式複方茶",
    stock: 30,
    isAvailable: true,
    sugar: "40g",
    caffeine: "中",
    calories: 170,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "ultimate_308",
    name: "究極308",
    description: "焙煎蕎麥與獨家307輕焙烏龍揉合。追求極致零負擔，無糖健康首選",
    price: 42,
    category: "和風日式複方茶",
    stock: 25,
    isAvailable: true,
    sugar: "無",
    caffeine: "低",
    calories: 5,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f41ccb56574?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "sunrise_awake_red",
    name: "朝日覺醒紅茶",
    description: "經典覺醒深焙紅茶與滋養穀麥揉和，甘醇生津，提神甦醒的極致風味",
    price: 40,
    category: "和風日式複方茶",
    stock: 35,
    isAvailable: true,
    sugar: "48g",
    caffeine: "中",
    calories: 210,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "hachi_three_honey_tea",
    name: "83蜂見茶",
    description: "嚴選天然蜂蜜搭配醇香紅茶與香濃307複方茶，雙重甜蜜茶香激盪",
    price: 60,
    category: "和風日式複方茶",
    stock: 20,
    isAvailable: true,
    sugar: "51g",
    caffeine: "低",
    calories: 240,
    tempOption: "固定冰",
    imageUrl: "https://images.unsplash.com/photo-1571934811356-7cccac2ade8f?auto=format&fit=crop&w=400&q=80"
  },

  // Category 3: 厚奶茶
  {
    id: "awake_milk_tea",
    name: "覺醒奶茶 (紅)",
    description: "茶韻獨特的深焙紅茶底搭配特調厚奶乳，層次飽滿，香濃醇厚",
    price: 55,
    category: "厚奶茶",
    stock: 40,
    isAvailable: true,
    sugar: "67g",
    caffeine: "中",
    calories: 688,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "artisan_milk_tea",
    name: "匠心奶茶 (烏)",
    description: "黃金比例焙火烏龍底搭配渾厚奶香，炭焙喉韻幽長，匠心特製",
    price: 60,
    category: "厚奶茶",
    stock: 5, // Low stock for test triggering
    isAvailable: true,
    sugar: "67g",
    caffeine: "中",
    calories: 688,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "deep_black_dragon",
    name: "深煎黑龍奶茶 (烏)",
    description: "精挑黑烏龍深焙工法，茶感深沉濃郁，奶香點綴得天衣無縫",
    price: 55,
    category: "厚奶茶",
    stock: 12,
    isAvailable: true,
    sugar: "67g",
    caffeine: "中",
    calories: 688,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "kyoto_dancer",
    name: "京彩舞伎奶茶 (紅)",
    description: "日本舞伎風雅，頂級覺醒紅茶底與獨家焙乳黃金比例，風味絲滑漫步舌尖",
    price: 66,
    category: "厚奶茶",
    stock: 18,
    isAvailable: true,
    sugar: "67g",
    caffeine: "中",
    calories: 688,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1521500857782-beec241270bc?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "winter_love_milk",
    name: "冬戀奶茶 (穀)",
    description: "無咖啡因。燕麥穀物醇香與極品特調厚奶底相融合，溫暖療癒，老少皆宜",
    price: 66,
    category: "厚奶茶",
    stock: 22,
    isAvailable: true,
    sugar: "52g",
    caffeine: "無",
    calories: 608,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "roasted_308_milk",
    name: "308炙燒濃乳 (蕎)",
    description: "無咖啡因。穀麥焙煎香氣在炙燒工藝下完美發散，入口極化，香氣撲鼻",
    price: 66,
    category: "厚奶茶",
    stock: 0, // Out of stock initially for testing sold-out UI
    isAvailable: true,
    sugar: "52g",
    caffeine: "無",
    calories: 608,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "hachi_three_honey_milk",
    name: "83蜂潮奶茶",
    description: "無咖啡因。純蜂蜜香滑入溫熱/沁涼的厚焙乳中，頂級甜香與奶香的和諧",
    price: 69,
    category: "厚奶茶",
    stock: 15,
    isAvailable: true,
    sugar: "42g",
    caffeine: "無",
    calories: 429,
    tempOption: "固定冰",
    imageUrl: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "snow_artisan_milk",
    name: "雪匠奶茶 (鮮)",
    description: "無咖啡因。香濃香草冰淇淋浮沈於香濃厚奶中，極致奢華。最低一度糖",
    price: 69,
    category: "厚奶茶",
    stock: 8,
    isAvailable: true,
    sugar: "53g",
    caffeine: "無",
    calories: 509,
    tempOption: "固定冰",
    imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "roasted_thick_milk_504",
    name: "浪烤厚焙乳504",
    description: "重火浪烤焙乳工藝，奶香焦糖香滿溢，醇度極高，厚實而餘味不絕",
    price: 89,
    category: "厚奶茶",
    stock: 10,
    isAvailable: true,
    sugar: "64g",
    caffeine: "中",
    calories: 749,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80"
  }
];

export const SWEETNESS_OPTIONS = ["無糖", "二分糖", "微糖", "半糖", "少糖", "正常糖"];
export const ICE_OPTIONS = ["去冰", "微冰", "少冰", "正常冰", "常溫", "熱"];
export const DELIVERY_METHODS = ["內用", "外帶"] as const;
