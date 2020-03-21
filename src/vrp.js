const webhook = require('./webhook');

module.exports = function (app) {

  const sql = app.sql;
  const adicionarGrupo = addGroup;
  const removerGrupo = removeGroup;
  const adicionarCasa = addHouse;
  const removerCasa = removeHouse;
  const adicionarCarro = addCar;
  const removerCarro = removeCar;
  const adicionarCarteira = addWallet;
  const adicionarBanco = addBank;

  async function addGroup(id, group) {
    if (await app.isOnline(id)) return false;
    const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id='"+id+"' AND dkey='vRP:datatable'");
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      webhook.debug("Grupos antigos: "+JSON.stringify(data.groups));
      if (Array.isArray(data.groups)) {
        data.groups = {};
      }
      data.groups[group] = true;
      await sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]);
      return true;
    } else {
      webhook.debug('Não foi encontrado nenhum dvalue para '+id);
      return false;
    }
  }

  async function removeGroup(id, group) {
    if (await app.isOnline(id)) return false;
    const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]);
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (!Array.isArray(data.groups)) delete data.groups[group];
      sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]);
      return true;
    } else {
      webhook.debug('Não foi encontrado nenhum dvalue para '+id);
      return false;
    }
  }

  async function addHouse(id, house) {
    if (await app.isOnline(id)) return false;
    const highest = await sql('SELECT MAX(number) AS `high` FROM vrp_user_homes WHERE home=?', [house]);
    let number = 1;
    if (highest.length > 0) number=highest[0].high+1;
    await sql('INSERT INTO vrp_user_homes (user_id,home,number) VALUES (?,?,?)', [id,house,number], true);
    return true;
  }

  async function addHousePermission(id, housePrefix) {
    if (await app.isOnline(id)) return false;
    const rows = await sql(`SELECT home FROM vrp_homes_permissions WHERE home LIKE '${housePrefix}%'`);
    let higher = 1;
    for (let row of rows) {
      const number = parseInt(row.home.substr(housePrefix.length));
      if (number >= higher) higher = number+1;
    }
    higher = (higher>9)?higher:"0"+higher;
    await sql("INSERT INTO vrp_homes_permissions (user_id,home,owner,garage) VALUES (?,?,1,1)", [id, housePrefix+higher], true)
    return true;
  }

  async function removeHousePermission(id, housePrefix) {
    if (await app.isOnline(id)) return false;
    await sql(`DELETE FROM vrp_homes_permissions WHERE user_id=? AND home LIKE '${housePrefix}%' AND owner>0`);
    return true;
  }

  async function removeHouse(id, house) {
    if (await app.isOnline(id)) return false;
    await sql('DELETE FROM vrp_user_homes WHERE user_id=? AND home=?', [id,house], true);
    return true;
  }

  async function addCar(id, car) {
    if (await app.isOnline(id)) return false;
    await sql('INSERT INTO vrp_user_vehicles (user_id,vehicle) VALUES (?,?)', [id,car], true);
    return true;
  }

  async function removeCar(id, car) {
    if (await app.isOnline(id)) return false;
    await sql('DELETE FROM vrp_user_vehicles WHERE user_id=? AND vehicle=?', [id,car]);
    return true;
  }

  async function addWallet(id, value) {
    if (await app.isOnline(id)) return false;
    await sql('UPDATE vrp_user_moneys SET wallet=wallet+? WHERE user_id=?', [value,id]);
    return true;
  }

  async function addBank(id, value) {
    if (await app.isOnline(id)) return false;
    await sql('UPDATE vrp_user_moneys SET bank=bank+? WHERE user_id=?', [value,id]);
    return true;
  }

  async function addWeapon(id, weapon, ammo) {
    if (await app.isOnline(id)) return false;
    const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id='"+id+"' AND dkey='vRP:datatable'");
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (Array.isArray(data.weapons)) {
        data.weapons = {weapon:{ammo}};
      } else if (data.weapons[weapon] && data.weapons[weapon].ammo) {
        data.weapons[weapon][ammo]+=ammo;
      } else data.weapons[weapon] = {ammo};
      await sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=? AND dkey='vRP:datatable'", [JSON.stringify(data), id]);
      return true;
    } else {
      webhook.debug('Não foi encontrado nenhum dvalue para '+id);
      return false;
    }
  }
  
  return {
    adicionarGrupo, addGroup,
    removerGrupo, removeGroup,
    adicionarCasa, addHouse,
    removerCasa, removeHouse,
    adicionarCarro, addCar,
    addWallet, adicionarCarteira,
    addHousePermission, removeHousePermission,
    addBank, adicionarBanco
  };
}