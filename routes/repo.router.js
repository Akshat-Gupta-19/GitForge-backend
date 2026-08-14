const express = require("express");
const repoController = require("../controllers/repoController.js");

//upload files
const repoUploadController = require("../controllers/repoUpload.js");
const upload = require("../middleware/upload.js");

const repoRouter = express.Router();

repoRouter.post("/repo/create", repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);

repoRouter.get( "/repo/user/:userID",repoController.fetchRepositoriesForCurrentUser);

repoRouter.put("/repo/update/:id", repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);
repoRouter.patch("/repo/toggle/:id", repoController.toggleVisibilityById);

//upload files
repoRouter.post(
  "/repo/upload-files",
  upload.array("files"),
  repoUploadController.uploadRepositoryFiles
);

repoRouter.get(
  "/repo/:id/files",
  repoUploadController.getRepositoryFiles
);

repoRouter.get(
  "/repo/:id/file",
  repoUploadController.getRepositoryFile
);

module.exports = repoRouter;