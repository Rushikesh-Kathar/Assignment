import { conn } from '../config/dbConn.js';


export const getAllUsers = async () => {

    const [rows] = await conn.execute(
        'SELECT id, name, email, age, mobile FROM users'
    );
    return rows;

};
