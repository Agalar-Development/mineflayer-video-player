import sqlite from "sqlite3";

var db = sqlite.cached.Database(import.meta.dirname.split("\\").slice(0, -1).join("\\") + "\\default.db");

const ColorDB = async (table) => new Promise((resolve, reject) => {
    db.all(`SELECT ID,r,g,b,Color from ${table};`, (err, data) => resolve(data))
})

export { ColorDB }