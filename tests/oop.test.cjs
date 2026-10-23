const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

function loadProgram() {
  const logs = [];
  const context = vm.createContext({ console: { log: (...args) => logs.push(args) } });
  vm.runInContext(source, context);
  return {
    context, logs,
    Parcel: vm.runInContext("Parcel", context),
    PostOffice: vm.runInContext("PostOfficeParcelPriceCalculator", context),
    Courier: vm.runInContext("CourierParcelPriceCalculator", context),
    Express: vm.runInContext("ExpressParcelPriceCalculator", context)
  };
}

test("приклади охоплюють фактичну, об’ємну та однакову ваги; лічильник дорівнює 3", () => {
  const { context, Parcel, logs } = loadProgram();
  assert.equal(Parcel.getCount(), 3);
  const parcels = vm.runInContext("parcels", context);
  assert.ok(parcels[0].weight > parcels[0].volumetricWeight);
  assert.ok(parcels[1].weight < parcels[1].volumetricWeight);
  assert.equal(parcels[2].weight, parcels[2].volumetricWeight);
  assert.ok(logs.some(args => args[0] === "Кількість створених відправлень:" && args[1] === 3));
});

test("сеттер відхиляє некоректну вагу, зберігає стан і не збільшує лічильник невдалих об’єктів", () => {
  const { Parcel } = loadProgram();
  const parcel = new Parcel("Навчальний одержувач", 2, 10, 10, 10);
  const count = Parcel.getCount();
  for (const invalid of [-1, 0, "2", null, NaN, Infinity, -Infinity]) {
    assert.throws(() => { parcel.weight = invalid; }, /Вага посилки/);
    assert.equal(parcel.weight, 2);
    assert.throws(() => new Parcel("Навчальний одержувач", invalid, 10, 10, 10), /Вага посилки/);
    assert.equal(Parcel.getCount(), count);
  }
  parcel.weight = 7;
  assert.equal(parcel.weight, 7);
  assert.equal(parcel.chargeableWeight, 7);
});

test("поліморфні калькулятори застосовують 15, 30 та 30 + 25 грн/кг", () => {
  const { Parcel, PostOffice, Courier, Express } = loadProgram();
  const calculators = [new PostOffice(), new Courier(), new Express()];
  const compact = new Parcel("Компактна посилка", 5, 20, 10, 10);
  const large = new Parcel("Об’ємна посилка", 2.5, 40, 30, 20);
  assert.equal(large.volumetricWeight, 4.8);
  assert.equal(large.chargeableWeight, 4.8);
  assert.deepEqual(calculators.map(calculator => calculator.calculate(compact)), [75, 150, 275]);
  assert.deepEqual(calculators.map(calculator => calculator.calculate(large)), [72, 144, 264]);
  large.length = 50;
  assert.equal(large.volumetricWeight, 6);
  assert.equal(large.chargeableWeight, 6);
});

test("приватне поле недоступне зовні, а похідні геттери доступні лише для читання", () => {
  const { context } = loadProgram();
  assert.throws(() => vm.runInContext("parcels[0].#weight", context), error => error.name === "SyntaxError");
  assert.throws(() => vm.runInContext('"use strict"; parcels[0].volumetricWeight = 100;', context), error => error.name === "TypeError");
});
