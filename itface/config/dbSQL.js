const QUERY_SQL = `select * from t_user`;
const INSERT_SQL = `INSERT INTO t_user SET ?`;
const UPDATE_SQL = `UPDATE t_user SET username=? WHERE id=?`;
const DELETE_SQL = `DELETE FROM t_user WHERE id=?`;

module.exports = { QUERY_SQL, INSERT_SQL, UPDATE_SQL, DELETE_SQL };