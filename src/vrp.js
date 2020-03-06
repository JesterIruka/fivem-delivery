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
      console.log(data);
      if (Array.isArray(data.groups)) {
        data.groups = {};
      }
      data.groups[group] = true;
      sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=?", [JSON.stringify(data), id]);
      return true;
    } else {
      console.log('Não foi encontrado nenhum dvalue para '+id);
      return false;
    }
  }

  async function removeGroup(id, group) {
    if (await app.isOnline(id)) return false;
    const res = await sql("SELECT dvalue FROM vrp_user_data WHERE user_id=? AND dkey='vRP:datatable'", [id]);
    if (res.length > 0) {
      const data = JSON.parse(res[0].dvalue);
      if (!Array.isArray(data.groups)) delete data.groups[group];
      sql("UPDATE vrp_user_data SET dvalue=? WHERE user_id=?", [JSON.stringify(data), id]);
      return true;
    } else {
      console.log('Não foi encontrado nenhum dvalue para '+id);
      return false;
    }
  }

  async function addHouse(id, house) {
    if (await app.isOnline(id)) return false;
    const highest = await sql('SELECT MAX(number) AS `high` FROM vrp_user_homes WHERE home=?', [house]);
    let number = 1;
    if (highest.length > 0) number=highest[0].high+1;
    await sql('INSERT INTO vrp_user_homes (user_id,home,number) VALUES (?,?,?)', [id,house,number]);
    return true;
  }

  async function removeHouse(id, house) {
    if (await app.isOnline(id)) return false;
    await sql('DELETE FROM vrp_user_homes WHERE user_id=? AND home=?', [id,house]);
    return true;
  }

  async function addCar(id, car) {
    if (await app.isOnline(id)) return false;
    await sql('INSERT INTO vrp_user_vehicles (user_id,vehicle) VALUES (?,?)', [id,car]);
    return true;
  }

  async function removeCar(id, car) {
    if (await app.isOnline(id)) return false;
    await sql('DELETE FROM vrp_user_vehicles WHERE user_id=? AND vehicle=?', [id,car]);
    return true;
  }

  async function addWallet(id, value) {
    if (await app.isOnline(id)) return false;
    await sql('UPDATE vrp_user_moneys SET wallet=wallet+? WHERE id=?', [value,id]);
    return true;
  }

  async function addBank(id, value) {
    if (await app.isOnline(id)) return false;
    await sql('UPDATE vrp_user_moneys SET bank=bank+? WHERE id=?', [value,id]);
    return true;
  }
  
  return {
    adicionarGrupo, addGroup,
    removerGrupo, removeGroup,
    adicionarCasa, addHouse,
    removerCasa, removeHouse,
    adicionarCarro, addCar,
    addWallet, adicionarCarteira,
    addBank, adicionarBanco
  };
}