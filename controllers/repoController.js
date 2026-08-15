const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const { s3, S3_BUCKET } = require("../config/aws-config");

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }
    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
      content,
      issues,
    });
    const result = await newRepository.save();
    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res.json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;
  try {
    const repository = await Repository.find({ _id: id })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
    console.log(req.params);

    const { userID } = req.params;

    try {
        const repositories = await Repository.find({
            owner: userID
        });

        console.log("Repositories:", repositories);

        res.json({
            message: "Repositories found!",
            repositories
        });

    } catch (err) {
        console.error(
            "Error during fetching user repositories : ",
            err.message
        );

        res.status(500).send("Server error");
    }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.content.push(content);
    repository.description = description;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;
  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }
    const prefix = `repositories/${id}/files/`;
    let continuationToken = undefined;
    let totalDeleted = 0;
    do {
      const listParams = {
        Bucket: S3_BUCKET,
        Prefix: prefix,
        ...(continuationToken && {
          ContinuationToken: continuationToken,
        }),
      };
      const data = await s3
        .listObjectsV2(listParams)
        .promise();

      if (data.Contents && data.Contents.length > 0) {
        const objects = data.Contents.map((item) => ({
          Key: item.Key,
        }));
        await s3
          .deleteObjects({
            Bucket: S3_BUCKET,
            Delete: {
              Objects: objects,
              Quiet: true,
            },
          })
          .promise();

        totalDeleted += objects.length;
      }
      continuationToken =
        data.IsTruncated
          ? data.NextContinuationToken
          : undefined;

    } while (continuationToken);

    console.log(
      `Deleted ${totalDeleted} S3 files for repository ${id}`
    );
    await Repository.findByIdAndDelete(id);
    res.status(200).json({
      message: "Repository and its files deleted successfully!",
      deletedFiles: totalDeleted,
    });
  } catch (err) {
    console.error(
      "Error during repository deletion:",
      err
    );
    res.status(500).json({
      error: "Failed to delete repository",
    });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};