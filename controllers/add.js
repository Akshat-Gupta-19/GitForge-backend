const fs = require("fs").promises;
const path = require("path");

async function add(filePath){
    const repoPath = path.resolve(process.cwd(),".gitForge");
    const stagingPath = path.join(repoPath,"staging");

    try{
        await fs.mkdir(stagingPath,{recursive : true});
        const fileName = path.basename(filePath);
        await fs.copyFile(filePath,path.join(stagingPath,fileName));
        console.log(`file ${fileName} added to the staging area!`);
    }catch(err){
        console.error("Error adding file : ",err);
    }
}

module.exports = {add};