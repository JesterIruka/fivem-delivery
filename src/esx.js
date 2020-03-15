module.exports = function (app) {

  const sql = app.sql;
  const adicionarGrupo = addGroup;
  const adicionarCasa = addHouse;
  const adicionarCarro = addCar;

  function addGroup(id, group) {
    
  }

  function addHouse(id, group) {

  }

  function addCar(id, group) {

  }
  
  return {
    adicionarGrupo, addGroup,
    adicionarCasa, addHouse,
    adicionarCarro, addCar
  };
}