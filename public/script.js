import { request } from "./js/request.mod.js";

const $s = (s) => document.querySelector(s);
const $sAll = (s) => document.querySelectorAll(s);
const $ce = (el) => document.createElement(el);

let BARBERS = [];

//Kiválasztott fodrász Template
let timeTableTPL = (t) => `
<div class="containertime" data-id="${t.id}" data-name="${t.neve}">
<div class="time-card">
    <div class="head">
        <div class="profile-image">
            <img src="${t.kep}" alt="${t.neve} profilpicture">
        </div>
        <div class="name-headline">
            <h1>${t.neve}</h1>
            <p>${t.mitcsinal}</p>
        </div>
    </div>
    <div id="reservation">
        <div class="div-date">
            <input type="date" id="datemin" name="datemin" max="2023-12-24">
        </div>
        <div class="content-time">
            <p id="chosen-date"></p>
            <div id="bordered">
                <p class="text">Időpontok</p>
                <div id="all-dates"></div>
            </div>
            <div id="reservation-datas">
                <button  id="send-reservation">Foglalás</button>
                <input type="text" name="nev" id="nev" placeholder="Foglalási név">
                <input type="text" name="datum" id="datum" placeholder="yyyy.mm.dd" disabled>
                <input type="text" name="ora" id="ora" placeholder="hh:mm" disabled>
                <a class="back-button" href="./index.html" title="Másik fodrász választása">Vissza</a>
            </div>
        </div>
    </div>
</div>
</div>
`;

//Kiválasztott fodrász Template rendelerése
function renderTimeTables(barberList, index) {
  let barbersCt = $s("#container");

  let barbersString = "";
  barbersString += timeTableTPL(barberList[index]);

  barbersCt.innerHTML = barbersString;

  $s("#datemin").valueAsDate = new Date();
  $s("#datemin").min = new Date(new Date() - 1000 * 60 * 60 * 24)
    .toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll(".", "")
    .replaceAll(" ", "-");

  $s("#datemin").onchange = function () {
    let ul = $ce("ul");
    let div = $s("#all-dates");
    let idopontok =
      barberList[index].nyitvatartas[$s("#datemin").valueAsDate.getDay()];

    $s("#chosen-date").innerText = $s("#datemin").value;
    $s("#datum").value = $s("#chosen-date").innerText;

    if (!idopontok) {
      div.innerHTML = "A mai napon nem dolgozok";
    }

    let aktivIdopont;

    for (const x of idopontok) {
      let barberDatum = barberList[index].idopontfoglalas.find(
        (i) => i.datum === $s("#datemin").value && i.ido === x
      );
      let li = $ce("li");
      li.classList.add("chosen-dates");
      if (!!barberDatum) {
        li.classList.add("reserved");
      } else {
        li.addEventListener("click", function (event) {
          $s("#ora").value = event.target.textContent;
          if (!!aktivIdopont) {
            aktivIdopont.classList.remove("marked");
          }
          aktivIdopont = event.target;
          aktivIdopont.classList.add("marked");
        });
      }
      li.textContent = x;

      ul.appendChild(li);
    }
    div.innerHTML = "";
    div.appendChild(ul);
  };

  //Új foglalás kérésének küldése a szerver felé
  $s("#send-reservation").onclick = function () {
    let nev = $s("#nev").value.trim();
    let datum = new Date($s("#datum").value.trim()).getTime();
    let today = new Date().setHours(0, 0, 0, 0);
    let [ora, perc] = $s("#ora").value.trim().split(":");

    if (nev !== "" && datum >= today && +ora >= 8 && +ora <= 18)
      fetch("/adatok/" + barberList[index].id, {
        body: JSON.stringify({
          nev,
          datum: new Date(datum)
            .toLocaleString("hu-HU", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replaceAll(".", "")
            .replaceAll(" ", "-"),
          ido: [ora, perc].join(":"),
        }),
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then(function (res) {
          $s("#nev").value = "";
          $s("#datum").value = "";
          $s("#ora").value = "";
        })
        .catch(function (err) {
          console.log(err);
        });
    else alert("A foglalás elküldéséhez, minden mezőt kötelező kitölteni!");
  };
}

//A kijelölt fodrász alatt a hozzá tartozó adatok töltődjenek be
let btn1 = $s("#button1");
let btn2 = $s("#button2");
let btn3 = $s("#button3");

let btns = [btn1, btn2, btn3];

btns.forEach((btn, index) => {
  btn.addEventListener("click", (event) => {
    request.get("/adatok", (res) => {
      BARBERS = JSON.parse(res);
      let btnIndex = index;
      renderTimeTables(BARBERS, btnIndex);
    });
  });
});

//Fodrászok Template az Admin felületen
let adminTPL = (a) => `
<div class="containertime" data-id="${a.id}" data-name="${a.neve}">
<div class="time-card">
    <div class="head">
        <div class="profile-image">
            <img src="${a.kep}" alt="${a.neve} profilpicture">
        </div>
        <div class="name-headline">
            <h1>${a.neve}</h1>
            <div class="reserved-dates"></div>
        </div>
    </div>
</div>
</div>
`;

//Fodrászok Template (Admin felületen) rendelerése
function renderAdminTables(barberList, barbersCt) {
  let barbersString = "";
  barbersString += adminTPL(barberList);

  barbersCt.innerHTML += barbersString;
}

const btnAdmin = $s("#a4"); //Admin gomb

btnAdmin.addEventListener("click", (event) => {
  let barbersCt = $s("#container");
  barbersCt.innerHTML = "";

  request.get("/adatok", (res) => {
    BARBERS = JSON.parse(res);
    for (const barber of BARBERS) {
      renderAdminTables(barber, barbersCt);
    }
    $sAll(".reserved-dates").forEach((b, i) => {
      for (let j = 0; j < BARBERS[i].idopontfoglalas.length; j++) {
        const { nev, datum, ido } = BARBERS[i].idopontfoglalas[j];
        const mainDiv = $ce("div");
        mainDiv.classList.add("main-div");
        mainDiv.innerHTML = `<p>Név: </p>${nev}<p>Dátum: </p> ${datum}<p>Időpont: </p> ${ido}`;

        const deleteSpan = $ce("span");
        deleteSpan.classList.add("delete");
        deleteSpan.innerHTML = "X";
        //Törlés kérésének küldése a szerver felé
        deleteSpan.onclick = function () {
          fetch(`/adatok/${BARBERS[i].id}`, {
            method: "DELETE",
            body: JSON.stringify({ datum, ido }),
            headers: { "Content-Type": "application/json" },
          })
            .then((res) => res.json())
            .then((res) => {
              mainDiv.innerHTML = "";
            });
        };
        mainDiv.appendChild(deleteSpan);
        b.appendChild(mainDiv);
      }
    });
  });
});
