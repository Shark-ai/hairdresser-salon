const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Oldal betöltése
app.get("/adatok", (req, res) => {
  fs.readFile(path.join(__dirname, "adatok.json"), (err, body) => {
    res.json(JSON.parse(body));
  });
});

// Rossz URL
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/public/404.html");
});

// Új foglalás
app.post("/adatok/:id", (req, res) => {
  const newReservation = req.body;

  fs.readFile(__dirname + "/adatok.json", function (err, resText) {
    const Barbers = JSON.parse(resText);
    let barberIndex = Barbers.findIndex((barber) => barber.id == req.params.id);
    if (barberIndex < 0) {
      res.json({ message: "Nincs ilyen fodrász" });
      return;
    }
    Barbers[barberIndex].idopontfoglalas = [
      ...Barbers[barberIndex].idopontfoglalas,
      newReservation,
    ];

    fs.writeFile(
      __dirname + "/adatok.json",
      JSON.stringify(Barbers, null, 2),
      function (err) {
        res.json({ message: "OK" });
      }
    );
  });
});

// Foglalás törlése
app.delete("/adatok/:id", (req, res) => {
  fs.readFile(__dirname + "/adatok.json", function (err, resText) {
    const Barbers = JSON.parse(resText);

    const barberIndex = Barbers.findIndex((p) => p.id == req.params.id);
    if (barberIndex < 0) {
      res.json({ message: "Nincs ilyen fodrász" });
      return;
    }
    Barbers[barberIndex].idopontfoglalas = Barbers[
      barberIndex
    ].idopontfoglalas.filter((p) => {
      return !(p.datum === req.body.datum && p.ido === req.body.ido);
    });

    fs.writeFile(
      __dirname + "/adatok.json",
      JSON.stringify(Barbers, null, 2),
      function (err) {
        res.json({ data: Barbers[barberIndex].idopontfoglalas });
      }
    );
  });
});

app.listen(3000);
