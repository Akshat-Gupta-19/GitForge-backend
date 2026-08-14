const mongoose = require('mongoose');
const Repository = require("../models/repoModel.js");
const User = require("../models/userModel.js");
const Issue = require("../models/issueModel.js");

const createIssue = async (req, res) => {
    const { title, description } = req.body;
    const { id } = req.params;
    try {
        const issue = new Issue({
            title,
            description,
            repository: id
        });
        await issue.save();
        res.status(201).json(issue);
    } catch (err) {
        console.error(`error during create Issue: ${err.message}`);
        res.status(500).send("server error");
    }
};

const updateIssueById = async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    try {
        const issue = await Issue.findById(id);
        if (!issue) {
            return res.status(404).json({
                error: "Issue not found!"
            });
        }
        if (title !== undefined) issue.title = title;
        if (description !== undefined) issue.description = description;
        if (status !== undefined) issue.status = status;
        await issue.save();
        res.json(issue);
    } catch (err) {
        console.error(`error during updating Issue: ${err.message}`);
        res.status(500).send("server error");
    }
};

const deleteIssueById = async (req, res) => {
    const { id } = req.params;
    try {
        const issue = await Issue.findById(id);
        if (!issue) {
            return res.status(404).json({
                error: "Issue not found!"
            });
        }
        await Issue.findByIdAndDelete(id);
        res.json({
            message: "Issue deleted successfully!"
        });
    } catch (err) {
        console.error(`error during deleting Issue: ${err.message}`);
        res.status(500).send("server error");
    }
};

const getAllIssues = async (req, res) => {
    const { id } = req.params;
    try {
        const issues = await Issue.find({
            repository: id
        });
        if (!issues || issues.length === 0) {
            return res.status(404).json({
                error: "No issues found!"
            });
        }
        res.json({
            message: "Issues fetched successfully!",
            issues
        });
    } catch (err) {
        console.error(`error during fetching all Issues: ${err.message}`);
        res.status(500).send("server error");
    }
};

const getIssueById = async (req, res) => {
    const { id } = req.params;
    try {
        const issue = await Issue.findById(id);
        if (!issue) {
            return res.status(404).json({
                error: "Issue not found!"
            });
        }
        res.json({
            message: "Issue fetched successfully!",
            issue
        });
    } catch (err) {
        console.error(`error during fetching Issue: ${err.message}`);
        res.status(500).send("server error");
    }
};


module.exports = {getIssueById,getAllIssues,deleteIssueById,updateIssueById,createIssue};