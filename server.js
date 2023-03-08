if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
// Importálások
const express = require("express");
const app = express();
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const port = 5174;
const initializePassport = require("./Controllers/auth");
const routes = require("./routes");
const routes_api = require("./routes_api");
const cors = require('cors');

// Middleware-ek
app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use("/", routes);
app.use("/docs", routes_api);




// Login  &  Sign up
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);


// HELYI HÁLÓZAT
app.listen(port, () => {
  console.log('\u001b[' + 32 + 'm' + 'Helyi hálózaton:  ' + '\u001b[0m'+`http://localhost:${port}`)

});

