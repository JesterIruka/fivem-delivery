const webhook = require("./webhook");
const config = require("./config");
const { sql, insert, firstTable } = require("./database");
const { isOnline } = require("../api");
const { after } = require("./scheduler");
const { americandreamDate, hasPlugin } = require("./utils");

class VRP {

  async unban(id) {
    await sql("UPDATE vrp_users SET banned=0 WHERE id=?", [id]);
    return true;
  }

  async ban(id) {
    await sql("UPDATE vrp_users SET banned=1 WHERE id=?", [id]);
    return true;
  }

  async addTemporaryPriority(days, id, level) {
    after(days, `vrp.removePriority("${id}", ${level})`);
    await this.addPriority(id, level);
  }

  async addPriority(id, level) {
    const hex = await sql("SELECT identifier FROM vrp_user_ids WHERE user_id=? AND identifier LIKE 'steam:%'", [id]);
    if (hex.length > 0) {
      if (hasPlugin('@crypto')) {
        const rows = await sql("SELECT priority FROM vrp_priority WHERE steam=?", [hex]);
        if (rows.length) {
          const [{ priority: old }] = rows;
          await sql('UPDATE vrp_priority SET priority=? WHERE steam=?', [old + level, hex]);
          return true;
        }
      }
      await sql("REPLACE INTO vrp_priority (steam,priority) VALUES (?,?)", [hex[0].identifier, level,]);
      return true;
    } else {
      webhook.debug("Não foi possível encontrar a steam hex do passport " + id, true);
      return false;
    }
  }

  async removePriority(id) {
    const hex = await sql("SELECT identifier FROM vrp_user_ids WHERE user_id=? AND identifier LIKE 'steam:%'", [id]);
    if (hex.length > 0) {
      await sql("DELETE FROM vrp_priority WHERE steam=?", [hex[0].identifier]);
      return true;
    } else {
      webhook.debug("Não foi possível encontrar a steam hex do passport " + id, true);
      return false;
    }
  }

  async addTemporaryGroup(days, id, group) {
    after(days, `vrp.removeGroup("${id}", "${group}")`);
    await this.addGroup(id, group, days);
  }

  async addGroup(id, group, days = 0) {
    if (await isOnline(id)) return false;
    const res = await sql(
      "SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]
    );
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      webhook.debug("Grupos antigos: " + JSON.stringify(data.groups));
      if (Array.isArray(data.groups)) {
        data.groups = {};
      }
      if (hasPlugin('@valhalla')) {
        for (let g of ['Bronze','Prata','Ouro','Platina','Diamante','Patrao'])
          delete data.groups[g];
      }
      data.groups[group] = true;
      if (hasPlugin('@americandream')) {
        if (!data.groupsTime) data.groupsTime = {};
        data.groupsTime[group] = americandreamDate(new Date(Date.now() + (86400000 * days)));
      }

      await sql(
        "UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]
      );
      return true;
    } else {
      webhook.debug("Não foi encontrado nenhum dvalue para " + id);
      return false;
    }
  }

  async removeGroup(id, group) {
    if (await isOnline(id)) return false;
    const res = await sql(
      "SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]
    );
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (!Array.isArray(data.groups)) delete data.groups[group];
      await sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]);
      return true;
    } else {
      webhook.debug("Não foi encontrado nenhum dvalue para " + id);
      return false;
    }
  }

  async addTemporaryHouse(days, id, house) {
    after(days, `vrp.removeHouse("${id}", "${house}")`);
    await this.addHouse(id, house);
  }

  async addHouse(id, house) {
    if (await isOnline(id)) return false;
    const highest = await sql("SELECT MAX(number) AS `high` FROM vrp_user_homes WHERE home=?", [house]);
    let number = 1;
    if (highest.length > 0) number = highest[0].high + 1;

    const data = { user_id: id, home: house, number }
    if (hasPlugin('@americandream'))
      data['can_sell'] = 0;

    await insert('vrp_user_homes', data, true);
    return true;
  }

  async removeHouse(id, house) {
    if (await isOnline(id)) return false;
    await sql(
      "DELETE FROM vrp_user_homes WHERE user_id=? AND home=?", [id, house],
      true
    );
    return true;
  }

  async addTemporaryHousePermission(days, id, housePrefix) {
    after(days, `vrp.removeHousePermission("${id}", "${housePrefix}")`);
    await this.addHousePermission(id, housePrefix);
  }

  async addHousePermission(id, housePrefix) {
    if (await isOnline(id)) return false;
    const rows = await sql(`SELECT home FROM vrp_homes_permissions WHERE home LIKE '${housePrefix}%'`);
    if (hasPlugin('@valhalla')) {
      const tax = rows.length > 0 ? '' : parseInt(Date.now()/1000);
      const data = { user_id: id, home: housePrefix, owner: 1, garage: 1, tax };
      await insert('vrp_homes_permissions', data);
      return true;
    }

    const occupied = [];
    rows.forEach(row => occupied.push(parseInt(row.home.substring(housePrefix.length))));
    let higher = 1;
    while (occupied.includes(higher)) {
      higher += 1;
    }
    higher = higher > 9 ? higher : "0" + higher;

    const data = { user_id: id, home: housePrefix + higher, owner: 1, garage: 1 };
    if (hasPlugin('@crypto') || hasPlugin('vrp/house-tax')) {
      data['tax'] = parseInt(Date.now() / 1000);
    }

    await insert('vrp_homes_permissions', data);
    return true;
  }

  async removeHousePermission(id, housePrefix) {
    if (await isOnline(id)) return false;
    await sql(
      `DELETE FROM vrp_homes_permissions WHERE user_id=? AND home LIKE '${housePrefix}%' AND owner>0`
      , [id]);
    return true;
  }

  async addTemporaryCar(days, id, car) {
    after(days, `vrp.removeCar("${id}", "${car}")`);
    return await this.addCar(id, car);
  }

  async addCar(id, car) {
    if (await isOnline(id)) return false;

    const table = firstTable('vrp_user_garages', 'vrp_vehicles', 'vrp_user_vehicles');

    const data = { user_id: id, vehicle: car };
    if (hasPlugin('@valhalla'))
      data.ipva = 1994967296;
    else if (hasPlugin('vrp/ipva'))
      data.ipva = parseInt(Date.now() / 1000);
    if (hasPlugin('@americandream'))
      data['can_sell'] = 0;

    await insert(table, data);

    return true;
  }

  async removeCar(id, car) {
    if (await isOnline(id)) return false;
    const table = firstTable('vrp_user_garages', 'vrp_vehicles', 'vrp_user_vehicles');
    await sql("DELETE FROM " + table + " WHERE user_id=? AND vehicle=?", [id, car]);
    return true;
  }

  async addWallet(id, value) {
    if (await isOnline(id)) return false;
    await sql("UPDATE vrp_user_moneys SET wallet=wallet+? WHERE user_id=?", [
      value,
      id,
    ]);
    return true;
  }

  async addBank(id, value) {
    if (await isOnline(id)) return false;

    const row = await sql("SELECT bank FROM vrp_user_moneys WHERE user_id=?", [id], false, false);
    const bank = row.length ? row[0].bank : 0;
    const total = bank + value;

    webhook.debug('Dinheiro no banco antes de entregar: ' + bank);

    await sql("UPDATE vrp_user_moneys SET bank=? WHERE user_id=?", [total, id], false, true);

    webhook.debug('Dinheiro no banco atualizado para ' + total);

    return true;
  }

  async addWeapon(id, weapon, ammo) {
    if (await isOnline(id)) return false;
    const res = await sql(
      "SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]
    );
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (Array.isArray(data.weapons)) {
        data.weapons = { weapon: { ammo } };
      } else if (data.weapons[weapon] && data.weapons[weapon].ammo) {
        data.weapons[weapon][ammo] += ammo;
      } else data.weapons[weapon] = { ammo };
      await sql(
        "UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]
      );
      return true;
    } else {
      webhook.debug("Não foi encontrado nenhum dvalue para " + id);
      return false;
    }
  }

  async addInventory(id, item, amount) {
    if (await isOnline(id)) return false;
    const res = await sql(
      "SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]
    );
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (Array.isArray(data.inventory)) {
        data.inventory = {};
      }
      if (data.inventory[item] && data.inventory[item].amount) {
        data.inventory[item] = { amount: data.inventory[item].amount + amount };
      } else data.inventory[item] = { amount };
      await sql(
        "UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]
      );
      return true;
    } else {
      webhook.debug("Não foi encontrado nenhum dvalue para " + id);
      return false;
    }
  }
}

module.exports = new VRP();
