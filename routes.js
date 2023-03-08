const express = require("express");
const router = express.Router();
const passport = require("passport");


// Controllers
// Adatbázis kapcsolat
const connection = require('./Controllers/database');

// API hívások
const { AllEvents, getUsers, getAppliedEvents } = require('./Controllers/queries');

//Bejelentkezés és regisztrációs folyamatok
const {signUp,forgotPassword,changePassword } = require("./Controllers/auth_process"); 

//Adminisztrációs folyamatok
const {AddNewEvent,AddNewAdmin,deleteEvent } = require("./Controllers/admin_process");

//Felhasználói folyamatok
const { deleteUserById,applyToLocation, cancelApplication, contactForm } = require('./Controllers/user_process');



// ================================================================================//
// ==================================== G E T ====================================//
// ==============================================================================//
router.get("/",async(req, res) => {
  try {
      const eventArray = await AllEvents();
      res.render("pages/homeview", {islogin: req.isAuthenticated(),eventArray}, 
      );

  } catch (error) {
    console.log(error);
    res.send('Hiba az adatok letöltése során! (Adatbázis hiba)');
  }
 });
// Adminisztrációs felület
router.get("/adminpage", checkAuthenticated, async (req, res) => {
  try {
    const eventArray = await AllEvents();
    const usersArray = await getUsers();
    res.render("pages/adminpage", {
      title: "Adminisztráció",
      islogin: req.isAuthenticated(),
      isAdmin: req.user.permission,
      eventArray, usersArray
      
    });
  } catch (error) {
    console.log(error);
    res.send('Hiba az adatok letöltése során! (Adatbázis hiba)');
  }
});



// Felhasználói fiók
router.get("/userpage",checkAuthenticated,async (req, res) => {
  const formattedDate = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'short' }).format(new Date(req.user.birthdate)); // Dátum formázása magyar formátumra
  const appliedEvents =await getAppliedEvents(req.user.id)
  res.render("pages/userpage", {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    citizenship: req.user.nationality,
    birthday: formattedDate,
    gender: req.user.gender,
    isAdmin: req.user.permission,
    islogin: req.isAuthenticated(),
    appliedEvents,
  });
});



// Adatvédelmi oldal
router.get("/adatvedelem", (req, res) => {
  res.render("pages/adatvedelem", { title: "Adatvédelem", islogin: req.isAuthenticated()});
});

// Bejelentkezéshez szükséges aloldalak (KIVEZETÉSRE KERÜL)
router.get("/signup", checkNotAuthenticated, (req, res) => {
  res.render("pages/homeview", { title: "GO EVENT! - Home" ,islogin: req.isAuthenticated()});
});


// Új adminisztrátor rögzítése (KIVEZETÉSRE KERÜL)
router.get("/newadmin", checkAuthenticated, (req, res) => {
  res.render("pages/adminpage", { title: "GO EVENT! - Adminisztráció",islogin: req.isAuthenticated() });
});



// ==================================================================================//
// ==================================== P O S T ====================================//
// ================================================================================//

// Bejelentkezés az alkalmazásba
router.post("/login",checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true,
  })
);


router.post("/signup", checkNotAuthenticated, signUp(connection));   // Általános hozzáférésű regisztráció
router.post("/newadmin", checkAuthenticated, AddNewAdmin(connection));  // Adminisztráció: Új admin hozzáadása
router.post("/addevent",   checkAuthenticated, AddNewEvent(connection)); // Adminisztráció: Esemény létrehozása

// Hírlevél tartalmának továbbítása emailben
router.post("/", (req, res, ) => { 
  contactForm(req.body.senderName, req.body.senderEmail, req.body.subject, req.body.message);
  res.redirect("/#contact")
});


// Események és felhasználók törlése adatbázisból
router.post('/eventdelete', (req, res) => { 
  deleteEvent(req.body.id)

  res.redirect('/adminpage');
});

// Fiók törlése admin felületről
router.post('/deleteuser', (req, res) => {
  deleteUserById(req.body.id);

  res.redirect('/adminpage');
});

// Fiók törlése userpage oldalon (Csak user joggal rendelkezőknek!)
router.post('/deleteAccount', (req, res) => {
  deleteUserById(req.body.id);
  req.logout(req.user, (err) => {
    if (err) return next(err);
  
  res.redirect('/');
  
});
})

// Jelszó frissítése userpage oldalon
router.post('/refreshPassword', (req, res) => {
  changePassword(req.user.id, req.body.password_old, req.body.password_new, req.body.password_new_match, callbackPromise); 
  res.redirect('/userpage'); 
});

// Elfelejtett jelszó (Új jelszó igénylése)
router.post('/forgotPassword', (req, res) => {
  forgotPassword(req.body.email); 
  res.redirect('/'); 
});

// Jelentkezés egy eseményre 
router.post('/applyToLocation', (req, res) => {
  const mergedata = req.body.locationId.split(";");;
  const locationId = parseInt(mergedata[0])
  const userAge= Math.round((new Date(mergedata[2])-new Date(req.user.birthdate)) / (1000 * 60 * 60 * 24 * 365.25));
  const eventAge= parseInt(mergedata[3]);
  const eventId= parseInt(mergedata[1])

  applyToLocation(locationId,req.user.id,eventId,userAge,eventAge,req.user.email); 
  res.redirect('/#actually');
  
});

// Jelentkezés visszamondása
router.post('/cancelApplication', (req, res) => {
  const mergedata = req.body.locationId.split(";");;
  const locationId = parseInt(mergedata[0])
  const eventId= parseInt(mergedata[1])

  cancelApplication(locationId,req.user.id,eventId,req.user.email); 
  res.redirect('/#actually'); 
});




// ===================================================================================//
// ================================= D E L E T E ====================================//
// =================================================================================//
router.delete("/logout", (req, res) => {
  req.logout(req.user, (err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});


function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return next()
  }
  res.redirect("/")
  
}

function checkNotAuthenticated(req, res, next){
if(req.isAuthenticated()){
    return res.redirect("/")
    
}
next()
}



module.exports = router;