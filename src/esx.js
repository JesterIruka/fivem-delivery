const webhook = require("./webhook");
const { isOnline } = require("../api");
const { sql, insert } = require("./database");
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
    await sql("UPDATE users SET `group`=? WHERE identifier=?", [
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
    while ((await sql("SELECT plate FROM owned_vehicles WHERE plate=?", [plate])).length > 0) {
      plate = this.createPlate();
    }
    let garage = garages[type.toLowerCase()];
    const data = {
      owner: this.steamHex(id),
      state: 1,
      plate,
      vehicle: JSON.stringify(this.createCar(plate, model)),
      vehiclename: "voiture",
      type,
      job: "",
      garage_name: garage,
      state: 0,
      stored: 1
    };
    await insert('owned_vehicles', data);
    return true;
  }

  async removeCar(id, model) {
    if (await isOnline(id)) return false;
    const cars = await sql("SELECT plate,vehicle FROM owner=?", [this.steamHex(id)]);
    for (let row of cars) {
      if (JSON.parse(row.vehicle).model == model) {
        await sql("DELETE FROM owned_vehicles WHERE plate=?", [row.plate]);
      }
    }
    return true;
  }

  async addMoney(id, money) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET money=money+? WHERE identifier=?", [money, this.steamHex(id)]);
    return true;
  }

  async addBank(id, bank) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET bank=bank+? WHERE identifier=?", [bank, this.steamHex(id)]);
    return true;
  }

  async addInventory(id, item, count) {
    if (await isOnline(id)) return false;
    const [row] = await sql(
      "SELECT id FROM user_inventory WHERE identifier=? AND item=? LIMIT 1",
      [this.steamHex(id), item]
    );
    if (row) {
      sql("UPDATE user_inventory SET `count`=`count`+? WHERE id=?", [count, row.id]);
    } else {
      sql("INSERT INTO user_inventory (identifier,item,`count`) VALUES (?,?,?)", 
        [this.steamHex(id), item, count]
      );
    }
    return true;
  }

  steamHex(id) {
    return id.startsWith("steam:") ? id : "steam:" + id;
  }

  createCar(plate, model) {
    if (typeof model != 'number') model = Number(model);
    return {"wheels":0,"modHorns":-1,"dirtLevel":0,"modEngineBlock":-1,"modEngine":-1,"color2":145,model,"extras":{"1":false},"modDoorSpeaker":-1,"modFrontBumper":-1,"wheelColor":0,"fuelLevel":100.0,"neonColor":[255,0,255],"modStruts":-1,"modExhaust":-1,"modTrimB":-1,"modTrimA":-1,"modBackWheels":-1,"modArchCover":-1,"modSmokeEnabled":false,"color1":112,"modSuspension":-1,"modSeats":-1,"modSteeringWheel":-1,"modTurbo":false,"modBrakes":-1,"modLivery":-1,"modDashboard":-1,"modTrunk":-1,"modVanityPlate":-1,"modFrontWheels":-1,"modXenon":false,"modShifterLeavers":-1,"pearlescentColor":0,"modSpoilers":-1,"plateIndex":0,"modRightFender":-1,"modHydrolic":-1,"modRearBumper":-1,"modSideSkirt":-1,"modHood":-1,"modAPlate":-1,"modSpeakers":-1,"modAirFilter":-1,"modPlateHolder":-1,"engineHealth":1000.0,"modAerials":-1,"modRoof":-1,"modDial":-1,"modArmor":-1,"tyreSmokeColor":[255,255,255],"windowTint":-1,plate,"neonEnabled":[false,false,false,false],"modWindows":-1,"modOrnaments":-1,"modTank":-1,"modFrame":-1,"modGrille":-1,"modTransmission":-1,"bodyHealth":1000.0,"modFender":-1};
  }

  createPlate() {
    const l = () => this.randomItemOfArray(this.letters);
    const n = () => this.randomItemOfArray(this.numbers);
    return l() + l() + l() + n() + n() + n() + n();
  }

  randomItemOfArray(array) {
    return array[Math.ceil(Math.random() * (array.length-1))];
  }
}

module.exports = new ESX();
