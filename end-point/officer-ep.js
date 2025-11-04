const officerDao = require("../dao/officer-dao");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
exports.getOfficerVisits  = asyncHandler(async (req, res) => {
      const officerId = req.user.id;
      console.log(officerId)
      try{
      const officerVisits = await officerDao.getofficerVisits(officerId);
      
              res.status(200).json({
            status: "success",
            data: officerVisits,
          });
      }
      catch{

      }
})