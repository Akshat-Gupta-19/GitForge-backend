const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId;

dotenv.config();
const uri = process.env.MONGODB_URI;
let client;

async function connectClient(){
    if(!client){
        client = new MongoClient(uri);
    }
    await client.connect();
}

const signUp = async (req,res)=>{
    const {username , password, email} = req.body;
    try{
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({username});
        if(user){
            return res.status(400).json({message:"User already exists!"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = {
            username,
            hashedPassword,
            email,
            repositories : [],
            followedUsers : [],
            starRepos : [],
        }

        const result = await usersCollection.insertOne(newUser);

        const token = jwt.sign(
            { id: result.insertedId },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({token , userId : result.insertedId});
    }
    catch(err){
        console.error(`error during signup: ${err.message}`);
        res.status(500).send("server error");
    }
}

const login = async (req,res)=>{
    const {email,password} = req.body;
    try{
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({email});
        if(!user){
            return res.status(401).json({message:"Invalid credential"});
        }

        const isMatch = await bcrypt.compare(password,user.hashedPassword);
        if(!isMatch){
            return res.status(401).json({message:"Invalid credential"});
        }

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" },
        );

        res.json({token,userId:user._id});

    }catch(err){
        console.error(`error during login: ${err.message}`);
        res.status(500).send("server error");
    }
}


const getAllUsers = async (req,res)=>{
    try{
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");
        const users = await usersCollection.find({}).toArray();
        res.json(users);

    }catch(err){
        console.error(`error during fetching all users: ${err.message}`);
        res.status(500).send("server error");
    }
}

const getUserProfile = async (req,res)=>{
    const currentID = req.params.id;
    try{
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne(
            {_id : new ObjectId(currentID)}
        );
        if(!user){
            return res.status(404).json({message:"User not found!"});
        }
        res.json({user, message: "Profile fetched!"});

    }catch(err){
        console.error(`error during fetching User: ${err.message}`);
        res.status(500).send("server error");
    }
}

const updateUserProfiles = async (req, res) => {
    const currentID = req.params.id;
    const { email, password } = req.body;
    try {
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");
        let updatedFields = {};
        if (email) {
            updatedFields.email = email;
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updatedFields.hashedPassword = hashedPassword;
        }
        const result = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(currentID) },
            { $set: updatedFields },
            { returnDocument: "after" }
        );
        if (!result) {
            return res.status(404).json({
                message: "User not found!"
            });
        }
        res.json(result);
    } catch (err) {
        console.error(`error during updating User: ${err.message}`);
        res.status(500).send("server error");
    }
};

const deleteUserProfiles = async (req, res) => {
    const currentID = req.params.id;
    try {
        await connectClient();
        const db = client.db("GitForge");
        const usersCollection = db.collection("users");
        const result = await usersCollection.deleteOne({
            _id: new ObjectId(currentID)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "User not found!"
            });
        }
        res.json({
            message: "Profile deleted successfully!"
        });
    } catch (err) {
        console.error(`error during deleting User: ${err.message}`);
        res.status(500).send("server error");
    }
};

module.exports = {getAllUsers,signUp,login,getUserProfile,updateUserProfiles,deleteUserProfiles};