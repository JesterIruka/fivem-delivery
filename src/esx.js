const webhook = require("./webhook");
const { isOnline } = require("../api");
const { sql } = require("./database");
const { after } = require("./scheduler");

const garages = {
  car: "Garage_Centre",
  boat: "BoatGarage_Centre",
  helicopter: "AirplaneGarage_Centre",
  airplane: "AirplaneGarage_Centre",
};

class ESX {
  letters = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
  numbers = "0123456789".split("");

  async setTemporaryGroup(days, id, group) {
    if (await isOnline(id)) return false;
    after(days, `esx.setGroup("${id}", "user")`);
    await this.setGroup(id, group);
    return true;
  }

  async setGroup(id, group) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET group=? WHERE identifier=?", [
      group,
      this.steamHex(id),
    ]);
    return true;
  }

  async addTemporaryHouse(days, id, name) {
    after(days, `esx.removeHouse("${id}", "${name}")`);
    await this.addHouse(id, name);
  }

  async addHouse(id, name) {
    if (await isOnline(id)) return false;
    if (
      (
        await sql("SELECT id FROM owned_properties WHERE name=? AND owner=?", [
          name,
          this.steamHex(id),
        ])
      ).length > 0
    ) {
      webhook.debug(this.steamHex(id) + " já possui a casa" + name);
    } else {
      await sql(
        "INSERT INTO owned_properties (name,price,rented,owner) VALUES (?,?,?,?)",
        [name, 0, 0, this.steamHex(id)]
      );
    }
    return true;
  }

  async removeHouse(id, name) {
    if (await isOnline(id)) return false;
    await sql("DELETE FROM owned_properties WHERE name=? AND owner=?", [
      name,
      this.steamHex(id),
    ]);
    return true;
  }

  async addTemporaryCar(days, id, model, type = "car") {
    after(days, `esx.removeCar("${id}", "${model}")`);
    await this.addCar(id, model, type);
  }

  async addCar(id, model, type = "car") {
    if (await isOnline(id)) return false;
    let plate = this.createPlate();
    while (
      (await sql("SELECT plate FROM owned_vehicles WHERE plate=?", [plate]))
        .length > 0
    ) {
      plate = this.createPlate();
    }
    let garage = garages[type.toLowerCase()];
    const values = [
      this.steamHex(id),
      1,
      plate,
      JSON.stringify(this.createCar(plate, model)),
      "voiture",
      type,
      "",
      0,
      garage,
    ];
    const keys = [
      "owner",
      "state",
      "plate",
      "vehicle",
      "vehicle_name",
      "type",
      "job",
      "price",
      "garage_name",
    ];
    await sql(
      `INSERT INTO owned_vehicles (${keys.join(",")}) VALUES (${values
        .map((v) => "?")
        .join(",")})`,
      values
    );
    return true;
  }

  async removeCar(id, model) {
    if (await isOnline(id)) return false;
    const cars = await sql("SELECT plate,vehicle FROM owner=?", [
      this.steamHex(id),
    ]);
    for (let row of cars) {
      if (JSON.stringify(row.vehicle).model == model) {
        await sql("DELETE FROM owned_vehicles WHERE plate=?", [row.plate]);
      }
    }
    return true;
  }

  async addMoney(id, money) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET money=money+? WHERE identifier=?", [
      money,
      this.steamHex(id),
    ]);
    return true;
  }

  async addBank(id, bank) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET bank=bank+? WHERE identifier=?", [
      bank,
      this.steamHex(id),
    ]);
    return true;
  }

  async addInventory(id, item, count) {
    if (await isOnline(id)) return false;
    const [
      row,
    ] = await sql(
      "SELECT id FROM user_inventory WHERE identifier=? AND item=? LIMIT 1",
      [this.steamHex(id), item]
    );
    if (row) {
      sql("UPDATE user_inventory SET count=count+? WHERE id=?", [
        count,
        row.id,
      ]);
    } else {
      sql("INSERT INTO user_inventory (identifier,item,count) VALUES (?,?,?)", [
        this.steamHex(id),
        item,
        count,
      ]);
    }
    return true;
  }

  steamHex(id) {
    return id.startsWith("steam:") ? id : "steam:" + id;
  }

  createCar(plate, model) {
    return {
      modTrunk: -1,
      plate,
      modVanityPlate: -1,
      modBackWheels: -1,
      modOrnaments: -1,
      modSteeringWheel: -1,
      plateIndex: 3,
      modTurbo: false,
      modTrimB: -1,
      health: 1000,
      modArmor: -1,
      modRearBumper: -1,
      modFrame: -1,
      modWindows: -1,
      modTrimA: -1,
      modAirFilter: -1,
      neonColor: [255, 0, 255],
      modSpeakers: -1,
      modRoof: -1,
      modStruts: -1,
      modSpoilers: -1,
      wheelColor: 156,
      wheels: 0,
      modSuspension: -1,
      modTank: -1,
      modAPlate: -1,
      modHorns: -1,
      modFender: -1,
      modSeats: -1,
      pearlescentColor: 5,
      modEngine: -1,
      modFrontWheels: -1,
      dirtLevel: 6.0,
      modArchCover: -1,
      neonEnabled: [false, false, false, false],
      modDial: -1,
      modHydrolic: -1,
      modExhaust: -1,
      modGrille: -1,
      modShifterLeavers: -1,
      modFrontBumper: -1,
      windowTint: -1,
      modDoorSpeaker: -1,
      modRightFender: -1,
      model,
      color2: 1,
      modDashboard: -1,
      tyreSmokeColor: [255, 255, 255],
      modSideSkirt: -1,
      modLivery: -1,
      extras: [],
      modXenon: false,
      modEngineBlock: -1,
      color1: 1,
      modHood: -1,
      modBrakes: -1,
      modSmokeEnabled: false,
      modTransmission: -1,
      modAerials: -1,
      modPlateHolder: -1,
    };
  }

  createPlate() {
    const l = () =>
      this.letters[
        Math.min(
          this.letters.length,
          Math.round(Math.random() * this.letters.length)
        )
      ];
    const n = () =>
      this.numbers[
        Math.min(
          this.numbers.length,
          Math.round(Math.random() * this.numbers.length)
        )
      ];
    return l() + l() + l() + n() + n() + n() + n();
  }
}

module.exports = new ESX();
