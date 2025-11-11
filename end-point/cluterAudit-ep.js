const clusteAuditdao = require("../dao/cluterAudit-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const uploadFileToR2 = require('../Middlewares/s3upload');
const delectfilesOnR2 = require('../Middlewares/s3delete')

exports.getclusterVisits  = asyncHandler(async (req, res) => {
 const feildauditId = req.params.id
      console.log("hitt cluster audit visits", feildauditId)
      try{
      const clusterVisits = await clusteAuditdao.getclusterVisits(feildauditId);
      
              res.status(200).json({
            status: "success",
            data: clusterVisits,
          });
      }
      catch{

      }
})
