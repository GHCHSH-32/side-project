// Wikimedia Commons에서 받은 메뉴 사진의 출처와 라이선스다. 사진 파일은 public/foods에 있다.
// 사진을 추가하거나 바꾸면 이 목록도 함께 고친다.
export type PhotoCredit = {
  artist: string;
  license: string;
  licenseUrl: string;
  /** Wikimedia Commons의 파일 페이지 */
  page: string;
};

const CREDITS: Record<string, PhotoCredit> = {
  "baby-cheese": {
    artist: "CNEcija12345",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:White_cheddar_cheese_sliced_CNE.jpg",
  },
  "baked-salmon": {
    artist: "HaJunkiyada",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Oven-baked_teriyaki_salmon_with_vegetables.jpg",
  },
  "beef-meatball": {
    artist: "anokarina",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Gogi-wanja-jorim.jpg",
  },
  "beef-seaweed-porridge": {
    artist: "Wolfgang Ihloff",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Juk.jpg",
  },
  "beef-seaweed-soup": {
    artist: "Jaydub666",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Miyeok_Guk.jpg",
  },
  "beef-veggie-porridge": {
    artist: "Mar del Este",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Korean_rice_porridge_Vegetable_juk.jpg",
  },
  "beef-veggie-stirfry": {
    artist: "jules",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Ginger_beef_stir_fry.jpg",
  },
  "boiled-egg": {
    artist: "HungryHuy",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Hard_boiled_eggs_for_thit_heo_kho,_peeled.jpg",
  },
  "boiled-sweet-potato": {
    artist: "Taman Renyah",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Steamed_sweet_potato.jpg",
  },
  "broccoli-tofu": {
    artist: "Miscellaneous contributor",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Tofu_and_Broccoli_1.jpg",
  },
  "carrot-potato": {
    artist: "pelican from Tokyo, Japan",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Spicy_stir-fried_potato_and_carrot_(4105702396).jpg",
  },
  "chicken-rice-bowl": {
    artist: "Ocdp",
    license: "CC0",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    page: "https://commons.wikimedia.org/wiki/File:Oyakodon_003.jpg",
  },
  "chicken-veggie-soup": {
    artist: "Cajsa Lilliehook from Portland",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Chicken_Vegetable_Soup_(8731954951).jpg",
  },
  "chicken-veggie-stirfry": {
    artist: "Ginny",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Ginger_chicken_(3168342551).jpg",
  },
  "egg-fried-rice": {
    artist: "Gaurav Dhwaj Khadka",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Egg_Fried_Rice.jpg",
  },
  "egg-veggie-soup": {
    artist: "Unknown",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Egg_drop_soup.jpg",
  },
  "kiwi": {
    artist: "Luc Viatour",
    license: "CC BY-SA 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5",
    page: "https://commons.wikimedia.org/wiki/File:Kiwi_(Actinidia_chinensis)_1_Luc_Viatour.jpg",
  },
  "mashed-pumpkin": {
    artist: "방신애",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Danhobak_salad_(kabocha_squash_salad).jpg",
  },
  "milk": {
    artist: "NIAID",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Glass_of_Milk_(33657535532).jpg",
  },
  "mini-janchi-noodles": {
    artist: "Chloe Lim",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Janchi-guksu.jpg",
  },
  "pan-tofu": {
    artist: "정희 강",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Korean_cuisine-Dubu_buchim-01.jpg",
  },
  "pork-veggie-stirfry": {
    artist: "NeoBatfreak",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Stir-fried_spinach_and_ground_pork(1).jpg",
  },
  "potato-onion-soup": {
    artist: "ProjectManhattan",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Potato_and_onion_soup.jpg",
  },
  "roasted-pumpkin": {
    artist: "Namayasai LLP",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Kabocha_Roasted_29September2005.jpg",
  },
  "salmon-rice-ball": {
    artist: "yomi955",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Salmon_onigiri_by_yomi955.jpg",
  },
  "shrimp-zucchini-jeon": {
    artist: "hyun chun kim",
    license: "CC0",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    page: "https://commons.wikimedia.org/wiki/File:Hobak-jeon.jpg",
  },
  "soy-milk": {
    artist: "LinasD",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Soy_milk.jpg",
  },
  "spinach-egg": {
    artist: "David Pursehouse from Kawasaki, Japan",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Spinach_omelette_(3278835124).jpg",
  },
  "spinach-namul": {
    artist: "Hyeon-Jeong Suk",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Sigeumchi-namul_2.jpg",
  },
  "steamed-egg": {
    artist: "stu_spivack",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Gyeran-jjim.jpg",
  },
  "tofu-scramble": {
    artist: "Bart Everson",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    page: "https://commons.wikimedia.org/wiki/File:Tofu_Scramble_in_New_Orleans.jpg",
  },
  "tomato-egg-soup": {
    artist: "NNU-10-HanRongrong",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0",
    page: "https://commons.wikimedia.org/wiki/File:Tomato_and_egg_soup.jpg",
  },
  "white-fish": {
    artist: "Tiia Monto",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Baked_cod_fillet.jpg",
  },
  "yogurt-banana": {
    artist: "Daderot",
    license: "CC0",
    licenseUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    page: "https://commons.wikimedia.org/wiki/File:Yogurt_with_raisins_and_banana_-_Massachusetts.jpg",
  },
};

/** 사진이 있는 메뉴의 출처. 사진이 없으면 undefined. */
export function photoCredit(foodId: string) {
  return CREDITS[foodId];
}
