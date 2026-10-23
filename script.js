"use strict";

class Parcel {
  #weight;
  static #count = 0;

  constructor(recipient, weight, length, width, height) {
    if (typeof recipient !== "string" || !recipient.trim()) {
      throw new TypeError("Потрібно вказати одержувача.");
    }
    for (const dimension of [length, width, height]) {
      if (typeof dimension !== "number" || !Number.isFinite(dimension) || dimension <= 0) {
        throw new TypeError("Розміри посилки мають бути додатними скінченними числами.");
      }
    }
    this.recipient = recipient.trim();
    this.length = length;
    this.width = width;
    this.height = height;
    // Ініціалізація теж проходить через перевірку в сеттері.
    this.weight = weight;
    // Рахуємо лише успішно створені відправлення.
    Parcel.#count++;
  }

  get weight() {
    return this.#weight;
  }

  set weight(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new TypeError("Вага посилки має бути додатним скінченним числом.");
    }
    this.#weight = value;
  }

  get volumetricWeight() {
    return this.length * this.width * this.height / 5000;
  }

  get chargeableWeight() {
    return Math.max(this.weight, this.volumetricWeight);
  }

  describe() {
    return "Одержувач: " + this.recipient + "; вага: " + this.weight + " кг; розміри: "
      + this.length + " × " + this.width + " × " + this.height + " см; розрахункова вага: "
      + this.chargeableWeight + " кг";
  }

  static getCount() {
    return Parcel.#count;
  }
}

class ParcelPriceCalculator {
  constructor(ratePerKg) {
    if (typeof ratePerKg !== "number" || !Number.isFinite(ratePerKg) || ratePerKg <= 0) {
      throw new TypeError("Тариф має бути додатним скінченним числом.");
    }
    this.ratePerKg = ratePerKg;
  }

  calculate(parcel) {
    return parcel.chargeableWeight * this.ratePerKg;
  }

  getName() {
    return "Базовий тариф";
  }
}

class PostOfficeParcelPriceCalculator extends ParcelPriceCalculator {
  constructor() {
    super(15);
  }

  getName() {
    return "Відділення пошти";
  }
}

class CourierParcelPriceCalculator extends ParcelPriceCalculator {
  constructor() {
    super(30);
  }

  getName() {
    return "Кур’єрська доставка";
  }
}

class ExpressParcelPriceCalculator extends ParcelPriceCalculator {
  constructor() {
    // Саме 30 + 25 грн/кг, як зазначено у практичному завданні.
    super(30);
    this.expressRatePerKg = 25;
  }

  calculate(parcel) {
    return super.calculate(parcel) + parcel.chargeableWeight * this.expressRatePerKg;
  }

  getName() {
    return "Експрес-доставка";
  }
}

// Вигадані навчальні приклади: фактична вага більша, об’ємна більша та рівні ваги.
const parcels = [
  new Parcel("Олена Коваль", 5, 20, 10, 10),
  new Parcel("Іван Петренко", 2.5, 40, 30, 20),
  new Parcel("Марія Бондар", 1, 20, 25, 10)
];
const calculators = [
  new PostOfficeParcelPriceCalculator(),
  new CourierParcelPriceCalculator(),
  new ExpressParcelPriceCalculator()
];

// Поліморфізм: однаковий виклик calculate() для кожного нащадка без перевірок типу.
for (const parcel of parcels) {
  console.log(parcel.describe());
  for (const calculator of calculators) {
    console.log(calculator.getName() + ": " + calculator.calculate(parcel) + " грн");
  }
}
console.log("Кількість створених відправлень:", Parcel.getCount());

let validationMessage;
try {
  parcels[0].weight = -1;
} catch (error) {
  validationMessage = "Від’ємну вагу відхилено: " + error.message + " Попередня вага залишилася " + parcels[0].weight + " кг.";
  console.log("Перевірка інкапсуляції:", validationMessage);
}

// Результати тих самих об’єктів відображаються і на сторінці.
// Умова дозволяє також виконати файл командою node script.js без DOM.
if (typeof document !== "undefined") {
  const tableBody = document.getElementById("parcel-results");
  for (const parcel of parcels) {
    const row = document.createElement("tr");
    const values = [
      parcel.recipient,
      parcel.length + " × " + parcel.width + " × " + parcel.height,
      parcel.weight, parcel.volumetricWeight, parcel.chargeableWeight
    ];
    for (const calculator of calculators) values.push(calculator.calculate(parcel).toFixed(2));
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.appendChild(cell);
    }
    tableBody.appendChild(row);
  }
  document.getElementById("parcel-count").textContent = String(Parcel.getCount());
  document.getElementById("validation-result").textContent = validationMessage;
}
