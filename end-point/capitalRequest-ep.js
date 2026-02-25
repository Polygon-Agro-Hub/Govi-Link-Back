const capitalRequesDao = require("../dao/capitalRequest-dao");
const asyncHandler = require("express-async-handler");

exports.getRequests = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  try {
    const requests = await capitalRequesDao.getCapitalRequest(officerId);

    res.status(200).json({
      status: "success",
      requests,
    });
  } catch (error) {
    console.error("Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});

exports.getRequestByid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const requests = await capitalRequesDao.getCapitalRequestById(id);
    res.status(200).json({
      status: "success",
      requests,
    });
  } catch (error) {
    console.error("Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});

exports.saveInspectionData = async (req, res) => {
  const { reqId, tableName } = req.body;
  if (!reqId || !tableName) {
    return res.status(400).json({
      success: false,
      message: "Invalid payload. Required: reqId, tableName",
    });
  }
  if (!capitalRequesDao.isValidTable(tableName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table name: ${tableName}`,
    });
  }

  try {
    const uploadFileToS3 = require("../middleware/s3upload");
    const deleteFromR2 = require("../middleware/s3delete");

    const exists = await capitalRequesDao.checkRecordExists(tableName, reqId);
    let dataToSave = { reqId };
    const fileConfig = capitalRequesDao.FILE_UPLOAD_TABLES[tableName];

    if (fileConfig) {
      let existingData = null;
      if (exists) {
        existingData = await capitalRequesDao.getInspectionData(
          tableName,
          reqId,
        );
      }
      for (const fieldName of fileConfig.fields) {
        if (fileConfig.isArray) {
          const uploadedUrls = [];
          if (req.files && req.files[fieldName]) {
            for (const file of req.files[fieldName]) {
              const fileUrl = await uploadFileToS3(
                file.buffer,
                file.originalname,
                fileConfig.folder,
              );
              uploadedUrls.push(fileUrl);
            }
          }
          const existingUrls = [];
          for (let i = 0; i < 20; i++) {
            const urlKey = `${fieldName}Url_${i}`;
            if (req.body[urlKey]) {
              existingUrls.push(req.body[urlKey]);
            }
          }
          const allUrls = [...existingUrls, ...uploadedUrls];
          dataToSave[fieldName] = JSON.stringify(allUrls);
        } else {
          const urlFieldName = `${fieldName}Url`;
          if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            if (existingData && existingData[fieldName]) {
              try {
                await deleteFromR2(existingData[fieldName]);
              } catch (err) {
                console.error(`Failed to delete old ${fieldName}:`, err);
              }
            }
            const fileBuffer = req.files[fieldName][0].buffer;
            const fileName = req.files[fieldName][0].originalname;
            const fileUrl = await uploadFileToS3(
              fileBuffer,
              fileName,
              fileConfig.folder,
            );
            dataToSave[fieldName] = fileUrl;
          } else if (req.body[urlFieldName]) {
            dataToSave[fieldName] = req.body[urlFieldName];
          } else if (existingData && existingData[fieldName]) {
            dataToSave[fieldName] = existingData[fieldName];
          }
        }
      }

      for (const [key, value] of Object.entries(req.body)) {
        if (key !== "reqId" && key !== "tableName" && !key.includes("Url_")) {
          dataToSave[key] = value;
        }
      }
    } else {
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== "reqId" && key !== "tableName") {
          dataToSave[key] = value;
        }
      }
    }
    let result;
    if (exists) {
      result = await capitalRequesDao.updateInspectionData(
        tableName,
        reqId,
        dataToSave,
      );
      result.operation = "update";
    } else {
      result = await capitalRequesDao.insertInspectionData(
        tableName,
        dataToSave,
      );
      result.operation = "insert";
    }

    res.status(200).json({
      success: true,
      message: `${tableName} ${result.operation}d successfully`,
      operation: result.operation,
      tableName: result.tableName,
      data: dataToSave,
    });
  } catch (error) {
    console.error(`Error saving to ${tableName}:`, error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message,
    });
  }
};

exports.getInspectionData = async (req, res) => {
  const { reqId, tableName } = req.query;

  if (!reqId || !tableName) {
    return res.status(400).json({
      success: false,
      message: "Invalid request. Required: reqId, tableName",
    });
  }

  if (!capitalRequesDao.isValidTable(tableName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table name: ${tableName}`,
    });
  }

  try {
    const data = await capitalRequesDao.getInspectionData(tableName, reqId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No data found for this request",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message,
    });
  }
};

exports.deleteInspectionData = async (req, res) => {
  const { reqId } = req.params;

  if (!reqId) {
    return res.status(400).json({
      success: false,
      message: "Invalid request. Required: reqId",
    });
  }

  try {
    const result = await capitalRequesDao.deleteAllInspectionData(reqId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "All inspection data deleted successfully",
        deletedTables: result.deletedTables,
        totalDeleted: result.totalDeleted,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete inspection data",
        error: result.error,
      });
    }
  } catch (error) {
    console.error(`Error deleting inspection data:`, error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message,
    });
  }
};

exports.confirmAndLeaveRequest = asyncHandler(async (req, res) => {
  const { reqId } = req.params;
  if (!reqId) {
    return res.status(400).json({
      success: false,
      message: "Request ID is required",
    });
  }
  try {
    const result = await capitalRequesDao.updateAuditedDate(reqId);

    res.status(200).json({
      success: true,
      message: "Request confirmed and audited date updated successfully",
      data: {
        reqId: result.reqId,
        auditedDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`Error confirming request:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm request",
      error: error.message,
    });
  }
});
