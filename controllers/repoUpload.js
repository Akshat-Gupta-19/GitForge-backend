const { s3, S3_BUCKET } = require("../config/aws-config");

async function uploadRepositoryFiles(req, res) {
  try {
    const { repositoryId } = req.body;

    if (!repositoryId) {
      return res.status(400).json({
        error: "Repository ID is required!",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No files uploaded!",
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      // Frontend se folder ka relative path aa raha hai
      const relativePath =
        file.originalname || file.filename;

      const params = {
        Bucket: S3_BUCKET,
        Key: `repositories/${repositoryId}/files/${relativePath}`,
        Body: file.buffer,
        ContentType: file.mimetype || "application/octet-stream",
      };

      const result = await s3.upload(params).promise();

      uploadedFiles.push({
        name: relativePath,
        url: result.Location,
      });
    }

    res.status(200).json({
      message: "Files uploaded successfully!",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Error uploading repository files:", err);

    res.status(500).json({
      error: "Failed to upload repository files",
    });
  }
}

async function getRepositoryFiles(req, res) {
  try {
    const { id } = req.params;
    const repositoryId = id;

    if (!repositoryId) {
      return res.status(400).json({
        error: "Repository ID is required!",
      });
    }

    const params = {
      Bucket: S3_BUCKET,
      Prefix: `repositories/${repositoryId}/files/`,
    };

    const data = await s3.listObjectsV2(params).promise();

    const files = (data.Contents || []).map((item) => {
      return {
        key: item.Key,
        name: item.Key.replace(
          `repositories/${repositoryId}/files/`,
          ""
        ),
        size: item.Size,
        lastModified: item.LastModified,
      };
    });

    res.status(200).json({
      repositoryId,
      files,
    });
  } catch (err) {
    console.error("Error fetching repository files:", err);

    res.status(500).json({
      error: "Failed to fetch repository files",
    });
  }
}

async function getRepositoryFile(req, res) {
  try {
    const { id } = req.params;
    const { path: filePath } = req.query;

    if (!id || !filePath) {
      return res.status(400).json({
        error: "Repository ID and file path are required!",
      });
    }

    const key = `repositories/${id}/files/${filePath}`;

    const params = {
      Bucket: S3_BUCKET,
      Key: key,
    };

    const data = await s3.getObject(params).promise();

    res.status(200).json({
      path: filePath,
      content: data.Body.toString("utf-8"),
    });
  } catch (err) {
    console.error("Error fetching repository file:", err);

    if (err.code === "NoSuchKey") {
      return res.status(404).json({
        error: "File not found!",
      });
    }

    res.status(500).json({
      error: "Failed to fetch file",
    });
  }
}

module.exports = {
  uploadRepositoryFiles,
  getRepositoryFiles,
  getRepositoryFile,
};