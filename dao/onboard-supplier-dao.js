const db = require("../startup/database");
const bcrypt = require("bcryptjs");

const generateTempPassword = () => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

exports.createSupplier = (supplierName, contact, email, nic) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tempPassword = generateTempPassword();

            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const sql = `
        INSERT INTO shopowners 
          (ownername, shopPhone, email, nic, password, isPasswordChanged, isAvailable, isActivated, currentPlan, accessStatus ,onbordStatus,activatedAt, createdAt)
        VALUES 
          (?, ?, ?, ?, ?, 0, 1, 'active', 'Standard', 'Free Access', 'GoviLink', NOW(), NOW())
      `;

            db.govishop.query(
                sql,
                [supplierName, contact, email, nic, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error("DB Error:", err);
                        return reject(err);
                    }

                    resolve({ insertId: result.insertId, tempPassword });
                },
            );
        } catch (err) {
            reject(err);
        }
    });
};

exports.checkAlreadyExist = async (contact, email, nic) => {
    const query = (sql, params) =>
        new Promise((resolve, reject) => {
            db.govishop.query(sql, params, (err, results) => {
                if (err) return reject(new Error("Database error: " + err.message));
                resolve(results.length > 0);
            });
        });

    const [contactExists, emailExists, nicExists] = await Promise.all([
        query("SELECT id FROM shopowners WHERE shopPhone = ?", [contact]),
        query("SELECT id FROM shopowners WHERE email = ?", [email]),
        query("SELECT id FROM shopowners WHERE nic = ?", [nic]),
    ]);

    return { contactExists, emailExists, nicExists };
};
