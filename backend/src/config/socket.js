import { Server } from "socket.io";

let io;
const configuredOrigins = (process.env.FRONTEND_URL || "")
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);
const fallbackOrigins = ["http://localhost:5173", "http://localhost:5174"];
const allowedOrigins = new Set([...fallbackOrigins, ...configuredOrigins]);

function isAllowedOrigin(origin) {
	if (!origin) return true;
	return allowedOrigins.has(origin);
}

export function initSocket(server) {
	io = new Server(server, {
		cors: {
			origin(origin, callback) {
				if (isAllowedOrigin(origin)) {
					callback(null, true);
					return;
				}
				callback(new Error(`Socket CORS blocked for origin: ${origin}`));
			},
			methods: ["GET", "POST", "PATCH", "DELETE"]
		}
	});

	io.on("connection", (socket) => {
		socket.emit("system:hello", { message: "Connected to Saarthi live feed" });
	});

	return io;
}

export function getIo() {
	return io;
}
