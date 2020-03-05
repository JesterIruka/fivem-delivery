module.exports = function (app) {

  const sql = app.sql;
  const adicionarGrupo = addGroup;
  const removerGrupo = removeGroup;
  const adicionarCasa = addHouse;
  const adicionarCarro = addCar;

  async function addGroup(id, group) {
    if (app.isOnline(id)) return false;
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
    if (app.isOnline(id)) return false;
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
    if (app.isOnline(id)) return false;
    const highest = await sql('SELECT MAX(number) AS `high` FROM vrp_user_homes WHERE home=?', [house]);
    let number = 1;
    if (highest.length > 0) number=highest[0].high+1;
    await sql('INSERT INTO vrp_user_homes (user_id,home,number) VALUES (?,?,?)', [id,house,number]);
    return true;
  }

  async function addCar(id, car) {
    if (app.isOnline(id)) return false;
    await sql('INSERT INTO vrp_user_vehicles (user_id,vehicle) VALUES (?,?)', [id,car]);
    return true;
  }
  
  return {
    adicionarGrupo, addGroup,
    removerGrupo, removeGroup,
    adicionarCasa, addHouse,
    adicionarCarro, addCar
  };
}