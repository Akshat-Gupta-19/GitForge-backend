const express = require('express');
const userController = require("../controllers/userController");
const userRouter = express.Router();

userRouter.get("/allUsers",userController.getAllUsers);
userRouter.post("/signup",userController.signUp);
userRouter.post("/login",userController.login);
userRouter.get("/userProfile/:id",userController.getUserProfile);
userRouter.put("/updateProfile/:id",userController.updateUserProfiles);
userRouter.delete("/deleteProfile/:id",userController.deleteUserProfiles);

module.exports = userRouter;