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

  userRouter.get("/events", handlers.users.getEventAdminList);

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

  eventsRouter.get("/:event_id", handlers.events.getEventById);
  eventsRouter.put("/:event_id", handlers.events.updateEvent);
  eventsRouter.delete("/:event_id", handlers.events.removeEvent);

  app.use("/api/events", eventsRouter);

};

exports.setup = setup;
