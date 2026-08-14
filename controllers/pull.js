const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");

async function pull() {
    const repoPath = path.resolve(process.cwd(), ".gitForge");
    const commitsPath = path.join(repoPath, "commits");

    try {
        const data = await s3.listObjectsV2({
            Bucket: S3_BUCKET,
            Prefix: "commits/"
        }).promise();
        const objects = data.Contents || [];
        for (const object of objects) {
            const key = object.Key;
            const filePath = path.join(repoPath, key);
            await fs.mkdir(path.dirname(filePath), {
                recursive: true
            });
            const fileContent = await s3.getObject({
                Bucket: S3_BUCKET,
                Key: key
            }).promise();
            await fs.writeFile(filePath, fileContent.Body);
        }
        console.log("All commits pulled from S3");
    } catch (err) {
        console.error(`Unable to pull: ${err}`);
    }
}

module.exports = { pull };