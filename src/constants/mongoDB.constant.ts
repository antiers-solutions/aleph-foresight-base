const CREATE_DB_CONN = {
    ERROR_CONN: "Error while connecting to MongoDB:",
    CONN_TIMEOUT: 40000,
}
const BIND_CONN = {
    CONNECTING: "Connecting to mongodb server",
    CONNECTED: "MongoDB connected",
    DISCONNECTED: "MongoDB disconnected",
    ERROR: "MongoDB error: ",
    ERROR_BIND: "Error while binding the mongodb conncetion events: "

}

export {
    CREATE_DB_CONN,
    BIND_CONN
}