var express = require("express");
var token_authentication = require("../middleware/auth");

function setup(app, handlers) {

// ########## Authentication Route ##########
  var authenticationRouter = express.Router();

  // Without authentication
  authenticationRouter.post("/authenticate", handlers.users.authenticate)

  app.use("/api/users", authenticationRouter);

// ########## User Routes ##########
  var usersRouter = express.Router();

  // Without authentication
  usersRouter.post("/", handlers.users.createUser);
  usersRouter.post("/activate", handlers.users.activateAccount);

  app.use("/api/users", usersRouter);

  var userRouter = express.Router();
  // With Token authentication
  userRouter.use(token_authentication);
  userRouter.put("/", handlers.users.updateCurrentUser);

  app.use("/api/user", userRouter);

  var guestsRouter = express.Router();
  // With Token authentication
  guestsRouter.use(token_authentication);
  guestsRouter.get("/", handlers.users.getList);

  app.use("/api/guests", guestsRouter);

// ########## Event Routes ##########

  var eventsRouter = express.Router();
  eventsRouter.use(token_authentication);
  eventsRouter.post("/", handlers.events.createEvent);

  app.use("/api/events", eventsRouter);

};

exports.setup = setup;
