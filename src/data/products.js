/* OTOMATİK ÜRETİLDİ — scripts/sync-products.mjs, 2026-11-24T11:10:55.072Z.
   Ürünleri yönetici panelinden değiştirin; bu dosya her build'de yeniden yazılır. */
export const products = [
  {
    "id": "suzme",
    "category": "bal",
    "stock": "in",
    "name": {
      "ar": "عسل مصفّى",
      "en": "Strained honey",
      "tr": "Süzme bal"
    },
    "note": {
      "ar": "عسل أزهار مرتفعات بيرواري في برطمان زجاجي.",
      "en": "Pervari highland blossom honey, in a glass jar.",
      "tr": "Pervari yayla çiçek balı, cam kavanozda."
    },
    "variants": [
      {
        "id": "500g",
        "label": "500 g",
        "price": 450
      },
      {
        "id": "1kg",
        "label": "1 kg",
        "price": 850
      }
    ],
    "images": []
  },
  {
    "id": "karakovan",
    "category": "bal",
    "stock": "in",
    "name": {
      "ar": "عسل شمع كاراكوفان",
      "en": "Karakovan comb honey",
      "tr": "Karakovan petek bal"
    },
    "note": {
      "ar": "شمع طبيعي بلا أساس جاهز، يُقطع ويُعبّأ.",
      "en": "Natural comb built without foundation. Cut and boxed.",
      "tr": "Hazır temelsiz, doğal petek. Kesilip kutulanır."
    },
    "variants": [
      {
        "id": "500g",
        "label": "500 g",
        "price": 900
      },
      {
        "id": "1kg",
        "label": "1 kg",
        "price": 1700
      }
    ],
    "images": []
  },
  {
    "id": "cerceve",
    "category": "bal",
    "stock": "in",
    "name": {
      "ar": "عسل شمع بالإطار",
      "en": "Frame comb honey",
      "tr": "Çerçeve petek bal"
    },
    "note": {
      "ar": "قطع أو إطار كامل.",
      "en": "Cut pieces or a whole frame.",
      "tr": "Kesilmiş ya da tam çerçeve olarak."
    },
    "variants": [
      {
        "id": "1kg",
        "label": "1 kg",
        "price": 1100
      },
      {
        "id": "tam",
        "label": {
          "ar": "إطار كامل (~2.5 كغ)",
          "en": "Whole frame (~2.5 kg)",
          "tr": "Tam çerçeve (~2,5 kg)"
        },
        "price": 2600
      }
    ],
    "images": []
  },
  {
    "id": "krem",
    "category": "bal",
    "stock": "in",
    "name": {
      "ar": "عسل كريمي",
      "en": "Creamed honey",
      "tr": "Krem bal"
    },
    "note": {
      "ar": "قوام سميك يُقطع بالملعقة وسهل الدهن.",
      "en": "Thick enough to cut with a spoon, easy to spread.",
      "tr": "Kaşıkla kesilen kıvamda, sürülebilir."
    },
    "variants": [
      {
        "id": "250g",
        "label": "250 g",
        "price": 300
      },
      {
        "id": "500g",
        "label": "500 g",
        "price": 550
      }
    ],
    "images": []
  },
  {
    "id": "polen",
    "category": "bal",
    "stock": "in",
    "name": {
      "ar": "حبوب اللقاح",
      "en": "Bee pollen",
      "tr": "Polen"
    },
    "note": {
      "ar": "حبوب لقاح مجففة.",
      "en": "Dried bee pollen.",
      "tr": "Kurutulmuş arı poleni."
    },
    "variants": [
      {
        "id": "250g",
        "label": "250 g",
        "price": 350
      }
    ],
    "images": []
  },
  {
    "id": "tahin",
    "category": "kahvalti",
    "stock": "in",
    "name": {
      "ar": "طحينة",
      "en": "Tahini",
      "tr": "Tahin"
    },
    "note": {
      "ar": "تُخلط مع العسل أو الدبس للفطور.",
      "en": "Mix with honey or molasses for breakfast.",
      "tr": "Balla ya da pekmezle karıştırıp kahvaltıda."
    },
    "variants": [
      {
        "id": "300g",
        "label": "300 g",
        "price": 180
      },
      {
        "id": "600g",
        "label": "600 g",
        "price": 320
      }
    ],
    "images": []
  },
  {
    "id": "pekmez",
    "category": "kahvalti",
    "stock": "in",
    "name": {
      "ar": "دبس العنب",
      "en": "Grape molasses",
      "tr": "Pekmez"
    },
    "note": {
      "ar": "في برطمان زجاجي.",
      "en": "In a glass jar.",
      "tr": "Cam kavanozda."
    },
    "variants": [
      {
        "id": "700g",
        "label": "700 g",
        "price": 220
      }
    ],
    "images": []
  },
  {
    "id": "fistik",
    "category": "kahvalti",
    "stock": "in",
    "name": {
      "ar": "فستق عنتاب",
      "en": "Antep pistachios",
      "tr": "Antep fıstığı"
    },
    "note": {
      "ar": "بقشره، محمّص.",
      "en": "In shell, roasted.",
      "tr": "Kabuklu, kavrulmuş."
    },
    "variants": [
      {
        "id": "500g",
        "label": "500 g",
        "price": 650
      },
      {
        "id": "1kg",
        "label": "1 kg",
        "price": 1250
      }
    ],
    "images": []
  },
  {
    "id": "kutu-kahvalti",
    "category": "kutu",
    "stock": "in",
    "name": {
      "ar": "علبة الفطور",
      "en": "Breakfast box",
      "tr": "Kahvaltı kutusu"
    },
    "note": {
      "ar": "عسل مصفّى 500 غ، طحينة 300 غ، دبس 700 غ، فستق عنتاب 500 غ.",
      "en": "Strained honey 500 g, tahini 300 g, grape molasses 700 g, Antep pistachios 500 g.",
      "tr": "Süzme bal 500 g, tahin 300 g, pekmez 700 g, Antep fıstığı 500 g."
    },
    "variants": [
      {
        "id": "kutu",
        "label": {
          "ar": "علبة",
          "en": "Box",
          "tr": "Kutu"
        },
        "price": 1400
      }
    ],
    "images": []
  },
  {
    "id": "kutu-karakovan",
    "category": "kutu",
    "stock": "in",
    "name": {
      "ar": "علبة هدية كاراكوفان",
      "en": "Karakovan gift box",
      "tr": "Karakovan hediye kutusu"
    },
    "note": {
      "ar": "شمع كاراكوفان 1 كغ وعسل كريمي 250 غ في علبة خشبية.",
      "en": "Karakovan comb 1 kg and creamed honey 250 g in a wooden box.",
      "tr": "Karakovan petek 1 kg ve krem bal 250 g, ahşap kutuda."
    },
    "variants": [
      {
        "id": "kutu",
        "label": {
          "ar": "علبة",
          "en": "Box",
          "tr": "Kutu"
        },
        "price": 1900
      }
    ],
    "images": []
  },
  {
    "id": "kutu-bayram",
    "category": "kutu",
    "stock": "in",
    "name": {
      "ar": "علبة العيد",
      "en": "Holiday box",
      "tr": "Bayram kutusu"
    },
    "note": {
      "ar": "عسل كريمي 250 غ، عسل مصفّى 500 غ وفستق عنتاب 500 غ. للأعياد والأعراس.",
      "en": "Creamed honey 250 g, strained honey 500 g and Antep pistachios 500 g. For holidays and weddings.",
      "tr": "Krem bal 250 g, süzme bal 500 g ve Antep fıstığı 500 g. Bayram ve düğün ikramı için."
    },
    "variants": [
      {
        "id": "kutu",
        "label": {
          "ar": "علبة",
          "en": "Box",
          "tr": "Kutu"
        },
        "price": 1350
      }
    ],
    "images": []
  }
]
