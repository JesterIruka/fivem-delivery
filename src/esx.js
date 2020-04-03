const webhook = require('./webhook');
const { isOnline } = require('../api');
const { sql } = require('./database');

class ESX {

  letters = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
  numbers = '0123456789'.split('');

  async setGroup(id, group) {
    if (await isOnline(id)) return false;
    await sql("UPDATE users SET group=? WHERE identifier=?", [group, steamHex(id)]);
    return true;
  }

  async addTemporaryHouse(days, id, name) {
    after(days, `esx.removeHouse("${id}", "${name}")`);
    await this.addHouse(id, name);
  }

  async addHouse(id, name) {
    if (await isOnline(id)) return false;
    if ((await sql("SELECT id FROM owned_properties WHERE name=? AND owner=?", [name, steamHex(id)])).length > 0) {
      webhook.debug(steamHex(id)+' já possui a casa'+name);
    } else {
      await sql("INSERT INTO owned_properties (name,price,rented,owner) VALUES (?,?,?,?)", [name, 0, 0, steamHex(id)]);
    }
    return true;
  }

  async removeHouse(id, name) {
    if (await isOnline(id)) return false;
    await sql("DELETE FROM owned_properties WHERE name=? AND owner=?", [name, steamHex(id)]);
    return true;
  }

  async addTemporaryCar(days, id, model, type='car') {
    after(days, `esx.removeCar("${id}", "${model}")`)
    await this.addCar(id, model, type);
  }

  async addCar(id, model, type='car') {
    if (await isOnline(id)) return false;
    let plate = createPlate();
    while ((await sql("SELECT id FROM owned_vehicles WHERE plate=?", [plate])).length > 0) {
      plate = createPlate();
    }
    const values = [steamHex(id), 1, plate, createCar(plate, model), type, '', 0];
    await sql("INSERT INTO owned_vehicles (owner,state,plate,vehicle,type,job,price) VALUES (?,?,?,?,?,?,?)", values);
    return true;
  }

  async removeCar(id, model) {
    if (await app.isOnline(id)) return false;
    const cars = await sql("SELECT plate,vehicle FROM owner=?", [steamHex(id)]);
    for (let row of cars) {
      if (JSON.stringify(row.vehicle).model == model) {
        await sql("DELETE FROM owned_vehicles WHERE plate=?", [row.plate]);
      }
    }
    return true;
  }

  async addMoney(id, money) {
    if (await app.isOnline(id)) return false;
    await sql("UPDATE users SET money=money+? WHERE identifier=?", [money,steamHex(id)]);
    return true;
  }

  async addBank(id, bank) {
    if (await app.isOnline(id)) return false;
    await sql("UPDATE users SET bank=bank+? WHERE identifier=?", [bank,steamHex(id)]);
    return true;
  }

  steamHex(id) {
    return id.startsWith("steam:")?id:"steam:"+id;
  }

  createCar(plate, model) {
    return {"modTrunk":-1,plate,"modVanityPlate":-1,"modBackWheels":-1,"modOrnaments":-1,"modSteeringWheel":-1,"plateIndex":3,"modTurbo":false,"modTrimB":-1,"health":1000,"modArmor":-1,"modRearBumper":-1,"modFrame":-1,"modWindows":-1,"modTrimA":-1,"modAirFilter":-1,"neonColor":[255,0,255],"modSpeakers":-1,"modRoof":-1,"modStruts":-1,"modSpoilers":-1,"wheelColor":156,"wheels":0,"modSuspension":-1,"modTank":-1,"modAPlate":-1,"modHorns":-1,"modFender":-1,"modSeats":-1,"pearlescentColor":5,"modEngine":-1,"modFrontWheels":-1,"dirtLevel":6.0,"modArchCover":-1,"neonEnabled":[false,false,false,false],"modDial":-1,"modHydrolic":-1,"modExhaust":-1,"modGrille":-1,"modShifterLeavers":-1,"modFrontBumper":-1,"windowTint":-1,"modDoorSpeaker":-1,"modRightFender":-1,model,"color2":1,"modDashboard":-1,"tyreSmokeColor":[255,255,255],"modSideSkirt":-1,"modLivery":-1,"extras":[],"modXenon":false,"modEngineBlock":-1,"color1":1,"modHood":-1,"modBrakes":-1,"modSmokeEnabled":false,"modTransmission":-1,"modAerials":-1,"modPlateHolder":-1}
  }

  createPlate() {
    const l = () => this.letters[Math.min(this.letters.length, Math.round(Math.random()*this.letters.length))];
    const n = () => this.numbers[Math.min(this.numbers.length, Math.round(Math.random()*this.numbers.length))];
    return l()+l()+l()+n()+n()+n()+n();
  }
  
}

module.exports = new ESX();