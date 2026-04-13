import RoomService from "../services/room.service.js";

const RoomController = {
  async joinRoom(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { sessionId } = req.params;

      const roomData = await RoomService.joinRoom(sessionId, userId, role);

      return res.status(200).json({
        success: true,
        message: "Room joined successfully.",
        data: roomData,
      });
    } catch (error) {
      next(error);
    }
  },

  async startRoom(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;

      const session = await RoomService.startRoom(sessionId, userId);

      return res.status(200).json({
        success: true,
        message: "Session started successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default RoomController;