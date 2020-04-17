const json = require("./scheduled.json");
json.sort((a, b) => a.date - b.date);

let number = 1;

for (const appointment of json) {
  const eval = appointment.eval;
  const date = new Date(appointment.date);

  const day = date.toISOString().split("T")[0].split("-").reverse().join("/");
  const [time] = date.toTimeString().split(" ");

  console.log(`#${number} | ${eval} será executado em ${day} às ${time}`);
  number += 1;
}
