const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const {Server} = require("socket.io");
const mainRouter = require("./routes/main.router.js");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { initRepo } = require("./controllers/init.js");
const { add } = require("./controllers/add.js");
const { commit } = require("./controllers/commit.js");
const { push } = require("./controllers/push.js");
const { pull } = require("./controllers/pull.js");
const { revert } = require("./controllers/revert.js");

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "Starts a new server", {}, startServer)
  .command("init", "Initialise a new repository", {}, initRepo)
  .command(
    "add <file>",
    "Add a file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "file to add to staging area",
        type: "string",
      });
    },
    (argv)=>{
      add(argv.file);
    }
  )
  .command(
    "commit <message>",
    "Commit the staged file",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv)=>{
      commit(argv.message);
    }
  )
  .command("push", "Push commits to S3", {}, push)
  .command("pull", "pull commits from S3", {}, pull)
  .command(
    "revert <commitID>",
    "Revert to specific command",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Commit ID to revert to",
        type: "String",
      });
    },
    (argv)=>{
      revert(argv.commitID);
    }
  )
  .demandCommand(1, "you need at least one command")
  .help().argv;

function startServer(){
  const app = express();
  const port = process.env.PORT || 3002;

  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURI = process.env.MONGODB_URI;
  mongoose
  .connect(mongoURI)
  .then(()=>console.log("MogoDB connected!"))
  .catch((err)=> console.log("Unable to connect : ",err));

  app.use(cors({
    origin: "https://main.d3h12raejvaw29.amplifyapp.com"
  }));
  app.use("/",mainRouter);

  let user = "test";
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
  cors: {
    origin: "https://main.d3h12raejvaw29.amplifyapp.com",
    methods: ["GET", "POST"]
  }
});

  io.on("connection",(socket)=>{
    socket.on("joinRoom",(userID)=>{
      user = userID;
      console.log("=====");
      console.log(user);
      console.log("=====");
      socket.join(userID);
    });
  });

  const db = mongoose.connection;

  db.once("open",async() =>{
    console.log("CRUD opertaion called");
    //CRUD operation
  })

  httpServer.listen(port,()=>{
    console.log(`Server is running on PORT : ${port}`);
  })
}