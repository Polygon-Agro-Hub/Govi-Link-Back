const capitalRequesDao = require("../dao/capitalRequest-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.getRequests = asyncHandler(async (req, res) => {
  const officerId = req.user.id;
  console.log("Officer ID:", officerId);

  try {
    const requests = await capitalRequesDao.getCapitalRequest(officerId);

    res.status(200).json({
      status: "success",
      requests

    });
  } catch (error) {
    console.error("❌ Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});

exports.getRequestByid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("request id", id);

  try {
    const requests = await capitalRequesDao.getCapitalRequestById(id);

    res.status(200).json({
      status: "success",
      requests

    });
  } catch (error) {
    console.error("❌ Error fetching visits:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch visits",
    });
  }
});


exports.saveInspectionData = async (req, res) => {
  const { reqId, tableName } = req.body;

  console.log(`📥 Received save request for ${tableName}:`, { reqId });
  console.log(`📦 Request body:`, req.body);
  console.log(`📁 Request files:`, req.files ? Object.keys(req.files) : 'No files');

  // Validate required fields
  if (!reqId || !tableName) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payload. Required: reqId, tableName'
    });
  }

  // ✅ Use the imported validation function
  if (!capitalRequesDao.isValidTable(tableName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table name: ${tableName}`
    });
  }

  try {
    const uploadFileToS3 = require('../Middlewares/s3upload');
    const deleteFromR2 = require('../Middlewares/s3delete');

    // Check if record exists
    const exists = await capitalRequesDao.checkRecordExists(tableName, reqId);
    console.log(`🔍 Record ${exists ? 'EXISTS' : 'DOES NOT EXIST'} for reqId: ${reqId}`);

    // Prepare data object
    let dataToSave = { reqId };

    // ✅ Check if this table supports file uploads
    const fileConfig = capitalRequesDao.FILE_UPLOAD_TABLES[tableName];

    if (fileConfig) {
      // ========== HANDLE FILE UPLOADS ==========
      console.log(`📁 Processing file uploads for ${tableName}`);

      let existingData = null;
      if (exists) {
        existingData = await capitalRequesDao.getInspectionData(tableName, reqId);
      }

      // Process each file field
      for (const fieldName of fileConfig.fields) {
        // ✅ Check if this is an array field (multiple images)
        if (fileConfig.isArray) {
          const uploadedUrls = [];

          // Upload new images
          if (req.files && req.files[fieldName]) {
            console.log(`📤 Uploading ${req.files[fieldName].length} new images`);
            for (const file of req.files[fieldName]) {
              const fileUrl = await uploadFileToS3(file.buffer, file.originalname, fileConfig.folder);
              uploadedUrls.push(fileUrl);
              console.log(`✅ Uploaded image: ${fileUrl}`);
            }
          }

          // Check for existing image URLs from body
          const existingUrls = [];
          for (let i = 0; i < 20; i++) {  // Check up to 20 existing images
            const urlKey = `${fieldName}Url_${i}`;
            if (req.body[urlKey]) {
              existingUrls.push(req.body[urlKey]);
              console.log(`🔗 Keeping existing image URL: ${req.body[urlKey]}`);
            }
          }

          // Combine existing and new URLs
          const allUrls = [...existingUrls, ...uploadedUrls];

          console.log(`📊 Total ${fieldName}: ${allUrls.length}`);

          // Store as JSON array
          dataToSave[fieldName] = JSON.stringify(allUrls);

        } else {
          // ========== Single file handling (for frontImg/backImg) ==========
          const urlFieldName = `${fieldName}Url`;

          // Check if new file uploaded
          if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
            console.log(`📤 Uploading new ${fieldName}`);

            // Delete old file if exists
            if (existingData && existingData[fieldName]) {
              try {
                await deleteFromR2(existingData[fieldName]);
                console.log(`🗑️ Deleted old ${fieldName}`);
              } catch (err) {
                console.error(`Failed to delete old ${fieldName}:`, err);
              }
            }

            // Upload new file
            const fileBuffer = req.files[fieldName][0].buffer;
            const fileName = req.files[fieldName][0].originalname;
            const fileUrl = await uploadFileToS3(fileBuffer, fileName, fileConfig.folder);
            dataToSave[fieldName] = fileUrl;
            console.log(`✅ Uploaded new ${fieldName}: ${fileUrl}`);
          }
          // Check if URL provided (already uploaded)
          else if (req.body[urlFieldName]) {
            dataToSave[fieldName] = req.body[urlFieldName];
            console.log(`🔗 Using existing ${fieldName} URL`);
          }
          // Keep existing file if updating
          else if (existingData && existingData[fieldName]) {
            dataToSave[fieldName] = existingData[fieldName];
            console.log(`♻️ Keeping existing ${fieldName}`);
          }
        }
      }

      // Add other non-file fields from body
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'reqId' && key !== 'tableName' && !key.includes('Url_')) {
          dataToSave[key] = value;
        }
      }
    } else {
      // ========== HANDLE REGULAR DATA (e.g., inspectionpersonal, inspectionfinance) ==========
      console.log(`📝 Processing regular data for ${tableName}`);

      // Copy all fields from body except reqId and tableName
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'reqId' && key !== 'tableName') {
          dataToSave[key] = value;
        }
      }
    }

    console.log(`💾 Data to save:`, dataToSave);

    // Perform INSERT or UPDATE
    let result;
    if (exists) {
      result = await capitalRequesDao.updateInspectionData(tableName, reqId, dataToSave);
      result.operation = 'update';
      console.log(`✅ UPDATED ${tableName} for reqId: ${reqId}`);
    } else {
      result = await capitalRequesDao.insertInspectionData(tableName, dataToSave);
      result.operation = 'insert';
      console.log(`✅ INSERTED into ${tableName} for reqId: ${reqId}`);
    }

    // Return response
    res.status(200).json({
      success: true,
      message: `${tableName} ${result.operation}d successfully`,
      operation: result.operation,
      tableName: result.tableName,
      data: dataToSave
    });
  } catch (error) {
    console.error(`❌ Error saving to ${tableName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};


exports.getInspectionData = async (req, res) => {
  const { reqId, tableName } = req.query;

  console.log(`🔍 Fetching ${tableName} for reqId: ${reqId}`);

  if (!reqId || !tableName) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request. Required: reqId, tableName'
    });
  }

  if (!capitalRequesDao.isValidTable(tableName)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table name: ${tableName}`
    });
  }

  try {
    const data = await capitalRequesDao.getInspectionData(tableName, reqId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this request'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};