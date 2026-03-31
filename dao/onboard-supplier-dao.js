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

exports.createSupplier = (supplierName, contact, email, nic, officerId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const datePrefix = `GSID${yy}${mm}${dd}`;

            const insertSql = `
                INSERT INTO shopowners 
                    (ownername, shopPhone, email, nic, password, isPasswordChanged, isAvailable,
                     isActivated, currentPlan, accessStatus, onbordStatus,onbordedOfficer, activatedAt, createdAt)
                VALUES 
                    (?, ?, ?, ?, ?, 0, 1, 'active', 'Standard', 'Free Access', 'GoviLink',?, NOW(), NOW())
            `;

            db.govishop.query(
                insertSql,
                [supplierName, contact, email, nic, hashedPassword, officerId],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error("DB Insert Error:", insertErr);
                        return reject(insertErr);
                    }

                    const newId = insertResult.insertId;

                    const seqSql = `
                        SELECT regCode 
                        FROM shopowners 
                        WHERE regCode LIKE ? 
                        ORDER BY regCode DESC 
                        LIMIT 1
                    `;

                    db.govishop.query(seqSql, [`${datePrefix}%`], (seqErr, seqResult) => {
                        if (seqErr) {
                            console.error("DB Sequence Error:", seqErr);
                            return reject(seqErr);
                        }

                        let nextSeq = 1;
                        if (seqResult.length > 0 && seqResult[0].regCode) {
                            const lastCode = seqResult[0].regCode;
                            const lastSeq = parseInt(lastCode.slice(-3), 10);
                            if (!isNaN(lastSeq)) {
                                nextSeq = lastSeq + 1;
                            }
                        }

                        const regCode = `${datePrefix}${String(nextSeq).padStart(3, "0")}`;

                        const updateSql = `
                                UPDATE shopowners 
                                SET regCode = ? 
                                WHERE id = ?
                            `;

                        db.govishop.query(updateSql, [regCode, newId], (updateErr) => {
                            if (updateErr) {
                                console.error("DB Update regCode Error:", updateErr);
                                return reject(updateErr);
                            }

                            resolve({ insertId: newId, tempPassword, regCode });
                        });
                    });
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
